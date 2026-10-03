import type { Character, SkillEntry, SkillName, AbilityName, Spell } from '@fablesheet/core'

// ── Skill helpers ─────────────────────────────────────────────────────────────

const ALL_SKILLS: Array<{ name: SkillName; ability: AbilityName }> = [
  { name: 'acrobatics',    ability: 'dexterity'    },
  { name: 'animalHandling',ability: 'wisdom'       },
  { name: 'arcana',        ability: 'intelligence' },
  { name: 'athletics',     ability: 'strength'     },
  { name: 'deception',     ability: 'charisma'     },
  { name: 'history',       ability: 'intelligence' },
  { name: 'insight',       ability: 'wisdom'       },
  { name: 'intimidation',  ability: 'charisma'     },
  { name: 'investigation', ability: 'intelligence' },
  { name: 'medicine',      ability: 'wisdom'       },
  { name: 'nature',        ability: 'intelligence' },
  { name: 'perception',    ability: 'wisdom'       },
  { name: 'performance',   ability: 'charisma'     },
  { name: 'persuasion',    ability: 'charisma'     },
  { name: 'religion',      ability: 'intelligence' },
  { name: 'sleightOfHand', ability: 'dexterity'    },
  { name: 'stealth',       ability: 'dexterity'    },
  { name: 'survival',      ability: 'wisdom'       },
]

function buildSkills(
  proficient: SkillName[] = [],
  expertise: SkillName[] = [],
): SkillEntry[] {
  return ALL_SKILLS.map(s => ({
    ...s,
    proficiency:
      expertise.includes(s.name)  ? 'expertise'  :
      proficient.includes(s.name) ? 'proficient' :
      'none',
  }))
}

// ── Characters ────────────────────────────────────────────────────────────────

