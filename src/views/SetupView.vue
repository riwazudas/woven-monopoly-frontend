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

const beginGame = async () => {
  const config = {
    playerNames: [form.playerOne, form.playerTwo, form.playerThree, form.playerFour],
    goMoney: Number(form.goMoney),
    rentMultiplier: Number(form.rentMultiplier),
    diceSequence: parseDice(form.diceSequence),
  }

  await sessionStore.createGameSession(config)

  router.push({ name: 'board' })
}
</script>

<template>
  <section class="page setup">
    <div class="panel">
      <h1>Game Setup</h1>
      <p class="lead">Configure players and simulation settings before initializing the game.</p>
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
          <button class="btn primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Starting...' : 'Initialize Game' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
