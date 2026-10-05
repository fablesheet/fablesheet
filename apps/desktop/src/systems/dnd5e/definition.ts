import type { GameSystemDefinition } from '@fablesheet/core'
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import { dnd5eDefinition } from '@fablesheet/dnd5e'
import { withCatalogStats } from '@fablesheet/dnd5e-srd'

/** Reading and upgrading 5e characters, including data from the SRD catalogs. */
export const dnd5eSystemDefinition: GameSystemDefinition<Dnd5eCharacter> = {
  ...dnd5eDefinition,
  // Items saved before weapon and armor stats existed get them from the catalog
  normalize: character => ({ ...character, items: character.items.map(withCatalogStats) }),
}
