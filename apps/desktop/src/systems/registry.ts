import type { CharacterBase } from '@fablesheet/core'
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import { dnd5e } from './dnd5e'
import type { GameSystemUI } from './types'

/** A character of any game system Fablesheet knows */
export type AnyCharacter = Dnd5eCharacter

/** Game systems available in the app, in the order they are offered */
export const SYSTEMS: readonly GameSystemUI[] = [dnd5e as unknown as GameSystemUI]

/** The game system of a character. Characters are only loaded for known systems. */
export function systemFor<C extends CharacterBase>(character: C): GameSystemUI<C> {
  const system = SYSTEMS.find(s => s.definition.id === character.system)
  if (!system) throw new Error(`Unknown game system: ${character.system}`)
  return system as unknown as GameSystemUI<C>
}
