import type { Character, DamageType, Item, WeaponStats } from './types'
import { abilityModifier } from './rules'

// ── Armor class ───────────────────────────────────────────────────────────────

/**
 * Armor class from equipped armor and shield. Without body armor, Barbarians and
 * Monks use Unarmored Defense (Monks only without a shield); everyone else 10 + DEX.
 */
export function armorClass(character: Pick<Character, 'className' | 'scores' | 'items'>): number {
  const dex = abilityModifier(character.scores.dexterity)
  const equipped = (character.items ?? []).filter(i => i.equipped && i.armor)

  const shieldBonus = Math.max(0, ...equipped.filter(i => i.armor!.type === 'shield').map(i => i.armor!.baseAc))
  const bodyArmor = equipped.filter(i => i.armor!.type !== 'shield')

  let base: number
  if (bodyArmor.length > 0) {
    base = Math.max(
      ...bodyArmor.map(({ armor }) => {
        const dexBonus = !armor!.addDex ? 0 : armor!.dexCap === null ? dex : Math.min(dex, armor!.dexCap)
        return armor!.baseAc + dexBonus
      }),
    )
  } else if (character.className === 'Barbarian') {
    base = 10 + dex + abilityModifier(character.scores.constitution)
  } else if (character.className === 'Monk' && shieldBonus === 0) {
    base = 10 + dex + abilityModifier(character.scores.wisdom)
  } else {
    base = 10 + dex
  }
  return base + shieldBonus
}

// ── Weapons ───────────────────────────────────────────────────────────────────

/** Specific weapons some classes are proficient with beyond their categories (SRD 5.1). */
const EXTRA_WEAPONS: Record<string, string[]> = {
  Bard: ['Hand Crossbow', 'Longsword', 'Rapier', 'Shortsword'],
  Rogue: ['Hand Crossbow', 'Longsword', 'Rapier', 'Shortsword'],
  Monk: ['Shortsword'],
  Druid: ['Club', 'Dagger', 'Dart', 'Javelin', 'Mace', 'Quarterstaff', 'Scimitar', 'Sickle', 'Sling', 'Spear'],
  Sorcerer: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow'],
  Wizard: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow'],
}
const MARTIAL_CLASSES = new Set(['Barbarian', 'Fighter', 'Paladin', 'Ranger'])
const SIMPLE_CLASSES = new Set([...MARTIAL_CLASSES, 'Bard', 'Cleric', 'Monk', 'Rogue', 'Warlock'])

/**
 * Proficiency from the class, or from other proficiencies such as racial weapon
 * training (listed by weapon name).
 */
export function isProficientWithWeapon(
  className: string,
  weaponName: string,
  weapon: WeaponStats,
  otherProficiencies: string[] = [],
): boolean {
  if (MARTIAL_CLASSES.has(className)) return true
  if (otherProficiencies.some(p => p.toLowerCase() === weaponName.toLowerCase())) return true
  if (weapon.category === 'simple' && SIMPLE_CLASSES.has(className)) return true
  return EXTRA_WEAPONS[className]?.includes(weaponName) ?? false
}

/** Adds a modifier to a damage expression: ("1d8", 3) → "1d8 + 3", ("1", 2) → "3". */
export function formatDamage(dice: string, modifier: number): string {
  if (/^\d+$/.test(dice)) return String(Math.max(0, Number(dice) + modifier))
  if (modifier === 0) return dice
  return `${dice} ${modifier > 0 ? '+' : '−'} ${Math.abs(modifier)}`
}

export interface Attack {
  itemId: string
  name: string
  attackBonus: number
  damage: string | null
  versatileDamage: string | null
  damageType: DamageType | null
  range: string | null
  proficient: boolean
  ability: 'strength' | 'dexterity'
}

/** Attack and damage for a weapon: finesse uses the better of STR/DEX, ranged weapons DEX, melee STR. */
export function weaponAttack(
  character: Pick<Character, 'className' | 'scores' | 'proficiencyBonus'> &
    Partial<Pick<Character, 'otherProficiencies'>>,
  item: Item,
): Attack | null {
  const weapon = item.weapon
  if (!weapon) return null

  const str = abilityModifier(character.scores.strength)
  const dex = abilityModifier(character.scores.dexterity)
  const ability: Attack['ability'] = weapon.properties.includes('finesse')
    ? dex > str
      ? 'dexterity'
      : 'strength'
    : weapon.kind === 'ranged'
      ? 'dexterity'
      : 'strength'
  const mod = ability === 'dexterity' ? dex : str
  const proficient = isProficientWithWeapon(character.className, item.name, weapon, character.otherProficiencies)

  return {
    itemId: item.id,
    name: item.name,
    attackBonus: mod + (proficient ? character.proficiencyBonus : 0),
    damage: weapon.damage ? formatDamage(weapon.damage, mod) : null,
    versatileDamage: weapon.versatileDamage ? formatDamage(weapon.versatileDamage, mod) : null,
    damageType: weapon.damageType,
    range: weapon.range,
    proficient,
    ability,
  }
}

/** Attacks for all equipped weapons. */
export function equippedAttacks(
  character: Pick<Character, 'className' | 'scores' | 'proficiencyBonus' | 'items'>,
): Attack[] {
  return (character.items ?? [])
    .filter(i => i.equipped && i.weapon)
    .map(i => weaponAttack(character, i))
    .filter((a): a is Attack => a !== null)
}
