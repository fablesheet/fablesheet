// Backgrounds from the System Reference Document 5.1 (CC-BY-4.0). See NOTICE.
import type { Item, SkillName } from '@fablesheet/dnd5e'
import { ITEM_CATALOG } from './items'

export interface BackgroundDef {
  name: string
  skills: SkillName[]
  /** Languages of your choice */
  extraLanguages: number
  /** Starting equipment: catalog item names, or other gear by name */
  equipment: string[]
  gold: number
  feature: { name: string; summary: string }
}

/** The SRD contains a single background; others can be created as custom backgrounds. */
export const BACKGROUND_CATALOG: BackgroundDef[] = [
  {
    name: 'Acolyte',
    skills: ['insight', 'religion'],
    extraLanguages: 2,
    equipment: ['Holy Symbol', 'Prayer Book', 'Incense (5 sticks)', 'Vestments', 'Common Clothes', 'Pouch'],
    gold: 15,
    feature: {
      name: 'Shelter of the Faithful',
      summary:
        'You and your companions receive free healing and care at temples of your faith, and its priests support you (but not at risk to themselves). You have ties to a specific temple where you have a residence.',
    },
  },
]

/** Number of skills a custom background grants */
export const CUSTOM_BACKGROUND_SKILLS = 2

export function findBackground(name: string): BackgroundDef | undefined {
  return BACKGROUND_CATALOG.find(b => b.name === name)
}

/** Starting gear by name: catalog items where they exist, simple adventuring gear otherwise. */
export function startingItems(names: string[]): Omit<Item, 'id'>[] {
  return names.map(name => {
    const fromCatalog = ITEM_CATALOG.find(i => i.name === name)
    if (fromCatalog) return { ...fromCatalog }
    return {
      name,
      category: 'Adventuring Gear',
      description: '',
      quantity: 1,
      weight: 0,
      value: 0,
      equipped: false,
      rarity: null,
      requiresAttunement: false,
      isAttuned: false,
      notes: '',
      weapon: null,
      armor: null,
    }
  })
}
