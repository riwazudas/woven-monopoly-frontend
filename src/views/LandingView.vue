<template>
  <section class="page landing">
    <div class="panel hero-panel">
      <p class="eyebrow">Deterministic Board Game</p>
      <h1>Woven Monopoly</h1>
      <p class="lead">
        A backend-driven Monopoly simulation where every roll replaces the complete game state.
      </p>

      <div class="cta-row">
        <RouterLink class="btn primary" :to="{ name: 'setup' }">Start New Game</RouterLink>
        <RouterLink class="btn ghost" :to="{ name: 'board' }">Resume Last Session</RouterLink>
      </div>
    </div>

    <div class="panel instructions-panel">
      <h2>How This Frontend Works</h2>
      <ul>
        <li>Game setup posts once to <code>/api/games</code>.</li>
        <li>Each turn posts to <code>/api/games/:id/moves/roll</code>.</li>
        <li>Every response fully overwrites local UI state.</li>
        <li>No polling, no GET requests, no partial sync.</li>
      </ul>
    </div>
  </section>
</template>
