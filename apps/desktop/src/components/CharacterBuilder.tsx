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
import { findClass, syncClassFeatures } from '@fablesheet/srd-data'
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

interface RaceInfo {
  name: string
  symbol: string
  speed: number
  abilityBonuses: Partial<Record<AbilityName, number>>
  languages: string[]
}

const RACES: RaceInfo[] = [
  {
    name: 'Human',
    symbol: '◈',
    speed: 30,
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    languages: ['Common'],
  },
  { name: 'Elf', symbol: '🌙', speed: 30, abilityBonuses: { dexterity: 2 }, languages: ['Common', 'Elvish'] },
  { name: 'Dwarf', symbol: '⛏', speed: 25, abilityBonuses: { constitution: 2 }, languages: ['Common', 'Dwarvish'] },
  { name: 'Halfling', symbol: '🍀', speed: 25, abilityBonuses: { dexterity: 2 }, languages: ['Common', 'Halfling'] },
  { name: 'Gnome', symbol: '⚙', speed: 25, abilityBonuses: { intelligence: 2 }, languages: ['Common', 'Gnomish'] },
  { name: 'Half-Elf', symbol: '🌿', speed: 30, abilityBonuses: { charisma: 2 }, languages: ['Common', 'Elvish'] },
  {
    name: 'Half-Orc',
    symbol: '⚡',
    speed: 30,
    abilityBonuses: { strength: 2, constitution: 1 },
    languages: ['Common', 'Orc'],
  },
  {
    name: 'Tiefling',
    symbol: '🔥',
    speed: 30,
    abilityBonuses: { intelligence: 1, charisma: 2 },
    languages: ['Common', 'Infernal'],
  },
  {
    name: 'Dragonborn',
    symbol: '🐉',
    speed: 30,
    abilityBonuses: { strength: 2, charisma: 1 },
    languages: ['Common', 'Draconic'],
  },
]

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

interface BackgroundInfo {
  name: string
  skills: SkillName[]
}

const BACKGROUNDS: BackgroundInfo[] = [
  { name: 'Acolyte', skills: ['insight', 'religion'] },
  { name: 'Criminal', skills: ['deception', 'stealth'] },
  { name: 'Sage', skills: ['arcana', 'history'] },
  { name: 'Soldier', skills: ['athletics', 'intimidation'] },
]

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

  const race = RACES.find(r => r.name === s.race)
  const cls = CLASSES.find(c => c.name === s.className)
  const srdClass = findClass(s.className)
  const bg = BACKGROUNDS.find(b => b.name === s.background)

  // Computed final ability scores (base + race bonus)
  const finalScores = ABILITY_NAMES.reduce(
    (acc, a) => {
      const base = s.assignedScores[a] ?? 0
      const bonus = race?.abilityBonuses[a] ?? 0
      acc[a] = base + bonus
      return acc
    },
    {} as Record<AbilityName, number>,
  )

  const usedScores = Object.values(s.assignedScores) as number[]
  const availableScores = STANDARD_ARRAY.filter(v => !usedScores.includes(v))
  const allAssigned = availableScores.length === 0

  // Step validity
  const valid = [
    s.name.trim().length > 0 && !!s.race && !!s.alignment,
    !!s.className,
    allAssigned,
    !!s.background && s.chosenSkills.length === (cls?.skillCount ?? 0),
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

  // ── Background change: clear skill choices ──────────────────────────────────
  function setBackground(name: string) {
    setS(prev => ({ ...prev, background: name, chosenSkills: [] }))
  }

  // ── Skill toggling ──────────────────────────────────────────────────────────
  function toggleSkill(skill: SkillName) {
    if (!cls) return
    const bgSkills = bg?.skills ?? []
    if (bgSkills.includes(skill)) return // locked by background

    setS(prev => {
      const has = prev.chosenSkills.includes(skill)
      if (has) return { ...prev, chosenSkills: prev.chosenSkills.filter(sk => sk !== skill) }
      if (prev.chosenSkills.length >= (cls.skillCount ?? 0)) return prev
      return { ...prev, chosenSkills: [...prev.chosenSkills, skill] }
    })
  }

  // ── Create character ────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!cls || !race || !bg) return
    setCreating(true)
    setError(null)

    const scores = finalScores as Record<AbilityName, number>
    const conMod = mod(scores.constitution)
    const dexMod = mod(scores.dexterity)
    const spAbility = cls.spellcastingAbility
    const pb = proficiencyBonusForLevel(1)
    const hpMax = cls.hitDie + conMod

    const allProficientSkills = new Set([...bg.skills, ...s.chosenSkills])

    const skills: SkillEntry[] = (Object.keys(SKILL_ABILITY) as SkillName[]).map(skill => ({
      name: skill,
      ability: SKILL_ABILITY[skill],
      proficiency: allProficientSkills.has(skill) ? 'proficient' : 'none',
    }))

    const character: Omit<Character, 'id'> = syncClassFeatures({
      schemaVersion: CHARACTER_SCHEMA_VERSION,
      name: s.name.trim(),
      race: s.race,
      className: s.className,
      level: 1,
      subclass: s.subclass.trim() || null,
      background: s.background,
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
      knownSpells: [],
      preparedSpells: [],
      spellSlotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      features: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      languages: [...race.languages],
      otherProficiencies: [],
      items: [],
      personality: {
        traits: s.personalityTraits.trim(),
        ideals: s.ideals.trim(),
        bonds: s.bonds.trim(),
        flaws: s.flaws.trim(),
      },
      backstory: '',
      notes: '',
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
            {RACES.map(r => (
              <button
                key={r.name}
                onClick={() => setS(prev => ({ ...prev, race: r.name }))}
                aria-pressed={s.race === r.name}
                className={`${choice(s.race === r.name)} px-3 py-2.5 flex items-center gap-2.5`}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {r.symbol}
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
            const bonus = race?.abilityBonuses[ability] ?? 0
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
      </div>
    )
  }

  function renderPath() {
    const bgSkills = bg?.skills ?? []
    const availableClassSkills = (cls?.skillPool ?? []).filter(sk => !bgSkills.includes(sk))

    return (
      <div className="flex flex-col gap-6">
        {section(
          t('builder.background'),
          <div className="grid grid-cols-2 gap-2">
            {BACKGROUNDS.map(b => (
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
          </div>,
        )}
        {cls &&
          section(
            `${t('builder.classSkills')} ${t('builder.chosen', { count: s.chosenSkills.length, total: cls.skillCount })}`,
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {availableClassSkills.map(skill => {
                const chosen = s.chosenSkills.includes(skill)
                const maxed = s.chosenSkills.length >= cls.skillCount && !chosen
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
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
            </div>,
            bg && bgSkills.length > 0
              ? t('builder.backgroundGrants', { skills: bgSkills.map(skillLabel).join(', ') })
              : undefined,
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
                s.race && gameLabel(t, 'race', s.race),
                s.className && gameLabel(t, 'class', s.className),
                s.background && gameLabel(t, 'background', s.background),
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
                [t('builder.hp'), cls && allAssigned ? cls.hitDie + mod(finalScores.constitution) : '—'],
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

          {(bg || s.chosenSkills.length > 0) && (
            <div className="bg-fs-card text-fs-ink border border-fs-card-line rounded-fs px-5 py-4">
              <h3 className="fs-section-label m-0 mb-2 font-normal">{t('sheet.skills')}</h3>
              <p className="text-sm m-0">{[...(bg?.skills ?? []), ...s.chosenSkills].map(skillLabel).join(' · ')}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
