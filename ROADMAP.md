# Roadmap

Fablesheet aims to be a free, open-source alternative to commercial character platforms — for **many pen & paper games**, not just one. It stays offline-first: your characters live on your device, and an account is only needed if you want to sync or play with a group.

What makes it different:

- **Open source and no subscription required.** Your data belongs to you and can be exported at any time.
- **One tool for many games.** Deep support for selected systems, and a sheet builder for everything else.
- **Bring your own content.** Fablesheet only ships openly licensed rules. Content from other books can be entered by you, for yourself — Fablesheet never distributes it.

## Plan

| Step | What                                                                                                                                                                                                                                                                    | Status  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1    | **Game system architecture** — a system-independent core, the fifth edition rules as the first system module, character format with a `system` field                                                                                                                    | done    |
| 2    | **Dice engine for every game** — dice pools with successes, percentile roll-under, 3d20 checks, Hope/Fear dice, Fudge dice, exploding dice                                                                                                                              | done    |
| 3    | **Sheet builder and templates** — define attributes, skills, resources, formulas and rolls without code; share templates as files. First templates for narrative games (Fate, Blades in the Dark, Powered by the Apocalypse) and a template for 3d20 roll-under systems | planned |
| 4    | **Daggerheart** (Darrington Press Community Gaming License) as the second deep system                                                                                                                                                                                   | planned |
| 5    | **Pathfinder Second Edition** (ORC License) as the third deep system                                                                                                                                                                                                    | planned |
| 6    | **Accounts, sync and campaigns** — a self-hostable server, an optional hosted service, a game master view of the party and a shared dice log                                                                                                                            | planned |
| 7    | **Homebrew editor and content packs**, native iOS and Android apps                                                                                                                                                                                                      | planned |

Systems are added as modules: rules and openly licensed content in `packages/<system>` and `packages/<system>-srd`, screens in `apps/desktop/src/systems/<system>`. See [CONTRIBUTING](CONTRIBUTING.md#game-systems).

## Licensing of game content

Before content of a game is added, its license is checked. Games with an open license (for example SRD 5.1 / 5.2 under CC-BY-4.0, the ORC License, Creative Commons SRDs, the Cypher System Open License or the Year Zero Engine SRD license) can be shipped with attribution in [NOTICE](NOTICE). Games without one can only be played with user-made templates, and their names are never used as branding.

Ideas and feedback are welcome in the [issues](https://github.com/fablesheet/fablesheet/issues).
