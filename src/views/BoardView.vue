<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BoardGrid from '../components/BoardGrid.vue'
import DiceRoller from '../components/DiceRoller.vue'
import EventNotifications from '../components/EventNotifications.vue'
import { useGameSessionStore } from '../stores/gameSession'

const router = useRouter()
const sessionStore = useGameSessionStore()

const gameId = computed(() => sessionStore.gameId)
const config = computed(() => sessionStore.config)
const players = computed(() => sessionStore.players)
const winner = computed(() => sessionStore.winner)
const lastApiError = computed(() => sessionStore.lastApiError)

watch(
  () => lastApiError.value,
  (apiError) => {
    if (apiError?.type === 'game-not-found') {
      sessionStore.resetSession()
      router.push({ name: 'landing' })
    }
  },
)

const finishDemoGame = () => {
  if (!sessionStore.snapshot) {
    return
  }

  const decidedWinner = players.value[0]?.name || 'TBD'
  sessionStore.overwriteSnapshot({
    ...sessionStore.snapshot,
    status: 'finished',
    winner: decidedWinner,
  })
  sessionStore.addNotification(`Game finished. Winner: ${decidedWinner}`, 'success')
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
      <p v-if="winner" class="eyebrow">Winner locked: {{ winner }}</p>

      <div class="board-workspace">
        <aside class="board-sidebar">
          <div class="status-layout">
            <DiceRoller />
            <EventNotifications />

            <article class="status-card">
              <h2>Players</h2>
              <ul>
                <li v-for="player in players" :key="player.name">
                  <strong>{{ player.name }}</strong>
                  <span>${{ player.balance ?? player.money }}</span>
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
        </aside>

        <div class="board-canvas">
          <BoardGrid />
        </div>
      </div>

      <div class="actions">
        <RouterLink class="btn ghost" :to="{ name: 'setup' }">Adjust Setup</RouterLink>
        <button class="btn primary" type="button" @click="finishDemoGame">End Demo Game</button>
      </div>
    </div>
  </section>
</template>
