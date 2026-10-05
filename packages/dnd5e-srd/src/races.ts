// Races and subraces from the System Reference Document 5.1 (CC-BY-4.0). See NOTICE.
// Trait summaries are short paraphrases of the SRD rules.
import type { AbilityName, SkillName } from '@fablesheet/dnd5e'
import type { ClassFeatureDef } from './classes'

export interface DraconicAncestry {
  dragon: string
  damageType: string
  area: string
  save: AbilityName
}

export interface SubraceDef {
  name: string
  abilityBonuses: Partial<Record<AbilityName, number>>
  traits: ClassFeatureDef[]
  extraLanguages?: number
  weapons?: string[]
  /** Choose one cantrip from these spell names, cast with the given ability */
  cantripChoice?: { spells: string[]; ability: AbilityName }
  /** Extra maximum hit points per level */
  hitPointsPerLevel?: number
}

export interface RaceDef {
  name: string
  speed: number
  abilityBonuses: Partial<Record<AbilityName, number>>
  languages: string[]
  /** Languages of your choice */
  extraLanguages?: number
  /** +1 to this many different abilities of your choice (not those in `abilityBonuses`) */
  abilityChoices?: number
  /** Fixed skill proficiencies */
  skills?: SkillName[]
  /** Skill proficiencies of your choice */
  skillChoices?: number
  weapons?: string[]
  /** Cantrips every member of the race knows (spell names) */
  cantrips?: string[]
  ancestries?: DraconicAncestry[]
  traits: ClassFeatureDef[]
  /** The subrace included in the SRD, if the race has subraces */
  subrace?: SubraceDef
}

const darkvision: ClassFeatureDef = {
  name: 'Darkvision',
  level: 1,
  summary:
    'See in dim light within 60 ft as if it were bright light, and in darkness as if it were dim light (only shades of gray).',
}
const feyAncestry: ClassFeatureDef = {
  name: 'Fey Ancestry',
  level: 1,
  summary: "Advantage on saving throws against being charmed, and magic can't put you to sleep.",
}

/** Wizard cantrips of the SRD (for the High Elf) */
const WIZARD_CANTRIPS = [
  'Acid Splash',
  'Chill Touch',
  'Dancing Lights',
  'Fire Bolt',
  'Light',
  'Mage Hand',
  'Mending',
  'Message',
  'Minor Illusion',
  'Poison Spray',
  'Prestidigitation',
  'Ray of Frost',
  'Shocking Grasp',
  'True Strike',
]

