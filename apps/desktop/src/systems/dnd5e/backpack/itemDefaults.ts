import type { ArmorStats, WeaponStats } from '@fablesheet/dnd5e'

export const DEFAULT_WEAPON: WeaponStats = {
  category: 'simple',
  kind: 'melee',
  damage: '1d6',
  damageType: 'slashing',
  versatileDamage: null,
  properties: [],
  range: null,
}

export const DEFAULT_ARMOR: ArmorStats = {
  type: 'light',
  baseAc: 11,
  dexCap: null,
  addDex: true,
  strengthRequired: null,
  stealthDisadvantage: false,
}