export const mockCharacters: Character[] = [
  // ── High Elf Wizard 1 / Acolyte ──────────────────────────────────────────
  {
    id: 'elf_wizard_01',
    name: 'Elfenmagier',
    race: 'High Elf',
    className: 'Wizard',
    level: 1,
    subclass: null,
    background: 'Acolyte',
    alignment: 'Chaotic Good',
    experiencePoints: 0,

    scores: {
      strength: 10, dexterity: 15, constitution: 14,
      intelligence: 16, wisdom: 12, charisma: 8,
    },

    hp: { current: 8, max: 8, temp: 0 },
    ac: 12,
    initiativeBonus: 2,
    speed: 30,
    proficiencyBonus: 2,

    savingThrowProficiencies: ['intelligence', 'wisdom'],
    skills: buildSkills(['arcana', 'investigation', 'insight', 'religion']),

    hitDice: { die: 'd6', total: 1, used: 0 },
    deathSaves: { successes: 0, failures: 0 },
    inspiration: false,
    conditions: [],

    spellcastingAbility: 'Intelligence',
    spellSaveDC: 13,
    spellAttackBonus: 5,
    knownSpells: [
      'chill-touch', 'mage-hand', 'shocking-grasp', 'prestidigitation',
      'burning-hands', 'detect-magic', 'mage-armor', 'sleep', 'magic-missile',
    ],
    preparedSpells: ['burning-hands', 'detect-magic', 'mage-armor', 'sleep'],

    features: [
      { name: 'Arcane Recovery', source: 'Wizard',      usesMax: 1, usesCurrent: 1, recharge: 'Long Rest' },
      { name: 'Fey Ancestry',    source: 'High Elf',    usesMax: null, usesCurrent: null, recharge: null },
      { name: 'Trance',          source: 'High Elf',    usesMax: null, usesCurrent: null, recharge: null },
      { name: 'Shelter of the Faithful', source: 'Acolyte', usesMax: null, usesCurrent: null, recharge: null },
    ],

    currency: { cp: 0, sp: 0, ep: 0, gp: 5, pp: 0 },
    languages: ['Common', 'Elvish', 'Draconic', 'Dwarvish', 'Goblin'],
    otherProficiencies: [
      'Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows',
      'Longswords', 'Shortswords', 'Shortbows', 'Longbows',
    ],
    items: [],
  },

  // ── Human Fighter 3 / Champion ────────────────────────────────────────────
  {
    id: 'human_fighter_01',
    name: 'Thorian Ironbrow',
    race: 'Human',
    className: 'Fighter',
    level: 3,
    subclass: 'Champion',
    background: 'Soldier',
    alignment: 'Lawful Good',
    experiencePoints: 900,

    scores: {
      strength: 17, dexterity: 14, constitution: 16,
      intelligence: 10, wisdom: 12, charisma: 10,
    },

    hp: { current: 28, max: 30, temp: 0 },
    ac: 17,
    initiativeBonus: 2,
    speed: 30,
    proficiencyBonus: 2,

    savingThrowProficiencies: ['strength', 'constitution'],
    skills: buildSkills(['athletics', 'intimidation', 'perception', 'survival']),

    hitDice: { die: 'd10', total: 3, used: 1 },
    deathSaves: { successes: 0, failures: 0 },
    inspiration: false,
    conditions: [],

    spellcastingAbility: null,
    spellSaveDC: null,
    spellAttackBonus: null,
    knownSpells: [],
    preparedSpells: [],

    features: [
      { name: 'Second Wind',       source: 'Fighter',  usesMax: 1, usesCurrent: 1, recharge: 'Short Rest' },
      { name: 'Action Surge',      source: 'Fighter',  usesMax: 1, usesCurrent: 1, recharge: 'Short Rest' },
      { name: 'Improved Critical', source: 'Champion', usesMax: null, usesCurrent: null, recharge: null },
    ],

    currency: { cp: 0, sp: 10, ep: 0, gp: 42, pp: 1 },
    languages: ['Common', 'Orcish'],
    otherProficiencies: [
      'All armor', 'Shields', 'Simple weapons', 'Martial weapons',
      'Playing cards', 'Land vehicles',
    ],
    items: [],
  },

  // ── Hill Dwarf Cleric 2 / Life Domain ─────────────────────────────────────
  {
    id: 'dwarf_cleric_01',
    name: 'Gromdal Stonefist',
    race: 'Hill Dwarf',
    className: 'Cleric',
    level: 2,
    subclass: 'Life Domain',
    background: 'Acolyte',
    alignment: 'Lawful Neutral',
    experiencePoints: 300,

    scores: {
      strength: 14, dexterity: 10, constitution: 14,
      intelligence: 12, wisdom: 17, charisma: 10,
    },

    hp: { current: 18, max: 18, temp: 0 },
    ac: 16,
    initiativeBonus: 0,
    speed: 25,
    proficiencyBonus: 2,

    savingThrowProficiencies: ['wisdom', 'charisma'],
    skills: buildSkills(['history', 'insight', 'medicine', 'religion']),

    hitDice: { die: 'd8', total: 2, used: 0 },
    deathSaves: { successes: 0, failures: 0 },
    inspiration: false,
    conditions: [],

    spellcastingAbility: 'Wisdom',
    spellSaveDC: 13,
    spellAttackBonus: 5,
    knownSpells: [
      'sacred-flame', 'light', 'cure-wounds', 'bless', 'guiding-bolt', 'healing-word',
    ],
    preparedSpells: ['cure-wounds', 'bless', 'guiding-bolt', 'healing-word'],

    features: [
      { name: 'Channel Divinity', source: 'Cleric',      usesMax: 1, usesCurrent: 1, recharge: 'Short Rest' },
      { name: 'Disciple of Life', source: 'Life Domain', usesMax: null, usesCurrent: null, recharge: null },
      { name: 'Dwarven Resilience',source: 'Hill Dwarf', usesMax: null, usesCurrent: null, recharge: null },
    ],

    currency: { cp: 5, sp: 3, ep: 0, gp: 15, pp: 0 },
    languages: ['Common', 'Dwarvish'],
    otherProficiencies: [
      'Light armor', 'Medium armor', 'Heavy armor', 'Shields',
      'Simple weapons', 'Battleaxes', 'Handaxes', 'Light hammers', 'Warhammers',
      "Smith's tools",
    ],
    items: [],
  },
]

// ── Spells ────────────────────────────────────────────────────────────────────

