// Class progression from the System Reference Document 5.1 (CC-BY-4.0). See NOTICE.
// Summaries are short paraphrases of the SRD rules, meant as reminders at the table.
import type { AbilityName, AbilityScores, Character, CharacterFeature } from '@fablesheet/core'
import { abilityModifier } from '@fablesheet/core'

export type FeatureRecharge = 'short' | 'long'

interface UsesContext {
  level: number
  /** Ability modifier of the character */
  mod: (ability: AbilityName) => number
}

export interface ClassFeatureDef {
  name: string
  /** Class level at which the feature is gained */
  level: number
  summary: string
  /** Maximum uses at the given level; null = unlimited. Omitted for features without uses. */
  uses?: (ctx: UsesContext) => number | null
  recharge?: FeatureRecharge | ((level: number) => FeatureRecharge)
}

export interface SubclassDef {
  name: string
  features: ClassFeatureDef[]
}

export interface ClassDef {
  name: string
  hitDie: number
  /** Level at which the subclass is chosen */
  subclassLevel: number
  /** The subclass included in the SRD (other subclasses are not openly licensed) */
  subclass: SubclassDef
  /** Levels with an Ability Score Improvement */
  asiLevels: number[]
  features: ClassFeatureDef[]
}

const STANDARD_ASI = [4, 8, 12, 16, 19]

/** Picks a value from a table of [fromLevel, value] steps (ascending). */
const byLevel =
  <T>(steps: Array<[number, T]>) =>
  (level: number): T => {
    let value = steps[0][1]
    for (const [from, v] of steps) if (level >= from) value = v
    return value
  }

const atLeastOne = (n: number) => Math.max(1, n)

