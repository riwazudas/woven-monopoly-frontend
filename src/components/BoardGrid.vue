<script setup>
import { computed } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'
import PlayerMarkers from './PlayerMarkers.vue'

const sessionStore = useGameSessionStore()

const tiles = computed(() => sessionStore.boardTiles)
const players = computed(() => sessionStore.players)
</script>

<template>
  <div class="board-grid" role="presentation">
    <article v-for="tile in tiles" :key="tile.id" class="board-tile">
      <header>
        <strong>{{ tile.name }}</strong>
        <small>#{{ tile.position }}</small>
      </header>
      <p>{{ tile.type }}</p>
      <PlayerMarkers :players="players" :tile-index="tile.position" />
    </article>
  </div>
</template>
