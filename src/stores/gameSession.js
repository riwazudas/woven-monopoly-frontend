import { defineStore } from 'pinia'
import { extractMoveMeta, extractSnapshot, gameApi } from '../services/gameApi'
import boardDefinition from '../../board.json'

const STORAGE_KEY = 'woven-monopoly-session'
const DEFAULT_STARTING_BALANCE = 16

const defaultConfig = {
  playerNames: ['Peter', 'Billy', 'Charlotte', 'Sweedal'],
  goMoney: 1,
  rentMultiplier: 1,
  diceSequence: [1, 3, 1, 1, 1, 2],
}

const makeFallbackBoard = () => {
  return boardDefinition.map((tile, index) => ({
    ...tile,
    id: index,
    position: index,
  }))
}

const normalizePlayers = (players, config) => {
  if (!Array.isArray(players) || players.length === 0) {
    return config.playerNames.map((name, index) => ({
      id: `p-${index + 1}`,
      name,
      balance: DEFAULT_STARTING_BALANCE,
      money: DEFAULT_STARTING_BALANCE,
      position: 0,
      is_bankrupt: false,
    }))
  }

  return players.map((player, index) => ({
    id: player.id || player.player_id || `p-${index + 1}`,
    name: player.name || config.playerNames[index] || `Player ${index + 1}`,
    balance: player.balance ?? player.money ?? DEFAULT_STARTING_BALANCE,
    money: player.money ?? player.balance ?? DEFAULT_STARTING_BALANCE,
    position: player.position ?? player.current_position ?? 0,
    is_bankrupt: Boolean(player.is_bankrupt || player.bankrupt),
  }))
}

const normalizeBoard = (board) => {
  if (!Array.isArray(board) || board.length === 0) {
    return makeFallbackBoard()
  }

  return board.map((tile, index) => ({
    ...tile,
    id: tile.id ?? index,
    position: tile.position ?? index,
  }))
}

const normalizeSnapshot = (snapshot, gameId, config) => {
  const incoming = snapshot || {}

  return {
    ...incoming,
    id: incoming.id || incoming.game_id || gameId || null,
    game_id: incoming.game_id || incoming.id || gameId || null,
    status: incoming.status || 'active',
    board: normalizeBoard(incoming.board),
    players: normalizePlayers(incoming.players, config),
    current_turn: incoming.current_turn ?? incoming.turn ?? 0,
    winner: incoming.winner || null,
    config: {
      go_money: incoming.config?.go_money ?? config.goMoney,
      rent_multiplier: incoming.config?.rent_multiplier ?? config.rentMultiplier,
      dice_sequence: incoming.config?.dice_sequence ?? config.diceSequence,
      player_names: incoming.config?.player_names ?? config.playerNames,
    },
  }
}

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Unexpected error while updating game state.'
  )
}

const classifyApiError = (error, context = 'unknown') => {
  const status = error?.response?.status
  const message = String(getErrorMessage(error) || '').toLowerCase()

  if (status === 404) {
    return {
      type: 'game-not-found',
      context,
      status,
      message: getErrorMessage(error),
    }
  }

  if (context === 'roll' && (status === 409 || message.includes('inactive') || message.includes('finished'))) {
    return {
      type: 'game-inactive',
      context,
      status,
      message: getErrorMessage(error),
    }
  }

  if (context === 'roll' && (status === 400 || status === 422 || message.includes('invalid move'))) {
    return {
      type: 'invalid-move',
      context,
      status,
      message: getErrorMessage(error),
    }
  }

  return {
    type: 'unknown',
    context,
    status,
    message: getErrorMessage(error),
  }
}

const normalizeMoveMeta = (moveMeta) => {
  if (!moveMeta || typeof moveMeta !== 'object') {
    return null
  }

  return {
    previousPosition:
      moveMeta.previous_position ?? moveMeta.previous_pos ?? moveMeta.previousPosition ?? null,
    newPosition: moveMeta.new_position ?? moveMeta.new_pos ?? moveMeta.newPosition ?? null,
    diceRoll:
      moveMeta.dice_roll ??
      moveMeta.diceRoll ??
      moveMeta.roll_value ??
      moveMeta.rollValue ??
      moveMeta.roll ??
      null,
    action: moveMeta.action_required ?? moveMeta.action ?? moveMeta.actionType ?? null,
    moneyChange: moveMeta.money_change ?? moveMeta.moneyChange ?? null,
    tileLandedOn: moveMeta.tile_landed_on ?? moveMeta.tileLandedOn ?? null,
    playerId: moveMeta.player_id ?? moveMeta.playerId ?? null,
    playerName: moveMeta.player_name ?? moveMeta.playerName ?? null,
    passedGo: Boolean(moveMeta.passed_go ?? moveMeta.passedGo),
    raw: moveMeta,
  }
}

