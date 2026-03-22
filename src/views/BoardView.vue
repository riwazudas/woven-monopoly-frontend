<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameSessionStore } from '../stores/gameSession'

const router = useRouter()
const sessionStore = useGameSessionStore()

const gameId = computed(() => sessionStore.gameId)
const config = computed(() => sessionStore.config)
const players = computed(() => sessionStore.gameState?.players || [])

const finishDemoGame = () => {
  sessionStore.winner = players.value[0]?.name || 'TBD'
  sessionStore.persist()
  router.push({ name: 'results' })
}
</script>

<template>
  <section class="page board">
    <div class="panel">
      <h1>Game Board</h1>
      <p class="lead">
        Session <code>{{ gameId }}</code>
      </p>

      <div class="board-grid" role="presentation">
        <div v-for="n in 16" :key="n" class="board-tile">Tile {{ n - 1 }}</div>
      </div>

      <div class="status-layout">
        <article class="status-card">
          <h2>Players</h2>
          <ul>
            <li v-for="player in players" :key="player.name">
              <strong>{{ player.name }}</strong>
              <span>${{ player.balance }}</span>
              <small>Position {{ player.position }}</small>
            </li>
          </ul>
        </article>

        <article class="status-card">
          <h2>Current Config</h2>
          <p>GO Money: ${{ config.goMoney }}</p>
          <p>Rent Multiplier: x{{ config.rentMultiplier }}</p>
          <p>Dice Sequence: {{ config.diceSequence.join(', ') }}</p>
        </article>
      </div>

      <div class="actions">
        <RouterLink class="btn ghost" :to="{ name: 'setup' }">Adjust Setup</RouterLink>
        <button class="btn primary" type="button" @click="finishDemoGame">End Demo Game</button>
      </div>
    </div>
  </section>
</template>
