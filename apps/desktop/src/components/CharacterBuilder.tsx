import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, AbilityName, SkillName, SkillEntry } from '@fablesheet/core'
import {
  abilityModifier as mod,
  formatModifier as fmtMod,
  armorClass,
  CHARACTER_SCHEMA_VERSION,
  proficiencyBonusForLevel,
  spellAttackBonus,
  spellSaveDC,
} from '@fablesheet/core'
import {
  BACKGROUND_CATALOG,
  CUSTOM_BACKGROUND_SKILLS,
  LANGUAGES,
  RACE_CATALOG,
  SPELL_CATALOG,
  ancestryDescription,
  findBackground,
  findClass,
  raceAbilityBonuses,
  startingItems,
  syncFeatures,
} from '@fablesheet/srd-data'
import { createCharacter } from '../services/api'
import { gameLabel } from '../i18n/game'
import { Button } from './ui/Button'
import { SubclassPicker } from './levelup/SubclassPicker'

// ─── Static rules data ──────────────────────────────────────────────────────────

const ABILITY_NAMES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

const SKILL_ABILITY: Record<SkillName, AbilityName> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
}

const RACE_SYMBOLS: Record<string, string> = {
  Human: '◈',
  Elf: '🌙',
  Dwarf: '⛏',
  Halfling: '🍀',
  Dragonborn: '🐉',
  Gnome: '⚙',
  'Half-Elf': '🌿',
  'Half-Orc': '⚡',
  Tiefling: '🔥',
}

interface ClassInfo {
  name: string
  symbol: string
  hitDie: number
  savingThrows: AbilityName[]
  skillPool: SkillName[]
  skillCount: number
  spellcastingAbility: AbilityName | null
}

const CLASSES: ClassInfo[] = [
  {
    name: 'Barbarian',
    symbol: '⚡',
    hitDie: 12,
    savingThrows: ['strength', 'constitution'],
    skillPool: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    skillCount: 2,
    spellcastingAbility: null,
  },
  {
    name: 'Bard',
    symbol: '♪',
    hitDie: 8,
    savingThrows: ['dexterity', 'charisma'],
    skillPool: [
      'acrobatics',
      'animalHandling',
      'arcana',
      'athletics',
      'deception',
      'history',
      'insight',
      'intimidation',
      'investigation',
      'medicine',
      'nature',
      'perception',
      'performance',
      'persuasion',
      'religion',
      'sleightOfHand',
      'stealth',
      'survival',
    ],
    skillCount: 3,
    spellcastingAbility: 'charisma',
  },
  {
    name: 'Cleric',
    symbol: '☩',
    hitDie: 8,
    savingThrows: ['wisdom', 'charisma'],
    skillPool: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    skillCount: 2,
    spellcastingAbility: 'wisdom',
  },
  {
    name: 'Druid',
    symbol: '✿',
    hitDie: 8,
    savingThrows: ['intelligence', 'wisdom'],
    skillPool: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    skillCount: 2,
    spellcastingAbility: 'wisdom',
  },
  {
    name: 'Fighter',
    symbol: '⚔',
    hitDie: 10,
    savingThrows: ['strength', 'constitution'],
    skillPool: [
      'acrobatics',
      'animalHandling',
      'athletics',
      'history',
      'insight',
      'intimidation',
      'perception',
      'survival',
    ],
    skillCount: 2,
    spellcastingAbility: null,
  },
  {
    name: 'Monk',
    symbol: '◯',
    hitDie: 8,
    savingThrows: ['strength', 'dexterity'],
    skillPool: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    skillCount: 2,
    spellcastingAbility: null,
  },
  {
    name: 'Paladin',
    symbol: '✠',
    hitDie: 10,
    savingThrows: ['wisdom', 'charisma'],
    skillPool: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    skillCount: 2,
    spellcastingAbility: 'charisma',
  },
  {
    name: 'Ranger',
    symbol: '◎',
    hitDie: 10,
    savingThrows: ['strength', 'dexterity'],
    skillPool: [
      'animalHandling',
      'athletics',
      'insight',
      'investigation',
      'nature',
      'perception',
      'stealth',
      'survival',
    ],
    skillCount: 3,
    spellcastingAbility: 'wisdom',
  },
  {
    name: 'Rogue',
    symbol: '◈',
    hitDie: 8,
    savingThrows: ['dexterity', 'intelligence'],
    skillPool: [
      'acrobatics',
      'athletics',
      'deception',
      'insight',
      'intimidation',
      'investigation',
      'perception',
      'performance',
      'persuasion',
      'sleightOfHand',
      'stealth',
    ],
    skillCount: 4,
    spellcastingAbility: null,
  },
  {
    name: 'Sorcerer',
    symbol: '✧',
    hitDie: 6,
    savingThrows: ['constitution', 'charisma'],
    skillPool: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    skillCount: 2,
    spellcastingAbility: 'charisma',
  },
  {
    name: 'Warlock',
    symbol: '◆',
    hitDie: 8,
    savingThrows: ['wisdom', 'charisma'],
    skillPool: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    skillCount: 2,
    spellcastingAbility: 'charisma',
  },
  {
    name: 'Wizard',
    symbol: '✦',
    hitDie: 6,
    savingThrows: ['intelligence', 'wisdom'],
    skillPool: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    skillCount: 2,
    spellcastingAbility: 'intelligence',
  },
]

