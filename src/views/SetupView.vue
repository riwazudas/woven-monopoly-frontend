<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useGameSessionStore } from '../stores/gameSession'

const router = useRouter()
const sessionStore = useGameSessionStore()

const isSubmitting = computed(() => sessionStore.isInitializing)
const errorMessage = computed(() => sessionStore.errorMessage)

const form = reactive({
  playerOne: 'Peter',
  playerTwo: 'Billy',
  playerThree: 'Charlotte',
  playerFour: 'Sweedal',
  goMoney: 1,
  rentMultiplier: 1,
  diceSequence: '1,3,1,1,1,2',
})

const parseDice = (value) => {
  return value
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((value) => Number.isInteger(value) && value > 0)
}

const trimmedNames = computed(() => {
  return [form.playerOne, form.playerTwo, form.playerThree, form.playerFour].map((name) => name.trim())
})

const parsedDiceSequence = computed(() => parseDice(form.diceSequence))

const setupValidationError = computed(() => {
  if (trimmedNames.value.some((name) => !name)) {
    return 'All four player names are required.'
  }

  if (new Set(trimmedNames.value.map((name) => name.toLowerCase())).size !== 4) {
    return 'Player names must be unique.'
  }

  if (!Number.isInteger(Number(form.goMoney)) || Number(form.goMoney) < 1) {
    return 'GO money must be a positive whole number.'
  }

  if (!Number.isInteger(Number(form.rentMultiplier)) || Number(form.rentMultiplier) < 1) {
    return 'Rent multiplier must be a positive whole number.'
  }

  if (parsedDiceSequence.value.length === 0) {
    return 'Provide at least one valid dice value (comma-separated positive integers).'
  }

  return ''
})

const canSubmit = computed(() => !isSubmitting.value && !setupValidationError.value)

const beginGame = async () => {
  if (setupValidationError.value) {
    return
  }

  const config = {
    playerNames: trimmedNames.value,
    goMoney: Number(form.goMoney),
    rentMultiplier: Number(form.rentMultiplier),
    diceSequence: parsedDiceSequence.value,
  }

  const result = await sessionStore.createGameSession(config)
  if (result?.ok) {
    router.push({ name: 'board' })
  }
}
</script>

<template>
  <section class="page setup">
    <div class="panel">
      <h1>Game Setup</h1>
      <p class="lead">Configure players and simulation settings before initializing the game.</p>
      <p class="setup-hint">
        Submitting setup sends a backend request to create a game and returns the full initial snapshot.
      </p>
      <p v-if="setupValidationError" class="error-text">{{ setupValidationError }}</p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <form class="setup-form" @submit.prevent="beginGame">
        <label>
          Player 1
          <input v-model="form.playerOne" type="text" required />
        </label>
        <label>
          Player 2
          <input v-model="form.playerTwo" type="text" required />
        </label>
        <label>
          Player 3
          <input v-model="form.playerThree" type="text" required />
        </label>
        <label>
          Player 4
          <input v-model="form.playerFour" type="text" required />
        </label>
        <label>
          GO Money
          <input v-model.number="form.goMoney" type="number" min="1" step="1" required />
        </label>
        <label>
          Rent Multiplier
          <input
            v-model.number="form.rentMultiplier"
            type="number"
            min="1"
            step="1"
            required
          />
        </label>
        <label class="span-2">
          Dice Sequence
          <input v-model="form.diceSequence" type="text" placeholder="1,2,3,4" required />
        </label>

        <div class="actions span-2">
          <RouterLink class="btn ghost" :to="{ name: 'landing' }">Back</RouterLink>
          <button class="btn primary" type="submit" :disabled="!canSubmit">
            {{ isSubmitting ? 'Starting...' : 'Initialize Game' }}
          </button>
        </div>
      </form>

      <aside class="setup-preview">
        <h2>Preview</h2>
        <p><strong>Players:</strong> {{ trimmedNames.join(', ') }}</p>
        <p><strong>GO Money:</strong> ${{ Number(form.goMoney) }}</p>
        <p><strong>Rent Multiplier:</strong> x{{ Number(form.rentMultiplier) }}</p>
        <p><strong>Dice Sequence:</strong> {{ parsedDiceSequence.join(', ') || 'None' }}</p>
      </aside>
    </div>
  </section>
</template>
