// ── Items ─────────────────────────────────────────────────────────────────────

export type ItemCategory =
  | 'Weapon' | 'Armor' | 'Adventuring Gear' | 'Tool'
  | 'Potion' | 'Scroll' | 'Container' | 'Valuable'
  | 'Ammunition' | 'Magic Item' | 'Other'

export type ItemRarity =
  | 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact'

export interface Item {
  id: string
  name: string
  category: ItemCategory
  description: string
  quantity: number
  weight: number       // lbs per unit
  value: number        // gp
  equipped: boolean
  rarity: ItemRarity | null
  requiresAttunement: boolean
  isAttuned: boolean
  notes: string
}

// ── Spells ────────────────────────────────────────────────────────────────────

export type SpellSchool =
  | 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment'
  | 'Evocation'  | 'Illusion'   | 'Necromancy' | 'Transmutation'

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

export type AbilityName =
  | 'strength' | 'dexterity' | 'constitution'
  | 'intelligence' | 'wisdom' | 'charisma'

export type SkillName =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics'
  | 'deception'  | 'history'       | 'insight' | 'intimidation'
  | 'investigation' | 'medicine'   | 'nature'  | 'perception'
  | 'performance'   | 'persuasion' | 'religion'| 'sleightOfHand'
  | 'stealth'       | 'survival'

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
  die: string   // 'd6' | 'd8' | 'd10' | 'd12'
  total: number
  used: number
}

export interface DeathSaves {
  successes: number  // 0–3
  failures: number   // 0–3
}

export interface CharacterFeature {
  name: string
  source: string
  usesMax: number | null
  usesCurrent: number | null
  recharge: string | null
}

export interface Currency {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export interface Character {
  id: string
  name: string
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
  conditions: string[]

  spellcastingAbility: string | null
  spellSaveDC: number | null
  spellAttackBonus: number | null
  knownSpells: string[]
  preparedSpells: string[]

  features: CharacterFeature[]
  currency: Currency
  languages: string[]
  otherProficiencies: string[]
  items: Item[]
}
