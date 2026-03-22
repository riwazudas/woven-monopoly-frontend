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

export const useGameSessionStore = defineStore('gameSession', {
  state: () => ({
    gameId: null,
    config: { ...defaultConfig },
    snapshot: null,
    lastMove: null,
    notifications: [],
    isInitializing: false,
    isRolling: false,
    errorMessage: '',
  }),
  getters: {
    boardTiles: (state) => state.snapshot?.board || [],
    players: (state) => state.snapshot?.players || [],
    currentTurn: (state) => state.snapshot?.current_turn ?? 0,
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
      this.snapshot = normalizeSnapshot(snapshot, this.gameId, this.config)
      this.gameId = this.snapshot.id || this.snapshot.game_id || this.gameId
      this.lastMove = moveMeta
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
      } catch (error) {
        this.errorMessage = getErrorMessage(error)
        this.startLocalSession(config)
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

      try {
        const payload = await gameApi.rollGame(this.gameId)
        const updatedSnapshot = extractSnapshot(payload)

        if (!updatedSnapshot) {
          throw new Error('Roll response did not include updated_game.')
        }

        const moveMeta = extractMoveMeta(payload)
        this.overwriteSnapshot(updatedSnapshot, moveMeta)
        this.addNotification('Turn resolved and snapshot replaced.', 'success')
      } catch (error) {
        this.errorMessage = getErrorMessage(error)
        this.addNotification(this.errorMessage, 'danger')
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
