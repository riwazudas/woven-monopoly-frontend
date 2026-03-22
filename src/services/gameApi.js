import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

const unwrapData = (response) => response?.data || {}

export const gameApi = {
  async createGame({ playerNames, goMoney, rentMultiplier, diceSequence }) {
    const response = await apiClient.post('/games', {
      player_names: playerNames,
      config: {
        go_money: goMoney,
        rent_multiplier: rentMultiplier,
        dice_sequence: diceSequence,
      },
    })

    return unwrapData(response)
  },

  async rollGame(gameId) {
    const response = await apiClient.post(`/games/${gameId}/moves/roll`)
    return unwrapData(response)
  },
}

export const extractSnapshot = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return payload.updated_game || payload.game || payload.updatedGame || payload
}

export const extractMoveMeta = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return payload.move_result || payload.moveMeta || payload.move_result_data || null
}
