import type { Item, ItemCategory, ItemRarity } from '@fablesheet/core'
import { withCatalogStats } from '@fablesheet/srd-data'

export const CATEGORIES: ItemCategory[] = [
  'Weapon',
  'Armor',
  'Adventuring Gear',
  'Tool',
  'Potion',
  'Scroll',
  'Container',
  'Valuable',
  'Ammunition',
  'Magic Item',
  'Other',
]

export const RARITIES: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact']

/** Reads an exported item list (or a single item) and returns valid items; stats are filled in from the SRD catalog. */
export function parseItemList(raw: unknown, unnamed: string): Item[] {
  const list = Array.isArray(raw) ? raw : [raw]
  return list
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && 'name' in x)
    .map(x => ({
      id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
      name: String(x.name ?? '').trim() || unnamed,
      category: (CATEGORIES.includes(x.category as ItemCategory) ? x.category : 'Other') as ItemCategory,
      description: String(x.description ?? ''),
      quantity: Math.max(1, Number(x.quantity) || 1),
      weight: Math.max(0, Number(x.weight) || 0),
      value: Math.max(0, Number(x.value) || 0),
      equipped: Boolean(x.equipped),
      rarity: (RARITIES.includes(x.rarity as ItemRarity) ? x.rarity : null) as ItemRarity | null,
      requiresAttunement: Boolean(x.requiresAttunement),
      isAttuned: Boolean(x.isAttuned),
      notes: String(x.notes ?? ''),
    }))
    .map(withCatalogStats)
}