export const mockSpells: Spell[] = [
  // Cantrips
  {
    id: 'chill-touch', name: 'Chill Touch', level: 0, school: 'Necromancy',
    castingTime: '1 Action', range: '120 feet',
    components: { verbal: true, somatic: true, material: null },
    duration: '1 round', concentration: false, ritual: false,
    description: 'You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature to assail it with the chill of the grave. On a hit, the target takes 1d8 necrotic damage, and it can\'t regain hit points until the start of your next turn.',
    higherLevels: null,
  },
  {
    id: 'mage-hand', name: 'Mage Hand', level: 0, school: 'Conjuration',
    castingTime: '1 Action', range: '30 feet',
    components: { verbal: true, somatic: true, material: null },
    duration: '1 minute', concentration: false, ritual: false,
    description: 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it. You can use the hand to manipulate an object, open an unlocked door or container, stow or retrieve an item, or pour the contents out of a vial.',
    higherLevels: null,
  },
  {
    id: 'shocking-grasp', name: 'Shocking Grasp', level: 0, school: 'Evocation',
    castingTime: '1 Action', range: 'Touch',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'Lightning springs from your hand to deliver a shock to a creature you try to touch. Make a melee spell attack. You have advantage on the roll if the target is wearing metal armor. On a hit, the target takes 1d8 lightning damage and can\'t take reactions until the start of its next turn.',
    higherLevels: null,
  },
  {
    id: 'prestidigitation', name: 'Prestidigitation', level: 0, school: 'Transmutation',
    castingTime: '1 Action', range: '10 feet',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Up to 1 hour', concentration: false, ritual: false,
    description: 'A minor magical trick for novice spellcasters. Create a harmless sensory effect; light or snuff a candle; clean or soil an object; chill, warm, or flavor material; make a color or symbol appear; or create a small nonmagical trinket that lasts until the end of your next turn.',
    higherLevels: null,
  },
  {
    id: 'sacred-flame', name: 'Sacred Flame', level: 0, school: 'Evocation',
    castingTime: '1 Action', range: '60 feet',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'Flame-like radiance descends on a creature you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.',
    higherLevels: null,
  },
  {
    id: 'light', name: 'Light', level: 0, school: 'Evocation',
    castingTime: '1 Action', range: 'Touch',
    components: { verbal: true, somatic: false, material: 'A firefly or phosphorescent moss' },
    duration: '1 hour', concentration: false, ritual: false,
    description: 'You touch one object no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet.',
    higherLevels: null,
  },
  // 1st level
  {
    id: 'burning-hands', name: 'Burning Hands', level: 1, school: 'Evocation',
    castingTime: '1 Action', range: 'Self (15-foot cone)',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'A thin sheet of flames shoots from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half on a success. The fire ignites any flammable objects in the area that aren\'t being worn or carried.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
  },
  {
    id: 'detect-magic', name: 'Detect Magic', level: 1, school: 'Divination',
    castingTime: '1 Action', range: 'Self',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Concentration, up to 10 minutes', concentration: true, ritual: true,
    description: 'For the duration, you sense the presence of magic within 30 feet of you. If you sense magic, you can use your action to see a faint aura around any visible creature or object that bears magic, and learn its school of magic, if any.',
    higherLevels: null,
  },
  {
    id: 'mage-armor', name: 'Mage Armor', level: 1, school: 'Abjuration',
    castingTime: '1 Action', range: 'Touch',
    components: { verbal: true, somatic: true, material: 'A piece of cured leather' },
    duration: '8 hours', concentration: false, ritual: false,
    description: 'You touch a willing creature who isn\'t wearing armor, and a protective magical force surrounds it until the spell ends. The target\'s base AC becomes 13 + its Dexterity modifier. The spell ends if the target dons armor or if you dismiss it as an action.',
    higherLevels: null,
  },
  {
    id: 'sleep', name: 'Sleep', level: 1, school: 'Enchantment',
    castingTime: '1 Action', range: '90 feet',
    components: { verbal: true, somatic: true, material: 'A pinch of fine sand, rose petals, or a cricket' },
    duration: '1 minute', concentration: false, ritual: false,
    description: 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose are affected in ascending order of their current hit points, falling unconscious until the spell ends, they take damage, or someone wakes them.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, roll an additional 2d8 for each slot level above 1st.',
  },
  {
    id: 'magic-missile', name: 'Magic Missile', level: 1, school: 'Evocation',
    castingTime: '1 Action', range: '120 feet',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.',
  },
  {
    id: 'cure-wounds', name: 'Cure Wounds', level: 1, school: 'Evocation',
    castingTime: '1 Action', range: 'Touch',
    components: { verbal: true, somatic: true, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.',
  },
  {
    id: 'bless', name: 'Bless', level: 1, school: 'Enchantment',
    castingTime: '1 Action', range: '30 feet',
    components: { verbal: true, somatic: true, material: 'A sprinkling of holy water' },
    duration: 'Concentration, up to 1 minute', concentration: true, ritual: false,
    description: 'You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or saving throw before the spell ends, the target can roll a d4 and add the number to the roll.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
  },
  {
    id: 'guiding-bolt', name: 'Guiding Bolt', level: 1, school: 'Evocation',
    castingTime: '1 Action', range: '120 feet',
    components: { verbal: true, somatic: true, material: null },
    duration: '1 round', concentration: false, ritual: false,
    description: 'A flash of light streaks toward a creature of your choice within range. Make a ranged spell attack against the target. On a hit, the target takes 4d6 radiant damage, and the next attack roll made against this target before the end of your next turn has advantage.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
  },
  {
    id: 'healing-word', name: 'Healing Word', level: 1, school: 'Evocation',
    castingTime: '1 Bonus Action', range: '60 feet',
    components: { verbal: true, somatic: false, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
    higherLevels: 'When you cast this spell using a slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.',
  },
  // 2nd level
  {
    id: 'misty-step', name: 'Misty Step', level: 2, school: 'Conjuration',
    castingTime: '1 Bonus Action', range: 'Self',
    components: { verbal: true, somatic: false, material: null },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.',
    higherLevels: null,
  },
]