export const CLASS_CATALOG: ClassDef[] = [
  {
    name: 'Barbarian',
    hitDie: 12,
    subclassLevel: 3,
    asiLevels: STANDARD_ASI,
    features: [
      {
        name: 'Rage',
        level: 1,
        summary:
          'Bonus action: advantage on Strength checks and saves, bonus melee damage with Strength (+2, +3 at 9th, +4 at 16th), resistance to bludgeoning, piercing and slashing damage. Lasts 1 minute; no spellcasting while raging.',
        uses: ({ level }) =>
          byLevel<number | null>([
            [1, 2],
            [3, 3],
            [6, 4],
            [12, 5],
            [17, 6],
            [20, null],
          ])(level),
        recharge: 'long',
      },
      {
        name: 'Unarmored Defense',
        level: 1,
        summary: 'Without armor, AC equals 10 + Dexterity modifier + Constitution modifier (a shield is allowed).',
      },
      {
        name: 'Reckless Attack',
        level: 2,
        summary:
          'On your first attack in a turn, gain advantage on Strength melee attacks this turn; attacks against you have advantage until your next turn.',
      },
      {
        name: 'Danger Sense',
        level: 2,
        summary: 'Advantage on Dexterity saves against effects you can see, unless blinded, deafened or incapacitated.',
      },
      { name: 'Extra Attack', level: 5, summary: 'Attack twice when you take the Attack action.' },
      { name: 'Fast Movement', level: 5, summary: '+10 ft speed while not wearing heavy armor.' },
      {
        name: 'Feral Instinct',
        level: 7,
        summary: 'Advantage on initiative. If surprised, you can still act on your first turn by entering a rage.',
      },
      {
        name: 'Brutal Critical',
        level: 9,
        summary: 'Roll one extra weapon damage die on a melee critical hit (two at 13th level, three at 17th).',
      },
      {
        name: 'Relentless Rage',
        level: 11,
        summary:
          'When you drop to 0 HP while raging, make a DC 10 Constitution save to drop to 1 HP instead. The DC rises by 5 each time until a rest.',
      },
      {
        name: 'Persistent Rage',
        level: 15,
        summary: 'Your rage only ends early if you fall unconscious or choose to end it.',
      },
      {
        name: 'Indomitable Might',
        level: 18,
        summary: 'If a Strength check total is lower than your Strength score, use the score instead.',
      },
      { name: 'Primal Champion', level: 20, summary: 'Strength and Constitution increase by 4 (maximum 24).' },
    ],
    subclass: {
      name: 'Path of the Berserker',
      features: [
        {
          name: 'Frenzy',
          level: 3,
          summary:
            'When you rage, you can frenzy: make one melee weapon attack as a bonus action each turn. Afterwards you gain one level of exhaustion.',
        },
        { name: 'Mindless Rage', level: 6, summary: "You can't be charmed or frightened while raging." },
        {
          name: 'Intimidating Presence',
          level: 10,
          summary: 'Action: frighten a creature within 30 ft that fails a Wisdom save (DC 8 + proficiency + Charisma).',
        },
        {
          name: 'Retaliation',
          level: 14,
          summary: 'Reaction: when a creature within 5 ft damages you, make a melee attack against it.',
        },
      ],
    },
  },
  {
    name: 'Bard',
    hitDie: 8,
    subclassLevel: 3,
    asiLevels: STANDARD_ASI,
    features: [
      { name: 'Spellcasting', level: 1, summary: 'Cast bard spells using Charisma.' },
      {
        name: 'Bardic Inspiration',
        level: 1,
        summary:
          'Bonus action: give a creature within 60 ft an inspiration die (d6; d8 at 5th, d10 at 10th, d12 at 15th) to add to one ability check, attack roll or saving throw within 10 minutes.',
        uses: ({ mod }) => atLeastOne(mod('charisma')),
        recharge: byLevel<FeatureRecharge>([
          [1, 'long'],
          [5, 'short'],
        ]),
      },
      {
        name: 'Jack of All Trades',
        level: 2,
        summary: 'Add half your proficiency bonus to ability checks without proficiency.',
      },
      {
        name: 'Song of Rest',
        level: 2,
        summary:
          'Allies who spend hit dice during your short rest regain an extra d6 HP (d8 at 9th, d10 at 13th, d12 at 17th).',
      },
      { name: 'Expertise', level: 3, summary: 'Double the proficiency bonus for two skills (two more at 10th level).' },
      { name: 'Font of Inspiration', level: 5, summary: 'Bardic Inspiration recharges on a short or long rest.' },
      {
        name: 'Countercharm',
        level: 6,
        summary:
          'Action: until the end of your next turn, you and allies within 30 ft have advantage on saves against being frightened or charmed.',
      },
      {
        name: 'Magical Secrets',
        level: 10,
        summary: 'Learn two spells from any class (two more at 14th and 18th level).',
      },
      {
        name: 'Superior Inspiration',
        level: 20,
        summary: 'Regain one use of Bardic Inspiration when you roll initiative with none left.',
      },
    ],
    subclass: {
      name: 'College of Lore',
      features: [
        { name: 'Bonus Proficiencies', level: 3, summary: 'Gain proficiency with three skills of your choice.' },
        {
          name: 'Cutting Words',
          level: 3,
          summary:
            "Reaction: spend a Bardic Inspiration die to subtract it from a creature's attack roll, ability check or damage roll.",
        },
        { name: 'Additional Magical Secrets', level: 6, summary: 'Learn two spells from any class.' },
        {
          name: 'Peerless Skill',
          level: 14,
          summary: 'Spend a Bardic Inspiration die to add it to your own ability check.',
        },
      ],
    },
  },
  {
    name: 'Cleric',
    hitDie: 8,
    subclassLevel: 1,
    asiLevels: STANDARD_ASI,
    features: [
      { name: 'Spellcasting', level: 1, summary: 'Cast prepared cleric spells using Wisdom.' },
      {
        name: 'Channel Divinity',
        level: 2,
        summary: 'Channel divine energy for an effect such as Turn Undead or a domain option.',
        uses: ({ level }) =>
          byLevel([
            [2, 1],
            [6, 2],
            [18, 3],
          ])(level),
        recharge: 'short',
      },
      {
        name: 'Turn Undead',
        level: 2,
        summary: 'Channel Divinity: undead within 30 ft that fail a Wisdom save are turned for 1 minute.',
      },
      {
        name: 'Destroy Undead',
        level: 5,
        summary: 'Turned undead of low challenge rating are destroyed instead (CR 1/2, rising to CR 4 at 17th level).',
      },
      {
        name: 'Divine Intervention',
        level: 10,
        summary:
          'Call on your deity; succeeds if a d100 roll is at or below your cleric level (automatic at 20th). On success, wait 7 days before trying again.',
        uses: () => 1,
        recharge: 'long',
      },
    ],
    subclass: {
      name: 'Life Domain',
      features: [
        { name: 'Bonus Proficiency', level: 1, summary: 'Proficiency with heavy armor.' },
        {
          name: 'Disciple of Life',
          level: 1,
          summary: 'Healing spells of 1st level or higher restore an additional 2 + spell level hit points.',
        },
        {
          name: 'Channel Divinity: Preserve Life',
          level: 2,
          summary:
            'Action: divide up to five times your cleric level in healing among creatures within 30 ft (up to half their maximum HP).',
        },
        {
          name: 'Blessed Healer',
          level: 6,
          summary: 'When you heal others with a spell, you regain 2 + spell level hit points.',
        },
        {
          name: 'Divine Strike',
          level: 8,
          summary: 'Once per turn, a weapon hit deals an extra 1d8 radiant damage (2d8 at 14th level).',
        },
        { name: 'Supreme Healing', level: 17, summary: 'Healing spell dice always count as their maximum.' },
      ],
    },
  },
  {
    name: 'Druid',
    hitDie: 8,
    subclassLevel: 2,
    asiLevels: STANDARD_ASI,
    features: [
      { name: 'Druidic', level: 1, summary: 'You know the secret language of druids.' },
      { name: 'Spellcasting', level: 1, summary: 'Cast prepared druid spells using Wisdom.' },
      {
        name: 'Wild Shape',
        level: 2,
        summary:
          'Action: turn into a beast you have seen (CR 1/4, CR 1/2 at 4th, CR 1 at 8th) for up to half your druid level in hours.',
        uses: ({ level }) => (level >= 20 ? null : 2),
        recharge: 'short',
      },
      { name: 'Timeless Body', level: 18, summary: 'You age only one year for every ten that pass.' },
      { name: 'Beast Spells', level: 18, summary: 'You can cast many druid spells while in Wild Shape.' },
      { name: 'Archdruid', level: 20, summary: 'Unlimited Wild Shape, and you can ignore most spell components.' },
    ],
    subclass: {
      name: 'Circle of the Land',
      features: [
        { name: 'Bonus Cantrip', level: 2, summary: 'Learn one additional druid cantrip.' },
        {
          name: 'Natural Recovery',
          level: 2,
          summary:
            'During a short rest, recover spell slots with a combined level up to half your druid level (rounded up), none of 6th level or higher.',
          uses: () => 1,
          recharge: 'long',
        },
        { name: 'Circle Spells', level: 3, summary: 'Your chosen land grants extra spells that are always prepared.' },
        {
          name: "Land's Stride",
          level: 6,
          summary: 'Nonmagical difficult terrain costs no extra movement; advantage on saves against magical plants.',
        },
        {
          name: "Nature's Ward",
          level: 10,
          summary: "Immune to poison and disease; elementals and fey can't charm or frighten you.",
        },
        {
          name: "Nature's Sanctuary",
          level: 14,
          summary: 'Beasts and plants must make a Wisdom save before attacking you.',
        },
      ],
    },
  },
  {
    name: 'Fighter',
    hitDie: 10,
    subclassLevel: 3,
    asiLevels: [4, 6, 8, 12, 14, 16, 19],
    features: [
      { name: 'Fighting Style', level: 1, summary: 'Adopt a fighting style such as Archery, Defense or Dueling.' },
      {
        name: 'Second Wind',
        level: 1,
        summary: 'Bonus action: regain 1d10 + fighter level hit points.',
        uses: () => 1,
        recharge: 'short',
      },
      {
        name: 'Action Surge',
        level: 2,
        summary: 'Take one additional action on your turn.',
        uses: ({ level }) =>
          byLevel([
            [2, 1],
            [17, 2],
          ])(level),
        recharge: 'short',
      },
      {
        name: 'Extra Attack',
        level: 5,
        summary: 'Attack twice when you take the Attack action (three times at 11th level, four times at 20th).',
      },
      {
        name: 'Indomitable',
        level: 9,
        summary: 'Reroll a failed saving throw and use the new roll.',
        uses: ({ level }) =>
          byLevel([
            [9, 1],
            [13, 2],
            [17, 3],
          ])(level),
        recharge: 'long',
      },
    ],
    subclass: {
      name: 'Champion',
      features: [
        { name: 'Improved Critical', level: 3, summary: 'Weapon attacks score a critical hit on a roll of 19 or 20.' },
        {
          name: 'Remarkable Athlete',
          level: 7,
          summary:
            'Add half your proficiency bonus to Strength, Dexterity and Constitution checks without proficiency; longer running jumps.',
        },
        { name: 'Additional Fighting Style', level: 10, summary: 'Choose a second fighting style.' },
        { name: 'Superior Critical', level: 15, summary: 'Weapon attacks score a critical hit on a roll of 18–20.' },
        {
          name: 'Survivor',
          level: 18,
          summary:
            'At the start of each turn, regain 5 + Constitution modifier HP if you have no more than half your HP left (but at least 1).',
        },
      ],
    },
  },
  {
    name: 'Monk',
    hitDie: 8,
    subclassLevel: 3,
    asiLevels: STANDARD_ASI,
    features: [
      {
        name: 'Unarmored Defense',
        level: 1,
        summary: 'Without armor or shield, AC equals 10 + Dexterity modifier + Wisdom modifier.',
      },
      {
        name: 'Martial Arts',
        level: 1,
        summary:
          'Use Dexterity for unarmed strikes and monk weapons, roll a martial arts die (d4, rising to d10 at 17th) for their damage, and make an unarmed strike as a bonus action after attacking.',
      },
      {
        name: 'Ki',
        level: 2,
        summary:
          'Spend ki points on Flurry of Blows, Patient Defense or Step of the Wind. Save DC 8 + proficiency + Wisdom.',
        uses: ({ level }) => level,
        recharge: 'short',
      },
      {
        name: 'Unarmored Movement',
        level: 2,
        summary: 'Extra speed without armor or shield (+10 ft, rising to +30 ft at 18th level).',
      },
      {
        name: 'Deflect Missiles',
        level: 3,
        summary:
          'Reaction: reduce ranged weapon damage by 1d10 + Dexterity modifier + monk level; catch and throw it back for 1 ki.',
      },
      { name: 'Slow Fall', level: 4, summary: 'Reaction: reduce falling damage by five times your monk level.' },
      { name: 'Extra Attack', level: 5, summary: 'Attack twice when you take the Attack action.' },
      {
        name: 'Stunning Strike',
        level: 5,
        summary:
          'After a melee weapon hit, spend 1 ki: the target must succeed on a Constitution save or be stunned until the end of your next turn.',
      },
      { name: 'Ki-Empowered Strikes', level: 6, summary: 'Unarmed strikes count as magical.' },
      {
        name: 'Evasion',
        level: 7,
        summary: 'Dexterity saves for half damage: no damage on a success, half on a failure.',
      },
      {
        name: 'Stillness of Mind',
        level: 7,
        summary: 'Action: end one effect causing you to be charmed or frightened.',
      },
      { name: 'Purity of Body', level: 10, summary: 'Immune to disease and poison.' },
      {
        name: 'Tongue of the Sun and Moon',
        level: 13,
        summary: 'You understand all spoken languages, and creatures understand you.',
      },
      {
        name: 'Diamond Soul',
        level: 14,
        summary: 'Proficiency in all saving throws; spend 1 ki to reroll a failed save.',
      },
      { name: 'Timeless Body', level: 15, summary: 'No frailty of old age, and you need no food or water.' },
      {
        name: 'Empty Body',
        level: 18,
        summary:
          'Spend 4 ki to become invisible with resistance to most damage for 1 minute, or 8 ki to cast Astral Projection.',
      },
      { name: 'Perfect Self', level: 20, summary: 'Regain 4 ki points when you roll initiative with none left.' },
    ],
    subclass: {
      name: 'Way of the Open Hand',
      features: [
        {
          name: 'Open Hand Technique',
          level: 3,
          summary: 'Flurry of Blows hits can knock a target prone, push it 15 ft, or stop its reactions.',
        },
        {
          name: 'Wholeness of Body',
          level: 6,
          summary: 'Action: regain hit points equal to three times your monk level.',
          uses: () => 1,
          recharge: 'long',
        },
        {
          name: 'Tranquility',
          level: 11,
          summary: 'After a long rest you gain the effect of a Sanctuary spell until your next long rest.',
        },
        {
          name: 'Quivering Palm',
          level: 17,
          summary:
            'Spend 3 ki on an unarmed hit to set lethal vibrations you can trigger later (Constitution save or drop to 0 HP).',
        },
      ],
    },
  },
  {
    name: 'Paladin',
    hitDie: 10,
    subclassLevel: 3,
    asiLevels: STANDARD_ASI,
    features: [
      {
        name: 'Divine Sense',
        level: 1,
        summary: 'Action: sense celestials, fiends and undead within 60 ft until the end of your next turn.',
        uses: ({ mod }) => 1 + Math.max(0, mod('charisma')),
        recharge: 'long',
      },
      {
        name: 'Lay on Hands',
        level: 1,
        summary:
          'Action: restore hit points from a pool of five times your paladin level, or spend 5 points to cure a disease or poison.',
        uses: ({ level }) => level * 5,
        recharge: 'long',
      },
      { name: 'Fighting Style', level: 2, summary: 'Adopt a fighting style such as Defense, Dueling or Protection.' },
      { name: 'Spellcasting', level: 2, summary: 'Cast prepared paladin spells using Charisma.' },
      {
        name: 'Divine Smite',
        level: 2,
        summary:
          'When you hit with a melee weapon, expend a spell slot for 2d8 extra radiant damage (+1d8 per slot level above 1st, +1d8 against undead or fiends).',
      },
      { name: 'Divine Health', level: 3, summary: 'Immune to disease.' },
      {
        name: 'Channel Divinity',
        level: 3,
        summary: 'Channel divine energy for one of your oath options.',
        uses: () => 1,
        recharge: 'short',
      },
      { name: 'Extra Attack', level: 5, summary: 'Attack twice when you take the Attack action.' },
      {
        name: 'Aura of Protection',
        level: 6,
        summary: 'You and allies within 10 ft (30 ft at 18th level) add your Charisma modifier to saving throws.',
      },
      {
        name: 'Aura of Courage',
        level: 10,
        summary: "You and allies within 10 ft (30 ft at 18th level) can't be frightened.",
      },
      { name: 'Improved Divine Smite', level: 11, summary: 'Melee weapon hits deal an extra 1d8 radiant damage.' },
      {
        name: 'Cleansing Touch',
        level: 14,
        summary: 'Action: end one spell on yourself or a willing creature you touch.',
        uses: ({ mod }) => atLeastOne(mod('charisma')),
        recharge: 'long',
      },
    ],
    subclass: {
      name: 'Oath of Devotion',
      features: [
        { name: 'Oath Spells', level: 3, summary: 'Your oath grants extra spells that are always prepared.' },
        {
          name: 'Channel Divinity: Sacred Weapon',
          level: 3,
          summary:
            'Action: add your Charisma modifier to attack rolls with a weapon, which also sheds light, for 1 minute.',
        },
        {
          name: 'Channel Divinity: Turn the Unholy',
          level: 3,
          summary: 'Action: fiends and undead within 30 ft that fail a Wisdom save are turned for 1 minute.',
        },
        {
          name: 'Aura of Devotion',
          level: 7,
          summary: "You and allies within 10 ft (30 ft at 18th level) can't be charmed while you are conscious.",
        },
        {
          name: 'Purity of Spirit',
          level: 15,
          summary: 'You are always under the effect of Protection from Evil and Good.',
        },
        {
          name: 'Holy Nimbus',
          level: 20,
          summary:
            'Action: emanate bright light for 1 minute; enemies starting their turn in it take 10 radiant damage, and you have advantage on saves against spells of fiends and undead.',
          uses: () => 1,
          recharge: 'long',
        },
      ],
    },
  },
  {
    name: 'Ranger',
    hitDie: 10,
    subclassLevel: 3,
    asiLevels: STANDARD_ASI,
    features: [
      {
        name: 'Favored Enemy',
        level: 1,
        summary:
          'Advantage on Survival checks to track, and on Intelligence checks to recall information about your favored enemies.',
      },
      {
        name: 'Natural Explorer',
        level: 1,
        summary: 'Expertise and travel benefits in your favored terrain.',
      },
      {
        name: 'Fighting Style',
        level: 2,
        summary: 'Adopt a fighting style such as Archery, Defense or Two-Weapon Fighting.',
      },
      { name: 'Spellcasting', level: 2, summary: 'Cast known ranger spells using Wisdom.' },
      {
        name: 'Primeval Awareness',
        level: 3,
        summary: 'Expend a spell slot to sense certain creature types nearby for 1 minute per slot level.',
      },
      { name: 'Extra Attack', level: 5, summary: 'Attack twice when you take the Attack action.' },
      {
        name: "Land's Stride",
        level: 8,
        summary: 'Nonmagical difficult terrain costs no extra movement; advantage on saves against magical plants.',
      },
      {
        name: 'Hide in Plain Sight',
        level: 10,
        summary: 'Spend 1 minute camouflaging yourself for +10 on Stealth checks while you stay still.',
      },
      { name: 'Vanish', level: 14, summary: "Hide as a bonus action; you can't be tracked by nonmagical means." },
      {
        name: 'Feral Senses',
        level: 18,
        summary:
          "No disadvantage against creatures you can't see; you know where invisible creatures within 30 ft are.",
      },
      {
        name: 'Foe Slayer',
        level: 20,
        summary: 'Once per turn, add your Wisdom modifier to an attack or damage roll against a favored enemy.',
      },
    ],
    subclass: {
      name: 'Hunter',
      features: [
        { name: "Hunter's Prey", level: 3, summary: 'Choose Colossus Slayer, Giant Killer or Horde Breaker.' },
        { name: 'Defensive Tactics', level: 7, summary: 'Choose Escape the Horde, Multiattack Defense or Steel Will.' },
        { name: 'Multiattack', level: 11, summary: 'Choose Volley or Whirlwind Attack.' },
        {
          name: "Superior Hunter's Defense",
          level: 15,
          summary: 'Choose Evasion, Stand Against the Tide or Uncanny Dodge.',
        },
      ],
    },
  },
  {
    name: 'Rogue',
    hitDie: 8,
    subclassLevel: 3,
    asiLevels: [4, 8, 10, 12, 16, 19],
    features: [
      {
        name: 'Expertise',
        level: 1,
        summary: "Double the proficiency bonus for two skills or thieves' tools (two more at 6th level).",
      },
      {
        name: 'Sneak Attack',
        level: 1,
        summary:
          'Once per turn, deal extra damage (1d6 per two rogue levels, rounded up) with a finesse or ranged weapon if you have advantage or an ally is next to the target.',
      },
      { name: "Thieves' Cant", level: 1, summary: 'A secret mix of dialect, jargon and code known to rogues.' },
      { name: 'Cunning Action', level: 2, summary: 'Dash, Disengage or Hide as a bonus action.' },
      { name: 'Uncanny Dodge', level: 5, summary: "Reaction: halve the damage of an attacker's hit you can see." },
      {
        name: 'Evasion',
        level: 7,
        summary: 'Dexterity saves for half damage: no damage on a success, half on a failure.',
      },
      {
        name: 'Reliable Talent',
        level: 11,
        summary: 'Treat a d20 roll of 9 or lower as a 10 on ability checks you are proficient in.',
      },
      {
        name: 'Blindsense',
        level: 14,
        summary: 'You know where hidden or invisible creatures within 10 ft are, if you can hear.',
      },
      { name: 'Slippery Mind', level: 15, summary: 'Proficiency in Wisdom saving throws.' },
      {
        name: 'Elusive',
        level: 18,
        summary: "No attack roll has advantage against you while you aren't incapacitated.",
      },
      {
        name: 'Stroke of Luck',
        level: 20,
        summary: 'Turn a missed attack into a hit, or a failed ability check into a 20.',
        uses: () => 1,
        recharge: 'short',
      },
    ],
    subclass: {
      name: 'Thief',
      features: [
        {
          name: 'Fast Hands',
          level: 3,
          summary: "Cunning Action also lets you use an object, use thieves' tools or make a Sleight of Hand check.",
        },
        { name: 'Second-Story Work', level: 3, summary: 'Climbing costs no extra movement; longer running jumps.' },
        {
          name: 'Supreme Sneak',
          level: 9,
          summary: 'Advantage on Stealth checks if you move no more than half your speed.',
        },
        { name: 'Use Magic Device', level: 13, summary: 'Ignore class, race and level requirements on magic items.' },
        { name: "Thief's Reflexes", level: 17, summary: 'Take two turns in the first round of combat.' },
      ],
    },
  },
  {
    name: 'Sorcerer',
    hitDie: 6,
    subclassLevel: 1,
    asiLevels: STANDARD_ASI,
    features: [
      { name: 'Spellcasting', level: 1, summary: 'Cast known sorcerer spells using Charisma.' },
      {
        name: 'Font of Magic',
        level: 2,
        summary: 'Sorcery points: convert them into spell slots or the other way round, and fuel Metamagic.',
        uses: ({ level }) => level,
        recharge: 'long',
      },
      { name: 'Metamagic', level: 3, summary: 'Learn two Metamagic options (one more at 10th and 17th level).' },
      { name: 'Sorcerous Restoration', level: 20, summary: 'Regain 4 sorcery points on a short rest.' },
    ],
    subclass: {
      name: 'Draconic Bloodline',
      features: [
        {
          name: 'Dragon Ancestor',
          level: 1,
          summary: 'Choose a dragon type; you speak Draconic and have advantage on related Charisma checks.',
        },
        {
          name: 'Draconic Resilience',
          level: 1,
          summary: '+1 maximum HP per sorcerer level; without armor, AC equals 13 + Dexterity modifier.',
        },
        {
          name: 'Elemental Affinity',
          level: 6,
          summary:
            "Add your Charisma modifier to damage of your ancestry's type; spend 1 sorcery point for resistance to it.",
        },
        {
          name: 'Dragon Wings',
          level: 14,
          summary: 'Bonus action: sprout wings and gain a flying speed equal to your speed.',
        },
        {
          name: 'Draconic Presence',
          level: 18,
          summary: 'Spend 5 sorcery points to charm or frighten creatures within 60 ft for 1 minute (Wisdom save).',
        },
      ],
    },
  },
  {
    name: 'Warlock',
    hitDie: 8,
    subclassLevel: 1,
    asiLevels: STANDARD_ASI,
    features: [
      {
        name: 'Pact Magic',
        level: 1,
        summary: 'Cast warlock spells using Charisma; your spell slots return on a short rest.',
      },
      {
        name: 'Eldritch Invocations',
        level: 2,
        summary: 'Learn invocations that grant lasting abilities (more as you level up).',
      },
      { name: 'Pact Boon', level: 3, summary: 'Choose Pact of the Chain, the Blade or the Tome.' },
      {
        name: 'Mystic Arcanum (6th level)',
        level: 11,
        summary: 'Cast your chosen 6th-level spell without a spell slot.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Mystic Arcanum (7th level)',
        level: 13,
        summary: 'Cast your chosen 7th-level spell without a spell slot.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Mystic Arcanum (8th level)',
        level: 15,
        summary: 'Cast your chosen 8th-level spell without a spell slot.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Mystic Arcanum (9th level)',
        level: 17,
        summary: 'Cast your chosen 9th-level spell without a spell slot.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Eldritch Master',
        level: 20,
        summary: 'Spend 1 minute to regain all expended Pact Magic spell slots.',
        uses: () => 1,
        recharge: 'long',
      },
    ],
    subclass: {
      name: 'The Fiend',
      features: [
        {
          name: "Dark One's Blessing",
          level: 1,
          summary: 'When you reduce a hostile creature to 0 HP, gain Charisma modifier + warlock level temporary HP.',
        },
        {
          name: "Dark One's Own Luck",
          level: 6,
          summary: 'Add a d10 to an ability check or saving throw.',
          uses: () => 1,
          recharge: 'short',
        },
        { name: 'Fiendish Resilience', level: 10, summary: 'After a rest, choose one damage type to be resistant to.' },
        {
          name: 'Hurl Through Hell',
          level: 14,
          summary:
            'When you hit a creature, banish it through the lower planes; it takes 10d10 psychic damage if it is not a fiend.',
          uses: () => 1,
          recharge: 'long',
        },
      ],
    },
  },
  {
    name: 'Wizard',
    hitDie: 6,
    subclassLevel: 2,
    asiLevels: STANDARD_ASI,
    features: [
      {
        name: 'Spellcasting',
        level: 1,
        summary: 'Cast prepared wizard spells from your spellbook using Intelligence.',
      },
      {
        name: 'Arcane Recovery',
        level: 1,
        summary:
          'Once a day during a short rest, recover spell slots with a combined level up to half your wizard level (rounded up), none of 6th level or higher.',
        uses: () => 1,
        recharge: 'long',
      },
      {
        name: 'Spell Mastery',
        level: 18,
        summary: 'Cast your chosen 1st- and 2nd-level spells at their lowest level without a slot.',
      },
      {
        name: 'Signature Spells',
        level: 20,
        summary: 'Two chosen 3rd-level spells are always prepared; cast each once at 3rd level without a slot.',
        uses: () => 2,
        recharge: 'short',
      },
    ],
    subclass: {
      name: 'School of Evocation',
      features: [
        {
          name: 'Evocation Savant',
          level: 2,
          summary: 'Copying evocation spells into your spellbook costs half the gold and time.',
        },
        {
          name: 'Sculpt Spells',
          level: 2,
          summary: 'Protect some creatures from your evocation spells: they automatically succeed and take no damage.',
        },
        {
          name: 'Potent Cantrip',
          level: 6,
          summary: 'Creatures that succeed on a save against your cantrip still take half damage.',
        },
        {
          name: 'Empowered Evocation',
          level: 10,
          summary: 'Add your Intelligence modifier to the damage of wizard evocation spells.',
        },
        {
          name: 'Overchannel',
          level: 14,
          summary:
            'Deal maximum damage with a spell of 5th level or lower; using it again before a long rest deals necrotic damage to you.',
        },
      ],
    },
  },
]

