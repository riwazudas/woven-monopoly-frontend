<script setup>
import { computed } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'

const sessionStore = useGameSessionStore()

const notifications = computed(() => sessionStore.notifications)
const lastMove = computed(() => sessionStore.lastMove)

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
    return 'no action'
  }

  return normalized.replace(/_/g, ' ')
}

const moveSummary = computed(() => {
  const move = lastMove.value
  if (!move) {
    return null
  }

  const from = move.previousPosition
  const to = move.newPosition
  const action = formatActionText(move.action)
  const tileName = move.tileLandedOn?.name || move.tileLandedOn || 'a tile'
  const money = move.moneyChange
  const moneyText = typeof money === 'number' && money !== 0 ? ` (${money > 0 ? '+' : ''}$${money})` : ''
  const actor = move.playerName || 'Current player'

  if (from != null && to != null) {
    return `${actor} moved ${from} -> ${to}, ${action} on ${tileName}${moneyText}`
  }

  return `${actor} ${action} on ${tileName}${moneyText}`
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
