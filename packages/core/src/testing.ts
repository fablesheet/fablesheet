import type { CharacterBase } from './types'
import type { GameSystemDefinition } from './migrations'

/** A tiny game system for tests of the core: version 1 adds `luck`, version 2 renames `hp` to `health`. */
export interface TestCharacter extends CharacterBase {
  system: 'test'
  luck: number
  health: number
}

export const testSystem: GameSystemDefinition<TestCharacter> = {
  id: 'test',
  schemaVersion: 2,
  migrations: [
    doc => ({ luck: 0, conditions: [], features: [], combat: null, notes: '', ...doc }),
    ({ hp, ...doc }) => ({ ...doc, health: hp ?? 10 }),
  ],
}