export function findClass(className: string): ClassDef | undefined {
  return CLASS_CATALOG.find(c => c.name === className)
}

/** The SRD subclass of a class if the character follows it (custom subclasses have no catalog features). */
function srdSubclass(cls: ClassDef, subclass: string | null): SubclassDef | null {
  return subclass !== null && subclass.trim().toLowerCase() === cls.subclass.name.toLowerCase() ? cls.subclass : null
}

function toFeature(def: ClassFeatureDef, source: string, level: number, scores: AbilityScores): CharacterFeature {
  const usesMax = def.uses ? def.uses({ level, mod: a => abilityModifier(scores[a]) }) : null
  const recharge = typeof def.recharge === 'function' ? def.recharge(level) : (def.recharge ?? null)
  return {
    name: def.name,
    source,
    description: def.summary,
    usesMax,
    usesCurrent: usesMax,
    recharge: usesMax === null ? null : recharge,
  }
}

/** All class and subclass features a character has at a level, with uses calculated. */
export function classFeaturesAt(
  className: string,
  subclass: string | null,
  level: number,
  scores: AbilityScores,
): CharacterFeature[] {
  const cls = findClass(className)
  if (!cls) return []
  const sub = srdSubclass(cls, subclass)
  return [
    ...cls.features.map(def => ({ def, source: cls.name })),
    ...(sub?.features ?? []).map(def => ({ def, source: sub!.name })),
  ]
    .filter(({ def }) => def.level <= level)
    .sort((a, b) => a.def.level - b.def.level)
    .map(({ def, source }) => toFeature(def, source, level, scores))
}

