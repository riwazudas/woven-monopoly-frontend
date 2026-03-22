<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameSessionStore } from '../stores/gameSession'

const router = useRouter()
const sessionStore = useGameSessionStore()

const winner = computed(() => sessionStore.winner || sessionStore.gameState?.winner || 'TBD')
const players = computed(() => sessionStore.gameState?.players || [])

const playAgain = () => {
  sessionStore.resetSession()
  router.push({ name: 'setup' })
}
</script>

<template>
  <section class="page results">
    <div class="panel">
      <p class="eyebrow">Game Complete</p>
      <h1>Winner: {{ winner }}</h1>
      <p class="lead">Final balances from the latest persisted game state.</p>

      <ul class="results-list">
        <li v-for="player in players" :key="player.name">
          <span>{{ player.name }}</span>
          <strong>${{ player.balance }}</strong>
        </li>
      </ul>

      <div class="actions">
        <RouterLink class="btn ghost" :to="{ name: 'board' }">Back To Board</RouterLink>
        <button class="btn primary" type="button" @click="playAgain">Start New Setup</button>
      </div>
    </div>
  </section>
</template>
