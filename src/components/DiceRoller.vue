<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'

const sessionStore = useGameSessionStore()

const canRoll = computed(() => sessionStore.canRoll && !sessionStore.isGameOver)
const isRolling = computed(() => sessionStore.isRolling)
const players = computed(() => sessionStore.players)
const currentPlayerName = computed(() => sessionStore.currentPlayerName)
const currentPlayerNumber = computed(() => {
  const idx = players.value.findIndex((player) => player.name === currentPlayerName.value)
  return idx >= 0 ? idx + 1 : 'N/A'
})
const lastMove = computed(() => sessionStore.lastMove)
const movementEvent = computed(() => sessionStore.movementEvent)
const boardSize = computed(() => sessionStore.boardTiles.length)
const visualFace = ref(1)
let rollingTimer = null

const resolveRollFaceFromMove = (move, movement) => {
  if (!move) {
    if (!movement) {
      return null
    }
  }

  const direct = Number(move?.diceRoll ?? move?.raw?.dice_roll ?? move?.raw?.diceRoll ?? move?.raw?.roll)
  if (Number.isFinite(direct) && direct >= 1 && direct <= 6) {
    return Math.trunc(direct)
  }

  // Keep the displayed die synchronized with the actual animated movement.
  const previous = Number(movement?.from ?? move?.previousPosition)
  const next = Number(movement?.to ?? move?.newPosition)
  const tiles = Number(boardSize.value)

  if (!Number.isFinite(previous) || !Number.isFinite(next) || !Number.isFinite(tiles) || tiles <= 0) {
    return null
  }

  const delta = (next - previous + tiles) % tiles
  if (delta >= 1 && delta <= 6) {
    return delta
  }

  if (delta === 0 && previous === next && tiles >= 1 && tiles <= 6) {
    return tiles
  }

  return null
}

const stopRollingAnimation = () => {
  if (!rollingTimer) {
    return
  }

  clearInterval(rollingTimer)
  rollingTimer = null
}

watch(
  () => isRolling.value,
  (rollingNow) => {
    if (rollingNow) {
      stopRollingAnimation()
      rollingTimer = setInterval(() => {
        visualFace.value = Math.floor(Math.random() * 6) + 1
      }, 90)
      return
    }

    stopRollingAnimation()
    const backendFace = resolveRollFaceFromMove(lastMove.value, movementEvent.value)
    if (backendFace != null) {
      visualFace.value = backendFace
    }
  },
  { immediate: true },
)

watch(
  () => [lastMove.value, movementEvent.value],
  ([move, movement]) => {
    if (isRolling.value) {
      return
    }

    const backendFace = resolveRollFaceFromMove(move, movement)
    if (backendFace != null) {
      visualFace.value = backendFace
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  stopRollingAnimation()
})

const roll = async () => {
  await sessionStore.rollTurn()
}
</script>

<template>
  <section class="status-card dice-roller">
    <h2>Dice Roller</h2>
    <div class="dice-face" :class="{ 'dice-face-rolling': isRolling }" aria-hidden="true">
      {{ visualFace }}
    </div>
    <p><strong>Player Number:</strong> {{ currentPlayerNumber }}</p>
    <p><strong>Active Player:</strong> {{ currentPlayerName }}</p>
    <button class="btn primary" type="button" :disabled="!canRoll" @click="roll">
      {{ isRolling ? 'Rolling...' : 'Roll Dice' }}
    </button>
  </section>
</template>
