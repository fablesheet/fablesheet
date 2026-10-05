import type { CharacterBase } from '@fablesheet/core'

// ── Items ─────────────────────────────────────────────────────────────────────

export type ItemCategory =
  | 'Weapon'
  | 'Armor'
  | 'Adventuring Gear'
  | 'Tool'
  | 'Potion'
  | 'Scroll'
  | 'Container'
  | 'Valuable'
  | 'Ammunition'
  | 'Magic Item'
  | 'Other'

export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact'

export interface Item {
  id: string
  name: string
  category: ItemCategory
  description: string
  quantity: number
  weight: number // lbs per unit
  value: number // gp
  equipped: boolean
  rarity: ItemRarity | null
  requiresAttunement: boolean
  isAttuned: boolean
  notes: string
  /** Combat stats for weapons (absent for other items) */
  weapon?: WeaponStats | null
  /** Armor class stats for armor and shields (absent for other items) */
  armor?: ArmorStats | null
  /** Magic bonuses, active while the item is equipped (and attuned, if required) */
  bonuses?: ItemBonuses | null
  /** Charges of wands, staffs and similar items */
  charges?: ItemCharges | null
}

export interface ItemBonuses {
  /** Added to armor class (magic armor, shields, rings and cloaks of protection) */
  ac: number
  /** Added to attack rolls with this weapon */
  attack: number
  /** Added to damage rolls with this weapon */
  damage: number
  /** Added to all saving throws */
  savingThrows: number
}

export interface ItemCharges {
  max: number
  current: number
  /** When charges come back: at dawn / after a long rest, after a short rest, or never */
  recharge: 'long' | 'short' | null
  /** Dice of charges regained, e.g. "1d6+1"; null = all charges */
  regain: string | null
}

export type DamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder'

export type WeaponProperty =
  'ammunition' | 'finesse' | 'heavy' | 'light' | 'loading' | 'reach' | 'special' | 'thrown' | 'two-handed' | 'versatile'

export interface WeaponStats {
  category: 'simple' | 'martial'
  kind: 'melee' | 'ranged'
  /** Damage dice such as "1d8" or a flat value such as "1"; null for weapons without damage (net) */
  damage: string | null
  damageType: DamageType | null
  /** Two-handed damage of versatile weapons */
  versatileDamage: string | null
  properties: WeaponProperty[]
  /** Normal/long range in feet, e.g. "80/320" */
  range: string | null
}

export interface ArmorStats {
  type: 'light' | 'medium' | 'heavy' | 'shield'
  /** Base AC, or the bonus for shields */
  baseAc: number
  /** Maximum Dexterity bonus; null = unlimited (light armor). Ignored if addDex is false */
  dexCap: number | null
  addDex: boolean
  strengthRequired: number | null
  stealthDisadvantage: boolean
}

// ── Spells ────────────────────────────────────────────────────────────────────

export type SpellSchool =
  | 'Abjuration'
  | 'Conjuration'
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation'

export interface SpellComponents {
  verbal: boolean
  somatic: boolean
  material: string | null
}

export interface Spell {
  id: string
  name: string
  level: number
  school: SpellSchool
  castingTime: string
  range: string
  components: SpellComponents
  duration: string
  concentration: boolean
  ritual: boolean
  description: string
  higherLevels: string | null
}

// ── Character ─────────────────────────────────────────────────────────────────

export type AbilityName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

/** The six abilities in their usual order */
export const ABILITY_NAMES: readonly AbilityName[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

export type SkillName =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival'

export type ProficiencyLevel = 'none' | 'half' | 'proficient' | 'expertise'

export interface SkillEntry {
  name: SkillName
  ability: AbilityName
  proficiency: ProficiencyLevel
}

export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface HitDice {
  die: string // 'd6' | 'd8' | 'd10' | 'd12'
  total: number
  used: number
}

export interface DeathSaves {
  successes: number // 0–3
  failures: number // 0–3
}

export interface Currency {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

/** A D&D 5e character (SRD 5.1 rules) */
export interface Dnd5eCharacter extends CharacterBase {
  system: 'dnd5e'
  race: string
  className: string
  level: number
  subclass: string | null
  background: string
  alignment: string
  experiencePoints: number

  scores: AbilityScores

  hp: { current: number; max: number; temp: number }
  ac: number
  initiativeBonus: number
  speed: number
  proficiencyBonus: number

  savingThrowProficiencies: AbilityName[]
  skills: SkillEntry[]

  hitDice: HitDice
  deathSaves: DeathSaves
  inspiration: boolean

  spellcastingAbility: string | null
  spellSaveDC: number | null
  spellAttackBonus: number | null
  knownSpells: string[]
  preparedSpells: string[]
  /** Expended spell slots per spell level (index 0 = 1st level); maximums come from class and level */
  spellSlotsUsed: number[]

  /** Spell the character is concentrating on */
  concentration: string | null
  currency: Currency
  languages: string[]
  otherProficiencies: string[]
  items: Item[]

  personality: Personality
  backstory: string
}

export interface Personality {
  traits: string
  ideals: string
  bonds: string
  flaws: string
}
