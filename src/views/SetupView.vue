<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
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
  rollFile: 'rolls_1.json',
})

const isLoadingRollFiles = ref(false)
const rollFilesLoadError = ref('')

const trimmedNames = computed(() => {
  return [form.playerOne, form.playerTwo, form.playerThree, form.playerFour].map((name) => name.trim())
})

const rollFileOptions = computed(() => {
  const fromStore = Array.isArray(sessionStore.availableRollFiles) ? sessionStore.availableRollFiles : []

  if (fromStore.length > 0) {
    return fromStore
  }

  return ['rolls_1.json', 'rolls_2.json']
})

const loadRollFiles = async () => {
  isLoadingRollFiles.value = true
  rollFilesLoadError.value = ''

  const result = await sessionStore.fetchRollFiles()
  if (!result?.ok) {
    rollFilesLoadError.value = result?.error || 'Failed to load roll files from backend.'
  }

  const options = rollFileOptions.value
  if (!options.includes(form.rollFile)) {
    form.rollFile = options[0] || ''
  }

  isLoadingRollFiles.value = false
}

onMounted(() => {
  loadRollFiles()
})

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

  if (!form.rollFile) {
    return 'Please select a roll file.'
  }

  if (rollFileOptions.value.length > 0 && !rollFileOptions.value.includes(form.rollFile)) {
    return 'Selected roll file is not available.'
  }

  return ''
})

const canSubmit = computed(() => !isSubmitting.value && !isLoadingRollFiles.value && !setupValidationError.value)

const beginGame = async () => {
  if (setupValidationError.value) {
    return
  }

  const config = {
    playerNames: trimmedNames.value,
    goMoney: Number(form.goMoney),
    rentMultiplier: Number(form.rentMultiplier),
    rollFile: form.rollFile,
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
      <p v-if="rollFilesLoadError" class="error-text">{{ rollFilesLoadError }}</p>
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
          Roll File
          <select v-model="form.rollFile" :disabled="isLoadingRollFiles" required>
            <option v-for="rollFile in rollFileOptions" :key="rollFile" :value="rollFile">
              {{ rollFile }}
            </option>
          </select>
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
        <p><strong>Roll File:</strong> {{ form.rollFile || 'None' }}</p>
      </aside>
    </div>
  </section>
</template>