/** Features gained exactly at a level (for the level-up summary). */
export function featuresGainedAt(
  className: string,
  subclass: string | null,
  level: number,
  scores: AbilityScores,
): CharacterFeature[] {
  const before = new Set(classFeaturesAt(className, subclass, level - 1, scores).map(f => `${f.source}/${f.name}`))
  return classFeaturesAt(className, subclass, level, scores).filter(f => !before.has(`${f.source}/${f.name}`))
}

/** Whether the catalog has features for the character that it does not track yet. */
type FeatureHolder = Pick<Character, 'className' | 'subclass' | 'level' | 'scores' | 'features'>

export function hasMissingClassFeatures(character: FeatureHolder): boolean {
  const have = new Set(character.features.map(f => `${f.source}/${f.name}`))
  return classFeaturesAt(character.className, character.subclass, character.level, character.scores).some(
    f => !have.has(`${f.source}/${f.name}`),
  )
}

/**
 * Brings the character's class and subclass features in line with its level:
 * adds new ones, recalculates uses (keeping how many are spent), drops ones from
 * levels the character no longer has. Features from other sources are kept as they are.
 */
export function syncClassFeatures<T extends FeatureHolder>(character: T): T {
  const cls = findClass(character.className)
  if (!cls) return character
  const catalogSources = new Set([cls.name, cls.subclass.name])
  const expected = classFeaturesAt(character.className, character.subclass, character.level, character.scores)
  const existing = new Map(character.features.map(f => [`${f.source}/${f.name}`, f]))

  const synced = expected.map(f => {
    const old = existing.get(`${f.source}/${f.name}`)
    if (!old || old.usesCurrent === null || old.usesMax === null || f.usesMax === null) return f
    const spent = Math.max(0, old.usesMax - old.usesCurrent)
    return { ...f, usesCurrent: Math.max(0, f.usesMax - spent) }
  })
  const others = character.features.filter(f => !catalogSources.has(f.source))
  return { ...character, features: [...synced, ...others] }
}
