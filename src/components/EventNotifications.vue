<script setup>
import { computed } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'

const sessionStore = useGameSessionStore()

const notifications = computed(() => sessionStore.notifications)
const lastMove = computed(() => sessionStore.lastMove)

const dismiss = (id) => {
  sessionStore.dismissNotification(id)
}
</script>

<template>
  <section class="status-card notifications">
    <h2>Event Feed</h2>

    <p v-if="lastMove" class="lead">Last Move: {{ JSON.stringify(lastMove) }}</p>
    <p v-else class="lead">No move data yet.</p>

    <ul>
      <li v-for="notice in notifications" :key="notice.id" :class="['notice', `notice-${notice.variant}`]">
        <span>{{ notice.message }}</span>
        <button class="dismiss" type="button" @click="dismiss(notice.id)">Dismiss</button>
      </li>
    </ul>
  </section>
</template>
