<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useGameSessionStore } from './stores/gameSession'

const sessionStore = useGameSessionStore()

onMounted(() => {
  sessionStore.hydrate()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" :to="{ name: 'landing' }">Woven Monopoly</RouterLink>
      <nav class="top-nav">
        <RouterLink :to="{ name: 'setup' }">Setup</RouterLink>
        <RouterLink :to="{ name: 'board' }">Board</RouterLink>
        <RouterLink :to="{ name: 'results' }">Results</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
