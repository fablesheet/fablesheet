import type { ArmorStats, DamageType, WeaponProperty, WeaponStats } from '@fablesheet/core'

const DAMAGE_TYPES: DamageType[] = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
]
const PROPERTIES: WeaponProperty[] = [
  'ammunition',
  'finesse',
  'heavy',
  'light',
  'loading',
  'reach',
  'special',
  'thrown',
  'two-handed',
  'versatile',
]

/**
 * Reads weapon stats from a catalog description such as
 * "Martial melee weapon. 1d8 slashing. Versatile (1d10)."
 */
export function parseWeapon(description: string): WeaponStats {
  const head = /^(Simple|Martial) (melee|ranged) weapon\./i.exec(description)
  if (!head) throw new Error(`Not a weapon description: ${description}`)

  const damageMatch = /\.\s(\d+(?:d\d+)?) (\w+)\./.exec(description)
  const damageType = damageMatch && (DAMAGE_TYPES as string[]).includes(damageMatch[2].toLowerCase())
  const lower = description.toLowerCase()

  return {
    category: head[1].toLowerCase() as WeaponStats['category'],
    kind: head[2].toLowerCase() as WeaponStats['kind'],
    damage: damageType ? damageMatch![1] : null,
    damageType: damageType ? (damageMatch![2].toLowerCase() as DamageType) : null,
    versatileDamage: /versatile \((\d+d\d+)\)/i.exec(description)?.[1] ?? null,
    properties: PROPERTIES.filter(p => new RegExp(`\\b${p}\\b`).test(lower)),
    range: /range (\d+\/\d+)/i.exec(description)?.[1] ?? null,
  }
}

/**
 * Reads armor stats from a catalog description such as
 * "Medium armor. AC 14 + Dex modifier (max 2). Disadvantage on Stealth."
 */
export function parseArmor(description: string): ArmorStats {
  if (/^Shield\./i.test(description)) {
    const bonus = Number(/\+(\d+) AC/i.exec(description)?.[1] ?? 2)
    return {
      type: 'shield',
      baseAc: bonus,
      dexCap: null,
      addDex: false,
      strengthRequired: null,
      stealthDisadvantage: false,
    }
  }
  const head = /^(Light|Medium|Heavy) armor\. AC (\d+)/i.exec(description)
  if (!head) throw new Error(`Not an armor description: ${description}`)
  const addDex = /\+ Dex modifier/i.test(description)
  const cap = /\(max (\d+)\)/i.exec(description)?.[1]

  return {
    type: head[1].toLowerCase() as ArmorStats['type'],
    baseAc: Number(head[2]),
    dexCap: cap !== undefined ? Number(cap) : null,
    addDex,
    strengthRequired: Number(/Str (\d+) required/i.exec(description)?.[1]) || null,
    stealthDisadvantage: /Disadvantage on Stealth/i.test(description),
  }
}
