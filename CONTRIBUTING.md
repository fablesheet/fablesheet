# Contributing to Fablesheet

Thanks for your interest in improving Fablesheet! This document explains how to get set up and what we expect from contributions.

## Ways to contribute

- **Report bugs** — open an issue using the bug report template
- **Suggest features** — open an issue using the feature request template; for bigger ideas, start a discussion first
- **Write code** — pick an issue labelled `good first issue` or `help wanted`, and comment that you are working on it
- **Fix or add game data** — see [Game content rules](#game-content-rules) below

## Development setup

See the [Development section in the README](README.md#development).

## Workflow

1. Fork the repository and create a branch from `main` (e.g. `feat/spell-slots`, `fix/hp-rounding`).
2. Make your change. Keep pull requests focused — one topic per PR.
3. Make sure these pass locally:
   ```bash
   npm run typecheck
   npm run build
   cargo fmt --all --check
   cargo test --workspace
   ```
4. Open a pull request against `main` and fill in the template.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add spell slot tracking
fix(inventory): correct carrying capacity for small races
docs: explain SRD data layout
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

## Game content rules

Fablesheet may only ship game content that is published under an open license.

- ✅ Content from the **System Reference Document 5.1** (CC-BY-4.0)
- ❌ Content from other books (Player's Handbook, Xanathar's Guide, Tasha's Cauldron, …) that is not part of the SRD — this includes spells, subclasses, races, backgrounds, feats and items
- ❌ Official logos, artwork, character sheets or trade dress
- ❌ The names "Dungeons & Dragons" or "D&D" in the product name, UI branding or marketing

If you are unsure whether something is in the SRD, ask in the issue or PR before adding it.

## License of contributions

By submitting a contribution, you agree that it is licensed under the project's license (GPL-3.0-or-later), or CC-BY-4.0 for content in `packages/srd-data`.

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). Please be kind and constructive.
