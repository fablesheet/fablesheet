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
   npm run format:check
   npm run lint
   npm run typecheck
   npm test
   cargo fmt --all --check
   cargo clippy --workspace --all-targets -- -D warnings
   cargo test --workspace
   ```
4. Open a pull request against `main` and fill in the template. CI runs the same checks.
5. Pull requests are squash-merged, so the **PR title** becomes the commit message on `main` and must follow Conventional Commits (see below).

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add spell slot tracking
fix(inventory): correct carrying capacity for small races
docs: explain SRD data layout
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

Releases are automated with [release-please](https://github.com/googleapis/release-please): `feat` and `fix` commits on `main` end up in the changelog and determine the next version, so there is no need to edit `CHANGELOG.md` by hand.

## Translations

UI texts live in `apps/desktop/src/i18n/locales/<language>.json`. To add a language, copy `en.json`, translate the values (not the keys) and register it in `apps/desktop/src/i18n/index.ts`. A test checks that all languages have the same keys and placeholders.

Stored character data always uses the English terms (e.g. `"Lawful Good"`); translations only affect what is displayed.

## Game systems

Fablesheet supports several pen & paper games. The code is split into:

- `packages/core` — everything that works for every game: the character base, dice, combat rounds and timed effects, migrations and the character file format. Nothing in here may know about a specific game.
- `packages/<system>` and `packages/<system>-srd` — rules and openly licensed content of one game, e.g. `dnd5e` and `dnd5e-srd`.
- `apps/desktop/src/systems/<system>` — the screens of that game and its `GameSystemUI` definition (see `apps/desktop/src/systems/types.ts`), registered in `systems/registry.ts` and `systems/definitions.ts`.

Games that don't need their own code can be played with **sheet templates** (`packages/templates`): a template is data (sections, fields, rolls with formulas) and can be built in the app or shipped in `packages/templates/src/builtin`. New built-in templates need a test-clean definition and, if they follow an openly licensed game, its attribution in the template and in [NOTICE](NOTICE).

Each system has its own character format version and migration chain. See the [roadmap](ROADMAP.md) for the systems that are planned.

## Game content rules

Fablesheet may only ship game content that is published under an open license, and must follow that license (attribution in [NOTICE](NOTICE)).

- ✅ Content from openly licensed system reference documents, such as the **System Reference Document 5.1** (CC-BY-4.0)
- ❌ Content from other books that is not part of an open SRD — for 5e this includes the Player's Handbook, Xanathar's Guide, Tasha's Cauldron, … (spells, subclasses, races, backgrounds, feats and items)
- ❌ Official logos, artwork, character sheets or trade dress
- ❌ Trademarks such as "Dungeons & Dragons", "D&D" or "Das Schwarze Auge" in the product name, UI branding or marketing
- ✅ Games without an open license can still be played with templates the user fills in themselves — but Fablesheet never ships their texts or content

If you are unsure whether something is openly licensed, ask in the issue or PR before adding it.

## License of contributions

By submitting a contribution, you agree that it is licensed under the project's license (GPL-3.0-or-later), or the license of the game content it adds (e.g. CC-BY-4.0 for content in `packages/dnd5e-srd`).

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). Please be kind and constructive.