/** Background value for a background the player describes themselves */
const CUSTOM_BACKGROUND = '__custom__'
const ALL_SKILLS = Object.keys(SKILL_ABILITY) as SkillName[]

/** Toggles a value in a list that may hold at most `max` values (1 = single choice). */
function toggleIn<T>(list: T[], value: T, max: number): T[] {
  if (list.includes(value)) return list.filter(v => v !== value)
  if (max === 1) return [value]
  return list.length < max ? [...list, value] : list
}

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onCreated: (character: Character) => void
  onCancel: () => void
}

interface BuilderState {
  name: string
  race: string
  alignment: string
  /** Without the SRD subrace (e.g. for a subrace from another book) */
  noSubrace: boolean
  /** Dragonborn ancestry (dragon colour) */
  ancestry: string
  /** Spell name of the racial cantrip choice (High Elf) */
  cantrip: string
  /** Free +1 ability bonuses (Half-Elf) */
  raceAbilityPicks: AbilityName[]
  /** Skills of choice from the race (Half-Elf) */
  raceSkills: SkillName[]
  /** Languages of choice */
  languages: string[]
  customBackgroundName: string
  customSkills: SkillName[]
  className: string
  /** Only asked for classes that choose their subclass at 1st level */
  subclass: string
  assignedScores: Partial<Record<AbilityName, number>>
  selectedScore: number | null
  background: string
  chosenSkills: SkillName[]
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
}

