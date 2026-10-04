<p align="center">
  <img src="assets/brand/logo.svg" width="128" alt="Fablesheet logo">
</p>

<h1 align="center">Fablesheet</h1>

**A free, open-source, offline-first character manager for 5th edition tabletop roleplaying games.**

Create characters, track hit points, conditions, spells and inventory — everything is stored locally on your device. No account, no tracking, no internet required.

> 🚧 Fablesheet is in early development (pre-1.0). Expect rough edges and breaking changes.

## Features

- **Character builder** — step-by-step creation: race, class, ability scores, background and skills
- **Character sheet** — HP, temporary HP, death saves, hit dice, conditions and inspiration, saved automatically
- **Spellbook** — browse SRD spells by level and school, learn, forget and prepare spells
- **Inventory** — add items manually or from the SRD equipment catalog, carrying capacity, JSON import/export
- **Offline-first** — local SQLite database on desktop, works without a connection
- **Cross-platform** — Linux, Windows and macOS

## Installation

Download the latest build for your platform from the [Releases page](https://github.com/fablesheet/fablesheet/releases).

| Platform | Package                        |
| -------- | ------------------------------ |
| Windows  | `.msi` or `.exe` installer     |
| macOS    | `.dmg` (Apple Silicon + Intel) |
| Linux    | `.AppImage`, `.deb` or `.rpm`  |

Builds are not code-signed yet, so Windows SmartScreen and macOS Gatekeeper may show a warning. See the [installation guide](docs/installation.md) for how to continue.

## Development

Requirements: [Node.js](https://nodejs.org) ≥ 22, [Rust](https://rustup.rs) (stable) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
npm install          # install all workspace dependencies
npm run dev          # start the desktop app with hot reload
npm run dev:web      # frontend only, in the browser (uses localStorage)
npm test             # unit tests (Vitest)
npm run lint         # ESLint
npm run format       # Prettier
cargo test --workspace
```

### Repository layout

```
apps/
  desktop/        Tauri 2 desktop app (React 19, TypeScript, Tailwind CSS 4, SQLite)
  server/         Optional sync server (Rust, Axum) — work in progress
packages/
  core/           Shared TypeScript types for characters, spells and items
  srd-data/       Game content from the SRD 5.1 (spells, equipment)
```

## Contributing

Contributions are welcome — bug reports, feature ideas, code, translations and data fixes. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

Fablesheet is licensed under the [GNU General Public License v3.0 or later](LICENSE).

Game content in `packages/srd-data` is taken from the System Reference Document 5.1 and is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode). See [NOTICE](NOTICE) for attribution.

Fablesheet is an independent project. It is not affiliated with, endorsed, sponsored or approved by Wizards of the Coast LLC.
