import type { ItemCategory, ItemRarity } from '@fablesheet/core'

export const RARITY_COLOR: Record<ItemRarity, string> = {
  Common: '#7a7a6a',
  Uncommon: '#3f7a3a',
  Rare: '#3a5a9a',
  'Very Rare': '#6a3a9a',
  Legendary: '#a8701a',
  Artifact: '#8e2b2b',
}

export const CATEGORY_ICON: Record<ItemCategory, string> = {
  Weapon: '⚔',
  Armor: '⛨',
  'Adventuring Gear': '⚒',
  Tool: '⚙',
  Potion: '⚗',
  Scroll: '✉',
  Container: '▣',
  Valuable: '◈',
  Ammunition: '➶',
  'Magic Item': '✦',
  Other: '•',
}