export function CharacterBuilder({ onCreated, onCancel }: Props) {
  const { t } = useTranslation()
  const STEP_LABELS = t('builder.steps', { returnObjects: true }) as string[]
  const abilityShort = (a: AbilityName) => gameLabel(t, 'abilityShort', a)
  const skillLabel = (sk: SkillName) => gameLabel(t, 'skill', sk)
  const [step, setStep] = useState(0)
  const [s, setS] = useState<BuilderState>({
    name: '',
    race: '',
    alignment: '',
    noSubrace: false,
    ancestry: '',
    cantrip: '',
    raceAbilityPicks: [],
    raceSkills: [],
    languages: [],
    customBackgroundName: '',
    customSkills: [],
    className: '',
    subclass: '',
    assignedScores: {},
    selectedScore: null,
    background: '',
    chosenSkills: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const race = RACE_CATALOG.find(r => r.name === s.race)
  const subrace = race?.subrace && !s.noSubrace ? race.subrace : null
  /** Stored race name: the SRD subrace if chosen, otherwise the race */
  const raceName = subrace?.name ?? race?.name ?? ''
  const raceBonuses = raceAbilityBonuses(raceName)
  const bonusFor = (a: AbilityName) => (raceBonuses[a] ?? 0) + (s.raceAbilityPicks.includes(a) ? 1 : 0)
  const cantripOptions = subrace?.cantripChoice
    ? SPELL_CATALOG.filter(sp => sp.level === 0 && subrace.cantripChoice!.spells.includes(sp.name))
    : []
  const cls = CLASSES.find(c => c.name === s.className)
  const srdClass = findClass(s.className)
  const bg = findBackground(s.background)
  const customBg = s.background === CUSTOM_BACKGROUND
  const bgSkills: SkillName[] = bg?.skills ?? (customBg ? s.customSkills : [])
  const fixedRaceSkills = race?.skills ?? []
  const raceSkillCount = race?.skillChoices ?? 0
  const languageCount = (race?.extraLanguages ?? 0) + (subrace?.extraLanguages ?? 0) + (bg?.extraLanguages ?? 0)
  const lockedSkills = new Set<SkillName>([...bgSkills, ...fixedRaceSkills, ...s.raceSkills])
  const classSkills = s.chosenSkills.filter(sk => !lockedSkills.has(sk))

  // Computed final ability scores (base + race bonus)
  const finalScores = ABILITY_NAMES.reduce(
    (acc, a) => {
      const base = s.assignedScores[a] ?? 0
      acc[a] = base + bonusFor(a)
      return acc
    },
    {} as Record<AbilityName, number>,
  )

  const usedScores = Object.values(s.assignedScores) as number[]
  const availableScores = STANDARD_ARRAY.filter(v => !usedScores.includes(v))
  const allAssigned = availableScores.length === 0

  // Step validity
  const valid = [
    s.name.trim().length > 0 &&
      !!race &&
      !!s.alignment &&
      (!race.ancestries || !!s.ancestry) &&
      (cantripOptions.length === 0 || !!s.cantrip),
    !!s.className,
    allAssigned && s.raceAbilityPicks.length === (race?.abilityChoices ?? 0),
    (!!bg || (customBg && !!s.customBackgroundName.trim() && s.customSkills.length === CUSTOM_BACKGROUND_SKILLS)) &&
      classSkills.length === (cls?.skillCount ?? 0) &&
      s.raceSkills.length === raceSkillCount &&
      s.languages.length === languageCount,
    true, // personality is optional
  ]

  // ── Score-chip interactions ────────────────────────────────────────────────
  function handleScoreChipClick(score: number) {
    setS(prev => ({
      ...prev,
      selectedScore: prev.selectedScore === score ? null : score,
    }))
  }

  function handleAbilityClick(ability: AbilityName) {
    const { selectedScore, assignedScores } = s
    const current = assignedScores[ability]

    if (selectedScore !== null) {
      // Assign selectedScore to this ability; return old score to pool
      const newAssigned = { ...assignedScores, [ability]: selectedScore }
      setS(prev => ({ ...prev, assignedScores: newAssigned, selectedScore: null }))
    } else if (current !== undefined) {
      // Unassign this ability's score → it re-enters the pool
      const newAssigned = { ...assignedScores }
      delete newAssigned[ability]
      setS(prev => ({ ...prev, assignedScores: newAssigned }))
    }
  }

  // ── Class change: clear skills ──────────────────────────────────────────────
  function setClass(name: string) {
    const srd = findClass(name)
    setS(prev => ({
      ...prev,
      className: name,
      chosenSkills: [],
      subclass: srd?.subclassLevel === 1 ? srd.subclass.name : '',
    }))
  }

  // ── Race change: clear choices that depend on the race ─────────────────────
  function setRace(name: string) {
    setS(prev => ({
      ...prev,
      race: name,
      noSubrace: false,
      ancestry: '',
      cantrip: '',
      raceAbilityPicks: [],
      raceSkills: [],
      languages: [],
    }))
  }

  // ── Background change: clear skill choices ──────────────────────────────────
  function setBackground(name: string) {
    setS(prev => ({ ...prev, background: name, chosenSkills: [], customSkills: [], languages: [] }))
  }

  // ── Skill toggling ──────────────────────────────────────────────────────────
  function toggleSkill(skill: SkillName) {
    if (!cls || lockedSkills.has(skill)) return
    setS(prev => ({ ...prev, chosenSkills: toggleIn(classSkills, skill, cls.skillCount) }))
  }

  // ── Create character ────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!cls || !race || (!bg && !customBg)) return
    setCreating(true)
    setError(null)

    const scores = finalScores as Record<AbilityName, number>
    const conMod = mod(scores.constitution)
    const dexMod = mod(scores.dexterity)
    const spAbility = cls.spellcastingAbility
    const pb = proficiencyBonusForLevel(1)
    const hpMax = cls.hitDie + conMod + (subrace?.hitPointsPerLevel ?? 0)

    const allProficientSkills = new Set([...lockedSkills, ...classSkills])
    const cantrips = [s.cantrip, ...(race.cantrips ?? [])].filter(Boolean)
    const ancestry = race.ancestries?.find(a => a.dragon === s.ancestry)
    const ancestryText = ancestry ? ancestryDescription(ancestry) : null

    const skills: SkillEntry[] = (Object.keys(SKILL_ABILITY) as SkillName[]).map(skill => ({
      name: skill,
      ability: SKILL_ABILITY[skill],
      proficiency: allProficientSkills.has(skill) ? 'proficient' : 'none',
    }))

    const character: Omit<Character, 'id'> = syncFeatures({
      schemaVersion: CHARACTER_SCHEMA_VERSION,
      name: s.name.trim(),
      race: raceName,
      className: s.className,
      level: 1,
      subclass: s.subclass.trim() || null,
      background: bg ? bg.name : s.customBackgroundName.trim(),
      alignment: s.alignment,
      experiencePoints: 0,
      scores: {
        strength: scores.strength,
        dexterity: scores.dexterity,
        constitution: scores.constitution,
        intelligence: scores.intelligence,
        wisdom: scores.wisdom,
        charisma: scores.charisma,
      },
      hp: { current: hpMax, max: hpMax, temp: 0 },
      ac: armorClass({ className: s.className, scores, items: [] }),
      initiativeBonus: dexMod,
      speed: race.speed,
      proficiencyBonus: pb,
      savingThrowProficiencies: cls.savingThrows,
      skills,
      hitDice: { die: `d${cls.hitDie}`, total: 1, used: 0 },
      deathSaves: { successes: 0, failures: 0 },
      inspiration: false,
      conditions: [],
      spellcastingAbility: spAbility ?? null,
      spellSaveDC: spAbility ? spellSaveDC(scores[spAbility], pb) : null,
      spellAttackBonus: spAbility ? spellAttackBonus(scores[spAbility], pb) : null,
      knownSpells: SPELL_CATALOG.filter(sp => cantrips.includes(sp.name)).map(sp => sp.id),
      preparedSpells: [],
      spellSlotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      concentration: null,
      combat: null,
      features: bg
        ? [
            {
              name: bg.feature.name,
              source: bg.name,
              description: bg.feature.summary,
              usesMax: null,
              usesCurrent: null,
              recharge: null,
            },
          ]
        : [],
      currency: { cp: 0, sp: 0, ep: 0, gp: bg?.gold ?? 0, pp: 0 },
      languages: [...race.languages, ...s.languages],
      otherProficiencies: [...(race.weapons ?? []), ...(subrace?.weapons ?? [])],
      items: startingItems(bg?.equipment ?? []).map(item => ({ ...item, id: crypto.randomUUID() })),
      personality: {
        traits: s.personalityTraits.trim(),
        ideals: s.ideals.trim(),
        bonds: s.bonds.trim(),
        flaws: s.flaws.trim(),
      },
      backstory: '',
      notes: '',
    })
    // Racial traits whose text depends on a choice made here
    character.features = character.features.map(f => {
      if (f.name === 'Cantrip' && s.cantrip) return { ...f, description: `${f.description} ${s.cantrip}.` }
      if (f.name === 'Draconic Ancestry' && ancestryText) return { ...f, description: ancestryText.ancestry }
      if (f.name === 'Damage Resistance' && ancestryText) return { ...f, description: ancestryText.resistance }
      return f
    })

    try {
      const created = await createCharacter(character)
      onCreated(created)
    } catch (e) {
      setError(String(e))
      setCreating(false)
    }
  }

  // ── Shared UI helpers ───────────────────────────────────────────────────────

  const choice = (selected: boolean, disabled = false) =>
    [
      'fs-focus rounded-lg border text-sm text-left transition-colors min-h-11',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      selected
        ? 'bg-fs-accent/15 border-fs-brass text-fs-ink'
        : 'bg-fs-tile border-fs-card-line text-fs-ink hover:border-fs-brass',
    ].join(' ')

  const section = (label: string, children: React.ReactNode, hint?: string) => (
    <section className="flex flex-col gap-2.5">
      <h3 className="fs-section-label m-0 font-normal">{label}</h3>
      {hint && <p className="text-xs text-fs-ink-muted m-0 -mt-1">{hint}</p>}
      {children}
    </section>
  )

  // ── Step renderers ─────────────────────────────────────────────────────────

  function renderHeritage() {
    return (
      <div className="flex flex-col gap-6">
        {section(
          t('builder.characterName'),
          <input
            value={s.name}
            onChange={e => setS(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('builder.namePlaceholder')}
            aria-label={t('builder.characterName')}
            autoFocus
            className="fs-focus w-full min-h-12 px-4 font-display text-xl text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg placeholder:text-fs-ink-muted placeholder:font-ui placeholder:text-base"
          />,
        )}
        {section(
          t('builder.race'),
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RACE_CATALOG.map(r => (
              <button
                key={r.name}
                onClick={() => setRace(r.name)}
                aria-pressed={s.race === r.name}
                className={`${choice(s.race === r.name)} px-3 py-2.5 flex items-center gap-2.5`}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {RACE_SYMBOLS[r.name] ?? '◇'}
                </span>
                <span className="flex-1">
                  <span className="block">{gameLabel(t, 'race', r.name)}</span>
                  <span className="block text-xs text-fs-ink-muted">
                    {Object.entries(r.abilityBonuses)
                      .map(([a, b]) => `${abilityShort(a as AbilityName)} +${b}`)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            ))}
          </div>,
        )}
        {race?.subrace &&
          section(
            t('builder.subrace'),
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setS(prev => ({ ...prev, noSubrace: false, cantrip: '', languages: [] }))}
                aria-pressed={!s.noSubrace}
                className={`${choice(!s.noSubrace)} px-3 py-2.5`}
              >
                <span className="block font-display">{gameLabel(t, 'race', race.subrace.name)}</span>
                <span className="block text-xs text-fs-ink-muted">
                  {Object.entries(race.subrace.abilityBonuses)
                    .map(([a, b]) => `${abilityShort(a as AbilityName)} +${b}`)
                    .join(' · ')}
                </span>
              </button>
              <button
                onClick={() => setS(prev => ({ ...prev, noSubrace: true, cantrip: '', languages: [] }))}
                aria-pressed={s.noSubrace}
                className={`${choice(s.noSubrace)} px-3 py-2.5`}
              >
                <span className="block font-display">{t('builder.otherSubrace')}</span>
                <span className="block text-xs text-fs-ink-muted">{t('builder.otherSubraceHint')}</span>
              </button>
            </div>,
          )}
        {race?.ancestries &&
          section(
            t('builder.ancestry'),
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {race.ancestries.map(a => (
                <button
                  key={a.dragon}
                  onClick={() => setS(prev => ({ ...prev, ancestry: a.dragon }))}
                  aria-pressed={s.ancestry === a.dragon}
                  className={`${choice(s.ancestry === a.dragon)} px-2 py-2 text-center`}
                >
                  <span className="block text-sm">{t(`builder.dragon.${a.dragon}`)}</span>
                  <span className="block text-xs text-fs-ink-muted">{gameLabel(t, 'damageType', a.damageType)}</span>
                </button>
              ))}
            </div>,
          )}
        {cantripOptions.length > 0 &&
          section(
            t('builder.cantrip'),
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {cantripOptions.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => setS(prev => ({ ...prev, cantrip: sp.name }))}
                  aria-pressed={s.cantrip === sp.name}
                  title={sp.description}
                  className={`${choice(s.cantrip === sp.name)} px-3 py-2 text-sm`}
                >
                  {sp.name}
                </button>
              ))}
            </div>,
            t('builder.cantripHint'),
          )}
        {section(
          t('builder.alignment'),
          <div className="grid grid-cols-3 gap-1.5">
            {ALIGNMENTS.map(a => (
              <button
                key={a}
                onClick={() => setS(prev => ({ ...prev, alignment: a }))}
                aria-pressed={s.alignment === a}
                className={`${choice(s.alignment === a)} px-2 py-2 text-center text-xs sm:text-sm`}
              >
                {gameLabel(t, 'alignment', a)}
              </button>
            ))}
          </div>,
        )}
      </div>
    )
  }

  function renderCalling() {
    return (
      <div className="flex flex-col gap-6">
        {section(
          t('builder.chooseClass'),
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CLASSES.map(c => (
              <button
                key={c.name}
                onClick={() => setClass(c.name)}
                aria-pressed={s.className === c.name}
                className={`${choice(s.className === c.name)} px-3 py-3 flex items-center gap-3`}
              >
                <span className="text-2xl leading-none text-fs-brass" aria-hidden="true">
                  {c.symbol}
                </span>
                <span className="flex-1">
                  <span className="block font-display">{gameLabel(t, 'class', c.name)}</span>
                  <span className="block text-xs text-fs-ink-muted">
                    {t('dice.die')}
                    {c.hitDie}
                    {c.spellcastingAbility && ` · ${t('builder.caster')}`}
                  </span>
                </span>
              </button>
            ))}
          </div>,
        )}
        {srdClass?.subclassLevel === 1 &&
          section(
            t('levelUp.subclass'),
            <SubclassPicker
              srdName={srdClass.subclass.name}
              value={s.subclass}
              onChange={subclass => setS(prev => ({ ...prev, subclass }))}
            />,
            t('levelUp.subclassHint'),
          )}
        {cls && (
          <p className="text-sm text-fs-ink-muted m-0">
            {t('builder.savingThrows')}{' '}
            <span className="text-fs-ink">{cls.savingThrows.map(abilityShort).join(', ')}</span>
            {cls.spellcastingAbility && (
              <>
                {' · '}
                {t('builder.spellcasting')} <span className="text-fs-ink">{abilityShort(cls.spellcastingAbility)}</span>
              </>
            )}
          </p>
        )}
      </div>
    )
  }

  function renderGifts() {
    return (
      <div className="flex flex-col gap-6">
        {section(
          t('builder.standardArray'),
          <div className="flex gap-2 flex-wrap">
            {STANDARD_ARRAY.map(score => {
              const isUsed = usedScores.includes(score)
              const isSel = s.selectedScore === score
              return (
                <button
                  key={score}
                  disabled={isUsed}
                  onClick={() => handleScoreChipClick(score)}
                  aria-pressed={isSel}
                  className={[
                    'fs-focus size-12 rounded-lg border font-display text-xl transition-all',
                    isUsed
                      ? 'opacity-25 cursor-not-allowed border-fs-card-line bg-transparent text-fs-ink-muted'
                      : isSel
                        ? 'bg-fs-accent text-fs-on-accent border-transparent scale-110 cursor-pointer'
                        : 'bg-fs-tile border-fs-card-line text-fs-ink hover:border-fs-brass cursor-pointer',
                  ].join(' ')}
                >
                  {score}
                </button>
              )
            })}
          </div>,
          t('builder.standardArrayHint'),
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ABILITY_NAMES.map(ability => {
            const base = s.assignedScores[ability]
            const bonus = bonusFor(ability)
            const final = (base ?? 0) + bonus
            const hasBase = base !== undefined
            return (
              <button
                key={ability}
                onClick={() => handleAbilityClick(ability)}
                className={`${choice(hasBase || s.selectedScore !== null, !hasBase && s.selectedScore === null)} p-3 text-center`}
              >
                <span className="block text-xs text-fs-ink-muted">{gameLabel(t, 'ability', ability)}</span>
                <span className="block font-display text-3xl leading-tight">{hasBase ? final : '—'}</span>
                <span className="block text-xs text-fs-ink-muted">
                  {hasBase ? fmtMod(mod(final)) : ' '}
                  {bonus > 0 && (
                    <span className="text-fs-brass">
                      {' '}
                      ({base ?? '–'} +{bonus})
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        {race?.abilityChoices &&
          section(
            t('builder.abilityChoices', { count: race.abilityChoices, race: gameLabel(t, 'race', race.name) }),
            <div className="grid grid-cols-3 gap-1.5">
              {ABILITY_NAMES.filter(a => !(a in race.abilityBonuses)).map(a => {
                const picked = s.raceAbilityPicks.includes(a)
                const full = !picked && s.raceAbilityPicks.length >= race.abilityChoices!
                return (
                  <button
                    key={a}
                    disabled={full}
                    aria-pressed={picked}
                    onClick={() =>
                      setS(prev => ({
                        ...prev,
                        raceAbilityPicks: toggleIn(prev.raceAbilityPicks, a, race.abilityChoices!),
                      }))
                    }
                    className={`${choice(picked, full)} px-2 py-2 text-center`}
                  >
                    {gameLabel(t, 'ability', a)} {picked && <span className="text-fs-brass">+1</span>}
                  </button>
                )
              })}
            </div>,
          )}
      </div>
    )
  }

  function skillChips(options: SkillName[], selected: SkillName[], max: number, onToggle: (sk: SkillName) => void) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {options.map(skill => {
          const chosen = selected.includes(skill)
          const maxed = selected.length >= max && !chosen
          return (
            <button
              key={skill}
              onClick={() => onToggle(skill)}
              disabled={maxed}
              aria-pressed={chosen}
              className={`${choice(chosen, maxed)} px-3 py-2 flex items-center gap-2.5`}
            >
              <span className={chosen ? 'text-fs-brass' : 'text-fs-card-line'} aria-hidden="true">
                ◆
              </span>
              <span className="flex-1">{skillLabel(skill)}</span>
              <span className="text-xs text-fs-ink-muted">{abilityShort(SKILL_ABILITY[skill])}</span>
            </button>
          )
        })}
      </div>
    )
  }

  function renderPath() {
    const availableClassSkills = (cls?.skillPool ?? []).filter(sk => !lockedSkills.has(sk))
    const grants = [...bgSkills, ...fixedRaceSkills]
    const baseLanguages = race?.languages ?? []

    return (
      <div className="flex flex-col gap-6">
        {section(
          t('builder.background'),
          <div className="grid grid-cols-2 gap-2">
            {BACKGROUND_CATALOG.map(b => (
              <button
                key={b.name}
                onClick={() => setBackground(b.name)}
                aria-pressed={s.background === b.name}
                className={`${choice(s.background === b.name)} px-3 py-2.5`}
              >
                <span className="block font-display">{gameLabel(t, 'background', b.name)}</span>
                <span className="block text-xs text-fs-ink-muted">{b.skills.map(skillLabel).join(' · ')}</span>
              </button>
            ))}
            <button
              onClick={() => setBackground(CUSTOM_BACKGROUND)}
              aria-pressed={customBg}
              className={`${choice(customBg)} px-3 py-2.5`}
            >
              <span className="block font-display">{t('builder.customBackground')}</span>
              <span className="block text-xs text-fs-ink-muted">{t('builder.customBackgroundHint')}</span>
            </button>
          </div>,
          bg ? t('builder.backgroundGives', { gold: bg.gold, items: bg.equipment.length }) : undefined,
        )}
        {customBg && (
          <>
            <input
              value={s.customBackgroundName}
              onChange={e => setS(prev => ({ ...prev, customBackgroundName: e.target.value }))}
              placeholder={t('builder.customBackgroundName')}
              aria-label={t('builder.customBackgroundName')}
              className="fs-focus w-full min-h-11 px-3 text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg placeholder:text-fs-ink-muted -mt-3"
            />
            {section(
              `${t('builder.backgroundSkills')} ${t('builder.chosen', { count: s.customSkills.length, total: CUSTOM_BACKGROUND_SKILLS })}`,
              skillChips(
                ALL_SKILLS.filter(sk => !fixedRaceSkills.includes(sk) && !s.raceSkills.includes(sk)),
                s.customSkills,
                CUSTOM_BACKGROUND_SKILLS,
                sk =>
                  setS(prev => ({ ...prev, customSkills: toggleIn(prev.customSkills, sk, CUSTOM_BACKGROUND_SKILLS) })),
              ),
            )}
          </>
        )}
        {race &&
          raceSkillCount > 0 &&
          section(
            `${t('builder.raceSkills', { race: gameLabel(t, 'race', race.name) })} ${t('builder.chosen', { count: s.raceSkills.length, total: raceSkillCount })}`,
            skillChips(
              ALL_SKILLS.filter(sk => !bgSkills.includes(sk) && !fixedRaceSkills.includes(sk)),
              s.raceSkills,
              raceSkillCount,
              sk => setS(prev => ({ ...prev, raceSkills: toggleIn(prev.raceSkills, sk, raceSkillCount) })),
            ),
          )}
        {cls &&
          section(
            `${t('builder.classSkills')} ${t('builder.chosen', { count: classSkills.length, total: cls.skillCount })}`,
            skillChips(availableClassSkills, classSkills, cls.skillCount, toggleSkill),
            grants.length > 0
              ? t('builder.backgroundGrants', { skills: grants.map(skillLabel).join(', ') })
              : undefined,
          )}
        {languageCount > 0 &&
          section(
            `${t('builder.languages')} ${t('builder.chosen', { count: s.languages.length, total: languageCount })}`,
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.filter(l => !baseLanguages.includes(l)).map(l => {
                const picked = s.languages.includes(l)
                const full = !picked && s.languages.length >= languageCount
                return (
                  <button
                    key={l}
                    disabled={full}
                    aria-pressed={picked}
                    onClick={() => setS(prev => ({ ...prev, languages: toggleIn(prev.languages, l, languageCount) }))}
                    className={`${choice(picked, full)} px-3 py-1.5 min-h-9`}
                  >
                    {gameLabel(t, 'language', l)}
                  </button>
                )
              })}
            </div>,
            t('builder.languagesHint', { languages: baseLanguages.map(l => gameLabel(t, 'language', l)).join(', ') }),
          )}
      </div>
    )
  }

  function renderDestiny() {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="fs-section-label m-0 font-normal">
          {t('builder.personality')} {t('builder.optional')}
        </h3>
        {(
          [
            ['personalityTraits', t('builder.personalityTraits')],
            ['ideals', t('builder.ideals')],
            ['bonds', t('builder.bonds')],
            ['flaws', t('builder.flaws')],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-xs text-fs-ink-muted">{label}</span>
            <textarea
              value={s[key]}
              onChange={e => setS(prev => ({ ...prev, [key]: e.target.value }))}
              rows={2}
              placeholder={t('builder.enterField', { field: label })}
              className="fs-focus w-full px-3 py-2 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg resize-none placeholder:text-fs-ink-muted"
            />
          </label>
        ))}
        {error && <p className="text-sm text-fs-danger m-0">{error}</p>}
      </div>
    )
  }

  const steps = [renderHeritage, renderCalling, renderGifts, renderPath, renderDestiny]
  const isLast = step === STEP_LABELS.length - 1

  return (
    <div className="w-full h-full flex flex-col gap-3 bg-fs-bg p-3 font-ui overflow-hidden animate-fade-in">
      {/* Steps */}
      <header className="flex items-center gap-3 bg-fs-bar border border-fs-bar-line rounded-fs px-3 py-2.5">
        <Button onBar variant="ghost" size="sm" onClick={onCancel}>
          ✕ <span className="hidden sm:inline">{t('builder.cancel')}</span>
        </Button>
        <ol className="flex-1 flex items-center justify-center gap-1 sm:gap-3 m-0 p-0 list-none">
          {STEP_LABELS.map((label, i) => (
            <li key={i} className="flex items-center gap-1 sm:gap-3">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
                className="fs-focus flex items-center gap-2 bg-transparent border-none p-1 rounded-md cursor-pointer disabled:cursor-default"
              >
                <span
                  className={[
                    'size-3 rotate-45 border-[1.5px]',
                    i < step ? 'bg-fs-accent border-fs-accent' : i === step ? 'border-fs-accent' : 'border-fs-bar-line',
                  ].join(' ')}
                />
                <span
                  className={`hidden md:inline font-display text-sm ${i === step ? 'text-fs-bar-text' : 'text-fs-bar-muted'}`}
                >
                  {label}
                </span>
              </button>
              {i < STEP_LABELS.length - 1 && <span className="w-4 sm:w-8 h-px bg-fs-bar-line" />}
            </li>
          ))}
        </ol>
        <span className="hidden sm:block w-24" />
      </header>

      <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        {/* Current step */}
        <section className="min-h-0 flex flex-col bg-fs-card text-fs-ink border border-fs-card-line rounded-fs">
          <div className="px-6 pt-5 pb-3 border-b border-fs-card-line">
            <div className="text-xs text-fs-ink-muted">
              {t('builder.stepOf', { current: step + 1, total: STEP_LABELS.length })}
            </div>
            <h2 className="font-display text-2xl font-medium m-0">{STEP_LABELS[step]}</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll px-6 py-5">{steps[step]()}</div>
          <div className="px-6 py-3 border-t border-fs-card-line flex items-center justify-between gap-2">
            <Button onClick={step === 0 ? onCancel : () => setStep(n => n - 1)}>
              {step === 0 ? t('builder.cancel') : t('builder.back')}
            </Button>
            {isLast ? (
              <Button variant="primary" onClick={handleCreate} disabled={creating || !valid.every(Boolean)}>
                {creating ? t('builder.creating') : t('builder.create')}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setStep(n => n + 1)} disabled={!valid[step]}>
                {t('builder.continue')}
              </Button>
            )}
          </div>
        </section>

        {/* Live preview */}
        <aside className="hidden lg:flex min-h-0 flex-col gap-3 overflow-y-auto parchment-scroll">
          <div className="bg-fs-card text-fs-ink border border-fs-card-line rounded-fs px-5 py-5 flex flex-col items-center text-center gap-1">
            <span className="size-16 rounded-full border-2 border-fs-brass text-fs-brass font-display text-3xl flex items-center justify-center">
              {s.name.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="font-display text-xl mt-2">{s.name.trim() || t('builder.previewName')}</span>
            <span className="text-sm text-fs-ink-muted">
              {[
                raceName && gameLabel(t, 'race', raceName),
                s.className && gameLabel(t, 'class', s.className),
                bg ? gameLabel(t, 'background', bg.name) : customBg && s.customBackgroundName.trim(),
              ]
                .filter(Boolean)
                .join(' · ') || t('builder.previewHint')}
            </span>
            {s.alignment && <span className="text-xs text-fs-ink-muted">{gameLabel(t, 'alignment', s.alignment)}</span>}
          </div>

          <div className="bg-fs-card text-fs-ink border border-fs-card-line rounded-fs px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              {ABILITY_NAMES.map(a => {
                const has = s.assignedScores[a] !== undefined
                return (
                  <div key={a} className="bg-fs-tile border border-fs-card-line rounded-lg py-2 text-center">
                    <div className="text-xs text-fs-ink-muted">{abilityShort(a)}</div>
                    <div className="font-display text-xl leading-tight">{has ? finalScores[a] : '—'}</div>
                    <div className="text-xs text-fs-ink-muted">{has ? fmtMod(mod(finalScores[a])) : ' '}</div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[
                [
                  t('builder.hp'),
                  cls && allAssigned
                    ? cls.hitDie + mod(finalScores.constitution) + (subrace?.hitPointsPerLevel ?? 0)
                    : '—',
                ],
                [
                  t('builder.ac'),
                  cls && allAssigned ? armorClass({ className: cls.name, scores: finalScores, items: [] }) : '—',
                ],
                [t('builder.speed'), race ? t('builder.feet', { value: race.speed }) : '—'],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="font-display text-lg">{value}</div>
                  <div className="text-xs text-fs-ink-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {lockedSkills.size + classSkills.length > 0 && (
            <div className="bg-fs-card text-fs-ink border border-fs-card-line rounded-fs px-5 py-4">
              <h3 className="fs-section-label m-0 mb-2 font-normal">{t('sheet.skills')}</h3>
              <p className="text-sm m-0">{[...lockedSkills, ...classSkills].map(skillLabel).join(' · ')}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