export const RACE_CATALOG: RaceDef[] = [
  {
    name: 'Human',
    speed: 30,
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    languages: ['Common'],
    extraLanguages: 1,
    traits: [],
  },
  {
    name: 'Elf',
    speed: 30,
    abilityBonuses: { dexterity: 2 },
    languages: ['Common', 'Elvish'],
    skills: ['perception'],
    traits: [
      darkvision,
      { name: 'Keen Senses', level: 1, summary: 'Proficiency in the Perception skill.' },
      feyAncestry,
      {
        name: 'Trance',
        level: 1,
        summary: 'Instead of sleeping, meditate deeply for 4 hours to gain the benefit of a long rest.',
      },
    ],
    subrace: {
      name: 'High Elf',
      abilityBonuses: { intelligence: 1 },
      extraLanguages: 1,
      weapons: ['Longsword', 'Shortsword', 'Shortbow', 'Longbow'],
      cantripChoice: { spells: WIZARD_CANTRIPS, ability: 'intelligence' },
      traits: [
        {
          name: 'Elf Weapon Training',
          level: 1,
          summary: 'Proficiency with the longsword, shortsword, shortbow and longbow.',
        },
        {
          name: 'Cantrip',
          level: 1,
          summary: 'You know one cantrip of your choice from the wizard spell list, cast with Intelligence.',
          personal: true,
        },
        { name: 'Extra Language', level: 1, summary: 'You speak, read and write one extra language of your choice.' },
      ],
    },
  },
  {
    name: 'Dwarf',
    speed: 25,
    abilityBonuses: { constitution: 2 },
    languages: ['Common', 'Dwarvish'],
    weapons: ['Battleaxe', 'Handaxe', 'Light Hammer', 'Warhammer'],
    traits: [
      darkvision,
      {
        name: 'Dwarven Resilience',
        level: 1,
        summary:
          'Advantage on saving throws against poison, and resistance to poison damage. Heavy armor does not reduce your speed.',
      },
      {
        name: 'Dwarven Combat Training',
        level: 1,
        summary: 'Proficiency with the battleaxe, handaxe, light hammer and warhammer.',
      },
      {
        name: 'Tool Proficiency',
        level: 1,
        summary: "Proficiency with smith's tools, brewer's supplies or mason's tools (your choice).",
      },
      {
        name: 'Stonecunning',
        level: 1,
        summary: 'Add double your proficiency bonus to History checks about the origin of stonework.',
      },
    ],
    subrace: {
      name: 'Hill Dwarf',
      abilityBonuses: { wisdom: 1 },
      hitPointsPerLevel: 1,
      traits: [
        {
          name: 'Dwarven Toughness',
          level: 1,
          summary: 'Your hit point maximum increases by 1 for every level you have.',
        },
      ],
    },
  },
  {
    name: 'Halfling',
    speed: 25,
    abilityBonuses: { dexterity: 2 },
    languages: ['Common', 'Halfling'],
    traits: [
      {
        name: 'Lucky',
        level: 1,
        summary:
          'When you roll a natural 1 on an attack roll, ability check or saving throw, reroll the die and use the new roll.',
      },
      { name: 'Brave', level: 1, summary: 'Advantage on saving throws against being frightened.' },
      {
        name: 'Halfling Nimbleness',
        level: 1,
        summary: 'You can move through the space of any creature that is larger than you.',
      },
    ],
    subrace: {
      name: 'Lightfoot Halfling',
      abilityBonuses: { charisma: 1 },
      traits: [
        {
          name: 'Naturally Stealthy',
          level: 1,
          summary: 'You can try to hide when you are only obscured by a creature at least one size larger than you.',
        },
      ],
    },
  },
  {
    name: 'Dragonborn',
    speed: 30,
    abilityBonuses: { strength: 2, charisma: 1 },
    languages: ['Common', 'Draconic'],
    ancestries: [
      { dragon: 'Black', damageType: 'acid', area: '5 by 30 ft line', save: 'dexterity' },
      { dragon: 'Blue', damageType: 'lightning', area: '5 by 30 ft line', save: 'dexterity' },
      { dragon: 'Brass', damageType: 'fire', area: '5 by 30 ft line', save: 'dexterity' },
      { dragon: 'Bronze', damageType: 'lightning', area: '5 by 30 ft line', save: 'dexterity' },
      { dragon: 'Copper', damageType: 'acid', area: '5 by 30 ft line', save: 'dexterity' },
      { dragon: 'Gold', damageType: 'fire', area: '15 ft cone', save: 'dexterity' },
      { dragon: 'Green', damageType: 'poison', area: '15 ft cone', save: 'constitution' },
      { dragon: 'Red', damageType: 'fire', area: '15 ft cone', save: 'dexterity' },
      { dragon: 'Silver', damageType: 'cold', area: '15 ft cone', save: 'constitution' },
      { dragon: 'White', damageType: 'cold', area: '15 ft cone', save: 'constitution' },
    ],
    traits: [
      {
        name: 'Draconic Ancestry',
        level: 1,
        summary: 'Your dragon ancestry sets the damage type of your breath weapon and resistance.',
        personal: true,
      },
      {
        name: 'Breath Weapon',
        level: 1,
        summary:
          'Action: exhale destructive energy in the area of your ancestry. Creatures in it make a save (DC 8 + Constitution modifier + proficiency bonus) and take 2d6 damage, half on a success (3d6 at 6th level, 4d6 at 11th, 5d6 at 16th).',
        uses: () => 1,
        recharge: 'short',
      },
      {
        name: 'Damage Resistance',
        level: 1,
        summary: 'Resistance to the damage type of your draconic ancestry.',
        personal: true,
      },
    ],
  },
  {
    name: 'Gnome',
    speed: 25,
    abilityBonuses: { intelligence: 2 },
    languages: ['Common', 'Gnomish'],
    traits: [
      darkvision,
      {
        name: 'Gnome Cunning',
        level: 1,
        summary: 'Advantage on Intelligence, Wisdom and Charisma saving throws against magic.',
      },
    ],
    subrace: {
      name: 'Rock Gnome',
      abilityBonuses: { constitution: 1 },
      traits: [
        {
          name: "Artificer's Lore",
          level: 1,
          summary:
            'Add double your proficiency bonus to History checks about magic items, alchemical objects and technological devices.',
        },
        {
          name: 'Tinker',
          level: 1,
          summary:
            "Proficiency with tinker's tools; build tiny clockwork devices such as a toy, a fire starter or a music box.",
        },
      ],
    },
  },
  {
    name: 'Half-Elf',
    speed: 30,
    abilityBonuses: { charisma: 2 },
    abilityChoices: 2,
    languages: ['Common', 'Elvish'],
    extraLanguages: 1,
    skillChoices: 2,
    traits: [
      darkvision,
      feyAncestry,
      { name: 'Skill Versatility', level: 1, summary: 'Proficiency in two skills of your choice.' },
    ],
  },
  {
    name: 'Half-Orc',
    speed: 30,
    abilityBonuses: { strength: 2, constitution: 1 },
    languages: ['Common', 'Orc'],
    skills: ['intimidation'],
    traits: [
      darkvision,
      { name: 'Menacing', level: 1, summary: 'Proficiency in the Intimidation skill.' },
      {
        name: 'Relentless Endurance',
        level: 1,
        summary: 'When you are reduced to 0 hit points but not killed outright, drop to 1 hit point instead.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Savage Attacks',
        level: 1,
        summary: 'On a critical hit with a melee weapon, roll one of its damage dice one more time and add it.',
      },
    ],
  },
  {
    name: 'Tiefling',
    speed: 30,
    abilityBonuses: { intelligence: 1, charisma: 2 },
    languages: ['Common', 'Infernal'],
    cantrips: ['Thaumaturgy'],
    traits: [
      darkvision,
      { name: 'Hellish Resistance', level: 1, summary: 'Resistance to fire damage.' },
      {
        name: 'Infernal Legacy',
        level: 1,
        summary: 'You know the Thaumaturgy cantrip. Charisma is your spellcasting ability for these spells.',
      },
      {
        name: 'Infernal Legacy: Hellish Rebuke',
        level: 3,
        summary: 'Cast Hellish Rebuke as a 2nd-level spell without a spell slot.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Infernal Legacy: Darkness',
        level: 5,
        summary: 'Cast Darkness without a spell slot.',
        uses: () => 1,
        recharge: 'long',
      },
    ],
  },
]

