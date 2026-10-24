# Neon Data Heist

A top-down stealth heist game built with [Phaser 3](https://phaser.io/), TypeScript, and Vite. Infiltrate the KYOSHI-DELTA VAULT, grab the data, and exfiltrate before heat reaches critical levels.

## Play

```bash
npm install
npm run dev
```

Open the local dev server in your browser. Build for production with `npm run build` and preview with `npm run preview`.

## How to Play

- **Move:** `WASD` or Arrow Keys
- **Goal:** Collect data (fragments, vault, cache) and escape through an extraction door
- **Stealth:** Avoid drone vision cones and laser grids. Getting spotted increases heat
- **Heat System:** Heat rises passively over time and from getting spotted/hit by lasers. At 100%, lockdown begins with a 15-second escape window
- **Scoring:** Earn credits for stolen data + cold-escape bonus based on remaining heat headroom
- **Win:** Escape through extraction with any stolen data while not in lockdown
- **Lose:** Get caught by a drone or let lockdown expire

## Mission

**MISSION 01 — KYOSHI-DELTA VAULT**

Navigate a multi-room facility with:
- **5 data fragments** (80cr each)
- **1 vault jackpot** (500cr)
- **1 bonus cache** (600cr)
- **Patrolling drones** with vision cones (wave 2 spawns at 50% heat)
- **Timed laser grids** (become more aggressive at high heat, always on during lockdown)
- **3 extraction doors** on the west wall

## Tech Stack

- **Engine:** [Phaser 3](https://phaser.io/) (Arcade Physics)
- **Language:** TypeScript
- **Build:** Vite 8
- **Tests:** Vitest
- **Art:** Procedurally generated with Phaser Graphics (no external assets)

## Project Structure

```
src/
├── config/       # Game constants, level data, mission definitions
├── scenes/       # Boot, Menu, and Heist scenes
├── entities/     # Player entity
├── systems/      # Pure game logic (Heat, Mission, Drone, Vision)
├── ui/           # HUD and overlays
└── main.ts       # Game bootstrap
```

## Development

```bash
npm test          # Run tests
npm run build     # Type check and build
npm run dev       # Start dev server
```

## License

Private project.
