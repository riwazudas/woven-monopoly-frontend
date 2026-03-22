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
</script>

<template>
  <div v-if="playersOnTile.length" class="marker-row">
    <span v-for="player in playersOnTile" :key="player.id" class="marker" :title="player.name">
      {{ player.name.slice(0, 1).toUpperCase() }}
    </span>
  </div>
</template>
