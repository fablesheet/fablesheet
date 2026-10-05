// Data side of the game systems: how their characters are read and upgraded.
// Kept apart from the screens so that storage code doesn't depend on UI code.
import type { GameSystemDefinition } from '@fablesheet/core'
import { dnd5eSystemDefinition } from './dnd5e/definition'

export const SYSTEM_DEFINITIONS: readonly GameSystemDefinition[] = [dnd5eSystemDefinition]