const formatActionText = (action) => {
  const normalized = String(action || '')
    .trim()
    .toLowerCase()

  if (!normalized) {
    return 'resolved the turn'
  }

  if (normalized.includes('buy')) {
    return 'bought property'
  }

  if (normalized.includes('rent') || normalized.includes('pay')) {
    return 'paid rent'
  }

  if (normalized.includes('none') || normalized.includes('no_action') || normalized.includes('no action')) {
    return 'took no action'
  }

  return normalized.replace(/_/g, ' ')
}

const buildMoveSummary = (moveMeta, movementEvent) => {
  if (!moveMeta && !movementEvent) {
    return null
  }

  const actor = movementEvent?.playerName || moveMeta?.playerName || 'Current player'
  const from = movementEvent?.from ?? moveMeta?.previousPosition
  const to = movementEvent?.to ?? moveMeta?.newPosition
  const tileName = moveMeta?.tileLandedOn?.name || moveMeta?.tileLandedOn || 'a tile'
  const action = formatActionText(moveMeta?.action)
  const money = moveMeta?.moneyChange
  const moneyText = typeof money === 'number' && money !== 0 ? ` (${money > 0 ? '+' : ''}$${money})` : ''
  const passGoText = moveMeta?.passedGo ? ' and passed GO' : ''

  if (from != null && to != null) {
    return `${actor} moved ${from} -> ${to}${passGoText}, ${action} at ${tileName}${moneyText}.`
  }

  return `${actor} ${action} at ${tileName}${moneyText}.`
}

