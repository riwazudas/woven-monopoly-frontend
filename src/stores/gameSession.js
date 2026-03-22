import { defineStore } from 'pinia'

const STORAGE_KEY = 'woven-monopoly-session'

export const useGameSessionStore = defineStore('gameSession', {
  state: () => ({
    gameId: null,
    config: {
      playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      goMoney: 200,
      rentMultiplier: 1,
      diceSequence: [1, 2, 3, 4],
    },
    gameState: null,
    lastMove: null,
    winner: null,
  }),
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },
    startSession({ gameId, config, gameState }) {
      this.gameId = gameId
      this.config = {
        ...this.config,
        ...config,
      }
      this.gameState = gameState || null
      this.lastMove = null
      this.winner = null
      this.persist()
    },
    replaceState({ updatedGame, moveMeta }) {
      this.gameState = updatedGame || null
      this.lastMove = moveMeta || null
      this.winner = updatedGame?.winner || null
      this.persist()
    },
    resetSession() {
      this.$reset()
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
