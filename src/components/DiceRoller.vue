<script setup>
import { computed } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'

const sessionStore = useGameSessionStore()

const canRoll = computed(() => sessionStore.canRoll && !sessionStore.isGameOver)
const isRolling = computed(() => sessionStore.isRolling)
const currentTurn = computed(() => sessionStore.currentTurn)

const roll = async () => {
  await sessionStore.rollTurn()
}
</script>

<template>
  <section class="status-card dice-roller">
    <h2>Dice Roller</h2>
    <p>Turn: {{ currentTurn + 1 }}</p>
    <button class="btn primary" type="button" :disabled="!canRoll" @click="roll">
      {{ isRolling ? 'Rolling...' : 'Roll Dice' }}
    </button>
  </section>
</template>
