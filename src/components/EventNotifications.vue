<script setup>
import { computed } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'

const sessionStore = useGameSessionStore()

const notifications = computed(() => sessionStore.notifications)
const lastMove = computed(() => sessionStore.lastMove)

const moveSummary = computed(() => {
  const move = lastMove.value
  if (!move) {
    return null
  }

  const from = move.previousPosition
  const to = move.newPosition
  const action = move.action || 'resolved turn'
  const tileName = move.tileLandedOn?.name || move.tileLandedOn || 'a tile'
  const money = move.moneyChange
  const moneyText = typeof money === 'number' && money !== 0 ? ` (${money > 0 ? '+' : ''}$${money})` : ''

  if (from != null && to != null) {
    return `Moved ${from} -> ${to}, ${action} on ${tileName}${moneyText}`
  }

  return `${action} on ${tileName}${moneyText}`
})

const dismiss = (id) => {
  sessionStore.dismissNotification(id)
}
</script>

<template>
  <section class="status-card notifications">
    <h2>Event Feed</h2>

    <p v-if="moveSummary" class="lead">Last Move: {{ moveSummary }}</p>
    <p v-else class="lead">No move data yet.</p>

    <ul>
      <li v-for="notice in notifications" :key="notice.id" :class="['notice', `notice-${notice.variant}`]">
        <span>{{ notice.message }}</span>
        <button class="dismiss" type="button" @click="dismiss(notice.id)">Dismiss</button>
      </li>
    </ul>
  </section>
</template>
