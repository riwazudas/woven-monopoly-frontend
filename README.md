# Woven Monopoly Frontend

Server URL (play here): https://woven-monopoly-frontend-332081046644.asia-southeast3.run.app

Note: If you are using a deployed backend service, it may have scaled down after inactivity. Please allow a few seconds for the server to wake up when you first start the app and when you initialize a game from the setup screen.

This repository contains the Vue 3 frontend for the deterministic Woven Monopoly simulation.

The application is backend-driven: game state is created and advanced by API commands, and the frontend focuses on setup, turn actions, and rendering the latest returned snapshot.

## Local URLs

Run the backend server locally from:

- https://github.com/riwazudas/woven_monopoly_backend.git

Then use these local endpoints:

- Backend server URL: http://localhost:3000
- Backend API base path: http://localhost:3000/api
- Frontend dev URL: http://localhost:5173

## Tech Stack

- Vue 3 (Composition API)
- Vite
- Pinia (state management)
- Vue Router
- Axios
- Tailwind tooling available in project setup

## Features Included

1. Session setup flow
- Configure 4 player names.
- Configure go money and rent multiplier.
- Fetch and select roll file from GET /api/roll_files.
- Create game using POST /api/games.

2. Backend-driven turn progression
- Trigger next move via POST /api/games/:id/moves/roll.
- Replace the entire in-memory snapshot from each backend response.
- Keep UI synchronized from one shared state source.

3. Game board and status UI
- Board rendering from backend snapshot board data.
- Player positions and balances.
- Current turn/player context.
- Config summary (including selected roll file).

4. Event and feedback system
- Move summaries and alerts in a notification panel.
- Friendly handling for game-not-found, invalid move, and inactive game responses.

5. Session persistence
- Session state is saved in localStorage and hydrated on app load.
- Routes requiring active session are guarded and redirect to setup when needed.

6. Results and reset flow
- End-of-game results screen.
- Start-over flow that resets local session state.

## API Contract Used by Frontend

The frontend is aligned with the backend contract:

- GET /api/roll_files
  - Returns available roll file names.
- POST /api/games
  - Creates a game with optional config including roll_file.
- POST /api/games/:game_id/moves/roll
  - Advances one turn and returns full updated game state.

Key behavior:

- No dedicated game-state polling endpoint is required by the UI.
- Frontend uses updated_game from roll responses as source of truth.

## Design Choices

1) Full-snapshot state replacement

Each gameplay response is treated as authoritative and replaces the current snapshot in the Pinia store.

Why:

- Avoids complex partial merges.
- Reduces drift between client and server.
- Makes retry/recovery behavior predictable.

2) Normalization layer between API and UI

The store normalizes incoming fields (snake_case/camelCase variations and optional keys) before rendering.

Why:

- Keeps components simple.
- Isolates API-shape tolerance in one place.

3) Configuration-first setup UX

The setup page validates player names and numeric config before game creation, and now sources roll files from backend.

Why:

- Prevents invalid requests early.
- Keeps frontend options aligned with backend-allowed scenarios.

4) Session-oriented frontend flow

The app persists the latest session locally and enforces route guards for game/results pages.

Why:

- Better user experience on accidental reload.
- Clean navigation without requiring additional read endpoints.

5) Separation of concerns

- API calls are isolated in src/services/gameApi.js.
- Session and state transitions are managed in src/stores/gameSession.js.
- Views/components focus on rendering and interactions.

Why:

- Easier maintenance and testing.
- Cleaner ownership boundaries.

## AI-Assisted Development Note

AI tooling was used to generate an initial skeleton of the frontend.

That generated baseline was then refactored and updated to match project-specific requirements, including:

- Backend contract alignment for roll file selection.
- Store normalization and error classification behavior.
- Feature-specific UX and session flow updates.

## Local Setup and Run

## Prerequisites

- Node.js 20+
- npm 10+

## Install and start

```bash
# 1) Clone and enter project
git clone https://github.com/riwazudas/woven-monopoly-frontend.git
cd woven-monopoly-frontend

# 2) Install dependencies
npm install

# 3) Run in development
npm run dev
```

Vite will print the local URL, typically:

- http://localhost:5173

## Configure backend URL

Create a .env file at project root:

```bash
VITE_API_URL=http://localhost:3000/api
```

If VITE_API_URL is not set, the app defaults to /api.

## Production build and preview

```bash
npm run build
npm run preview
```

## Lint and format

```bash
npm run lint
npm run format
```

## Basic Usage Flow

1. Open setup page.
2. Frontend fetches roll files with GET /api/roll_files.
3. Submit setup to create game via POST /api/games.
4. Press roll to progress turns via POST /api/games/:game_id/moves/roll.
5. UI re-renders from each updated_game snapshot until completion.

## Project Structure

```text
src/
  components/     # Board grid, dice controls, notifications, player markers
  services/       # API client and payload extraction helpers
  stores/         # Pinia game session state and actions
  views/          # Landing, setup, board, results pages
  router/         # Route config and session guards
```

## Notes

- Gameplay rules are enforced by backend services; frontend renders and drives commands.
- The board definition JSON exists in this repo for local fallback and visual consistency.
- The app is intentionally single-session in browser context.