export const useGameSessionStore = defineStore('gameSession', {
  state: () => ({
    gameId: null,
    config: { ...defaultConfig },
    snapshot: null,
    lastMove: null,
    notifications: [],
    movementEvent: null,
    lastApiError: null,
    isInitializing: false,
    isRolling: false,
    errorMessage: '',
  }),
  getters: {
    boardTiles: (state) => state.snapshot?.board || [],
    players: (state) => state.snapshot?.players || [],
    currentTurn: (state) => state.snapshot?.current_turn ?? 0,
    turnNumber: (state) =>
      state.snapshot?.turn_number ?? state.snapshot?.turnNumber ?? (state.snapshot?.current_turn ?? 0) + 1,
    currentPlayerId: (state) =>
      state.snapshot?.current_player_id ?? state.snapshot?.currentPlayerId ?? state.snapshot?.current_player?.id,
    currentPlayerName: (state) => {
      const explicitName = state.snapshot?.current_player?.name ?? state.snapshot?.currentPlayer?.name
      if (explicitName) {
        return explicitName
      }

      const players = state.snapshot?.players || []
      if (!players.length) {
        return 'N/A'
      }

      const explicitId = state.snapshot?.current_player_id ?? state.snapshot?.currentPlayerId
      if (explicitId != null) {
        const matched = players.find((player) => String(player.id) === String(explicitId))
        if (matched) {
          return matched.name
        }
      }

      const idx = (state.snapshot?.current_turn ?? 0) % players.length
      return players[idx]?.name || 'N/A'
    },
    winner: (state) => state.snapshot?.winner || null,
    isGameOver: (state) => Boolean(state.snapshot?.winner) || state.snapshot?.status === 'finished',
    canRoll: (state) => Boolean(state.gameId) && !state.isRolling && !state.isInitializing,
  },
  actions: {
    hydrate() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return
      }

      try {
        const parsed = JSON.parse(raw)
        this.$patch(parsed)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    persist() {
      const persistedState = {
        gameId: this.gameId,
        config: this.config,
        snapshot: this.snapshot,
        lastMove: this.lastMove,
        notifications: this.notifications,
        movementEvent: this.movementEvent,
        lastApiError: this.lastApiError,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState))
    },
    addNotification(message, variant = 'info') {
      this.notifications.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        message,
        variant,
      })

      this.notifications = this.notifications.slice(0, 6)
      this.persist()
    },
    dismissNotification(id) {
      this.notifications = this.notifications.filter((item) => item.id !== id)
      this.persist()
    },
    overwriteSnapshot(snapshot, moveMeta = null) {
      const previousSnapshot = this.snapshot
      this.snapshot = normalizeSnapshot(snapshot, this.gameId, this.config)
      this.gameId = this.snapshot.id || this.snapshot.game_id || this.gameId
      const normalizedMove = normalizeMoveMeta(moveMeta)
      this.lastMove = normalizedMove

      let movementEvent = null
      if (this.snapshot?.players?.length) {
        const nextPlayers = this.snapshot.players
        const previousPlayers = previousSnapshot?.players || []

        const previousById = new Map(previousPlayers.map((player) => [String(player.id), player]))

        let movedPlayer = null
        if (normalizedMove?.playerId != null) {
          movedPlayer = nextPlayers.find((player) => String(player.id) === String(normalizedMove.playerId)) || null
        }
        if (!movedPlayer && normalizedMove?.playerName) {
          movedPlayer = nextPlayers.find((player) => player.name === normalizedMove.playerName) || null
        }
        if (!movedPlayer) {
          movedPlayer =
            nextPlayers.find((player) => {
              const prior = previousById.get(String(player.id))
              return prior && Number(prior.position) !== Number(player.position)
            }) || null
        }

        if (movedPlayer) {
          const priorPlayer = previousById.get(String(movedPlayer.id))
          movementEvent = {
            playerId: movedPlayer.id,
            playerName: movedPlayer.name,
            from:
              normalizedMove?.previousPosition ??
              (priorPlayer ? Number(priorPlayer.position) : Number(movedPlayer.position)),
            to: normalizedMove?.newPosition ?? Number(movedPlayer.position),
            at: Date.now(),
          }

          if (!this.lastMove) {
            this.lastMove = {
              previousPosition: movementEvent.from,
              newPosition: movementEvent.to,
              action: null,
              moneyChange: null,
              tileLandedOn: null,
              playerId: movementEvent.playerId,
              playerName: movementEvent.playerName,
              passedGo: movementEvent.to < movementEvent.from,
              diceRoll: null,
              raw: null,
            }
          }
        }
      }

      this.movementEvent = movementEvent
      this.persist()
    },
    startLocalSession(config) {
      const localId = `local-${Date.now()}`
      this.config = {
        ...defaultConfig,
        ...config,
      }

      this.gameId = localId
      this.overwriteSnapshot(
        {
          id: localId,
          status: 'active',
          board: makeFallbackBoard(),
          players: normalizePlayers([], this.config),
          current_turn: 0,
          winner: null,
        },
        null,
      )

      this.addNotification('Started a local preview session. Connect backend for live rolls.', 'warning')
    },
    async createGameSession(config) {
      this.isInitializing = true
      this.errorMessage = ''
      this.lastApiError = null
      this.config = {
        ...defaultConfig,
        ...config,
      }

      try {
        const payload = await gameApi.createGame(this.config)
        const snapshot = extractSnapshot(payload)

        if (!snapshot) {
          throw new Error('Create game response did not include a valid snapshot.')
        }

        this.gameId = snapshot.id || snapshot.game_id || this.gameId
        this.overwriteSnapshot(snapshot, extractMoveMeta(payload))
        this.addNotification('Game initialized from backend.', 'success')
        return { ok: true, source: 'backend' }
      } catch (error) {
        const apiError = classifyApiError(error, 'create')
        this.lastApiError = apiError
        this.errorMessage = apiError.message
        this.addNotification(this.errorMessage, 'danger')
        return { ok: false, source: 'backend', error: this.errorMessage }
      } finally {
        this.isInitializing = false
      }
    },
    async rollTurn() {
      if (!this.gameId || this.isRolling) {
        return
      }

      if (String(this.gameId).startsWith('local-')) {
        this.addNotification('Roll endpoint unavailable in local preview session.', 'warning')
        return
      }

      this.isRolling = true
      this.errorMessage = ''
      this.lastApiError = null

      try {
        const payload = await gameApi.rollGame(this.gameId)
        const updatedSnapshot = extractSnapshot(payload)

        if (!updatedSnapshot) {
          throw new Error('Roll response did not include updated_game.')
        }

        const moveMeta = extractMoveMeta(payload)
        this.overwriteSnapshot(updatedSnapshot, moveMeta)

        const summary = buildMoveSummary(this.lastMove, this.movementEvent)
        this.addNotification(summary || 'Turn resolved and snapshot replaced.', 'success')
      } catch (error) {
        const apiError = classifyApiError(error, 'roll')
        this.lastApiError = apiError
        this.errorMessage = apiError.message

        if (apiError.type === 'game-inactive') {
          this.addNotification('Game is inactive. No more moves can be rolled.', 'warning')
        } else if (apiError.type === 'invalid-move') {
          this.addNotification('Invalid move received from backend. Please try again.', 'warning')
        } else {
          this.addNotification(this.errorMessage, 'danger')
        }
      } finally {
        this.isRolling = false
      }
    },
    startSession({ gameId, config, gameState }) {
      this.gameId = gameId
      this.config = {
        ...defaultConfig,
        ...config,
      }
      this.overwriteSnapshot(gameState || null, null)
    },
    resetSession() {
      this.$reset()
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