/** Standard and exotic languages of the SRD */
export const LANGUAGES = [
  'Common',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
  'Abyssal',
  'Celestial',
  'Draconic',
  'Deep Speech',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Undercommon',
]

export interface ResolvedRace {
  race: RaceDef
  /** Set if the character's race is the SRD subrace */
  subrace: SubraceDef | null
}

/** Finds a race by its stored name, which is either a race ("Elf") or an SRD subrace ("High Elf"). */
export function findRace(name: string): ResolvedRace | undefined {
  for (const race of RACE_CATALOG) {
    if (race.name === name) return { race, subrace: null }
    if (race.subrace && race.subrace.name === name) return { race, subrace: race.subrace }
  }
  return undefined
}

/** Ability bonuses of a race including its subrace. */
export function raceAbilityBonuses(name: string): Partial<Record<AbilityName, number>> {
  const found = findRace(name)
  if (!found) return {}
  const bonuses = { ...found.race.abilityBonuses }
  for (const [ability, bonus] of Object.entries(found.subrace?.abilityBonuses ?? {}) as [AbilityName, number][]) {
    bonuses[ability] = (bonuses[ability] ?? 0) + bonus
  }
  return bonuses
}

/** Extra maximum hit points per level from the race (Hill Dwarf). */
export function raceHitPointsPerLevel(name: string): number {
  return findRace(name)?.subrace?.hitPointsPerLevel ?? 0
}

/** Trait description for a dragon ancestry. */
export function ancestryDescription(ancestry: DraconicAncestry): { ancestry: string; resistance: string } {
  return {
    ancestry: `${ancestry.dragon} dragon: ${ancestry.damageType} damage, breath weapon in a ${ancestry.area} (${ancestry.save === 'dexterity' ? 'Dexterity' : 'Constitution'} save).`,
    resistance: `Resistance to ${ancestry.damageType} damage.`,
  }
}
