<script setup>
import { computed } from 'vue'

const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  tileIndex: {
    type: Number,
    required: true,
  },
})

const playersOnTile = computed(() => {
  return props.players.filter((player) => Number(player.position) === props.tileIndex)
})

const markerColor = (name = '') => {
  const palette = ['#0f766e', '#b45309', '#0369a1', '#a21caf']
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
}
</script>

<template>
  <div v-if="playersOnTile.length" class="marker-row">
    <span
      v-for="player in playersOnTile"
      :key="player.id"
      class="marker"
      :title="player.name"
      :style="{ backgroundColor: markerColor(player.name) }"
    >
      {{ player.name.slice(0, 1).toUpperCase() }}
    </span>
  </div>
</template>
