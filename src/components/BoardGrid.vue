<script setup>
import { computed, ref } from 'vue'
import { useGameSessionStore } from '../stores/gameSession'
import PlayerMarkers from './PlayerMarkers.vue'

const sessionStore = useGameSessionStore()

const tiles = computed(() => sessionStore.boardTiles)
const players = computed(() => sessionStore.players)
const activeTileId = ref(null)

const ownerPalette = ['#0f766e', '#b45309', '#0369a1', '#a21caf']

const boardDimension = computed(() => {
  const tileCount = tiles.value.length
  if (tileCount <= 4) {
    return 3
  }

  return Math.ceil(tileCount / 4) + 1
})

const perimeterCoordinates = computed(() => {
  const size = boardDimension.value
  const coords = []

  for (let column = 1; column <= size; column += 1) {
    coords.push({ row: 1, column })
  }

  for (let row = 2; row <= size; row += 1) {
    coords.push({ row, column: size })
  }

  for (let column = size - 1; column >= 1; column -= 1) {
    coords.push({ row: size, column })
  }

  for (let row = size - 1; row >= 2; row -= 1) {
    coords.push({ row, column: 1 })
  }

  return coords
})

const playersById = computed(() => {
  const map = new Map()
  players.value.forEach((player, index) => {
    map.set(String(player.id), {
      ...player,
      ownerColor: ownerPalette[index % ownerPalette.length],
    })
  })

  return map
})

const ownershipByTile = computed(() => {
  const map = new Map()

  players.value.forEach((player, index) => {
    const owned = player.owned_properties || player.ownedProperties || player.properties || []
    owned.forEach((tileRef) => {
      map.set(String(tileRef), {
        ...player,
        ownerColor: ownerPalette[index % ownerPalette.length],
      })
    })
  })

  return map
})

const resolveOwner = (tile) => {
  if (tile.owner_id != null) {
    return playersById.value.get(String(tile.owner_id)) || null
  }

  if (tile.owner?.id != null) {
    return playersById.value.get(String(tile.owner.id)) || tile.owner
  }

  if (typeof tile.owner === 'string') {
    return players.value.find((player) => player.name === tile.owner) || null
  }

  return ownershipByTile.value.get(String(tile.id)) || ownershipByTile.value.get(String(tile.position)) || null
}

const tilePlacements = computed(() => {
  return tiles.value.map((tile, index) => {
    const coord = perimeterCoordinates.value[index]
    const owner = resolveOwner(tile)

    return {
      ...tile,
      row: coord?.row || 1,
      column: coord?.column || 1,
      owner,
    }
  })
})

const activeTile = computed(() => {
  if (!tilePlacements.value.length) {
    return null
  }

  if (activeTileId.value == null) {
    return tilePlacements.value[0]
  }

  return tilePlacements.value.find((tile) => String(tile.id) === String(activeTileId.value)) || tilePlacements.value[0]
})

const inspectorRent = computed(() => {
  if (!activeTile.value) {
    return 'N/A'
  }

  if (activeTile.value.rent != null) {
    return `$${activeTile.value.rent}`
  }

  if (activeTile.value.type === 'property' && activeTile.value.price != null) {
    return `$${activeTile.value.price * Number(sessionStore.config.rentMultiplier || 1)}`
  }

  return 'N/A'
})

const setActiveTile = (tileId) => {
  activeTileId.value = tileId
}

const boardGridStyle = computed(() => {
  const size = boardDimension.value
  return {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
  }
})

const boardCenterStyle = computed(() => {
  const span = Math.max(1, boardDimension.value - 2)
  return {
    gridColumn: `2 / span ${span}`,
    gridRow: `2 / span ${span}`,
  }
})
</script>

<template>
  <section class="board-shell">
    <div class="board-grid board-grid-square" role="presentation" :style="boardGridStyle">
      <article
        v-for="tile in tilePlacements"
        :key="tile.id"
        class="board-tile"
        :class="{ 'board-tile-owned': Boolean(tile.owner), 'board-tile-active': activeTile?.id === tile.id }"
        :style="{
          gridColumn: tile.column,
          gridRow: tile.row,
          '--tile-owner': tile.owner?.ownerColor || '#d5c9af',
        }"
        tabindex="0"
        @mouseenter="setActiveTile(tile.id)"
        @focus="setActiveTile(tile.id)"
        @click="setActiveTile(tile.id)"
      >
        <header>
          <strong>{{ tile.name }}</strong>
          <small>#{{ tile.position }}</small>
        </header>

        <div class="tile-meta-row">
          <span class="tile-type-badge">{{ tile.type }}</span>
          <span v-if="tile.colour" class="tile-colour-chip" :style="{ backgroundColor: tile.colour.toLowerCase() }">
            {{ tile.colour }}
          </span>
        </div>

        <p>Price: {{ tile.price != null ? `$${tile.price}` : 'N/A' }}</p>
        <p>Owner: {{ tile.owner?.name || 'Bank' }}</p>
        <PlayerMarkers :players="players" :tile-index="tile.position" />
      </article>

      <div class="board-center" :style="boardCenterStyle">
        <h3>Woven Monopoly</h3>
        <p>Clockwise snapshot-driven board</p>
      </div>
    </div>

    <article v-if="activeTile" class="status-card tile-inspector">
      <h2>Tile Details</h2>
      <p><strong>Name:</strong> {{ activeTile.name }}</p>
      <p><strong>Type:</strong> {{ activeTile.type }}</p>
      <p><strong>Price:</strong> {{ activeTile.price != null ? `$${activeTile.price}` : 'N/A' }}</p>
      <p><strong>Rent:</strong> {{ inspectorRent }}</p>
      <p><strong>Owner:</strong> {{ activeTile.owner?.name || 'Bank' }}</p>
      <p><strong>Colour:</strong> {{ activeTile.colour || 'None' }}</p>
    </article>
  </section>
</template>
