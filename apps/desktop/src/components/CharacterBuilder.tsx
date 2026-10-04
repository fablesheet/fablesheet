import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, AbilityName, SkillName, SkillEntry } from '@fablesheet/core'
import {
  abilityModifier as mod,
  formatModifier as fmtMod,
  CHARACTER_SCHEMA_VERSION,
  proficiencyBonusForLevel,
  spellAttackBonus,
  spellSaveDC,
} from '@fablesheet/core'
import { createCharacter } from '../services/api'
import { gameLabel } from '../i18n/game'

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
    setS(prev => ({ ...prev, className: name, chosenSkills: [] }))
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

    const character: Omit<Character, 'id'> = {
      schemaVersion: CHARACTER_SCHEMA_VERSION,
      name: s.name.trim(),
      race: s.race,
      className: s.className,
      level: 1,
      subclass: null,
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
      ac: 10 + dexMod,
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
      features: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      languages: [...race.languages],
      otherProficiencies: [],
      items: [],
    }

    try {
      const created = await createCharacter(character)
      onCreated(created)
    } catch (e) {
      setError(String(e))
      setCreating(false)
    }
  }

  // ── Shared UI helpers ───────────────────────────────────────────────────────
  const divider = (
    <div
      className="h-px my-3 mx-2"
      style={{ background: 'linear-gradient(to right, transparent, rgba(100,70,20,0.35), transparent)' }}
    />
  )

  // ── Step renderers ─────────────────────────────────────────────────────────

  function renderHeritage() {
    return (
      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase block mb-1.5">
            {t('builder.characterName')}
          </label>
          <input
            value={s.name}
            onChange={e => setS(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('builder.namePlaceholder')}
            className="w-full px-3 py-2 bg-[rgba(255,240,180,0.4)] border border-[rgba(100,70,20,0.3)] rounded-sm font-fell text-body text-ink placeholder:text-[#a08050] outline-none focus:border-[rgba(100,70,20,0.6)] focus:bg-[rgba(255,240,180,0.6)] transition-colors"
          />
        </div>

        {divider}

        {/* Race */}
        <div>
          <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase mb-2">
            {t('builder.race')}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {RACES.map(r => (
              <button
                key={r.name}
                onClick={() => setS(prev => ({ ...prev, race: r.name }))}
                className={[
                  'px-2 py-2 rounded-sm font-fell-sc text-caption text-center transition-all duration-150 border',
                  s.race === r.name
                    ? 'bg-[rgba(100,70,20,0.25)] border-[rgba(100,70,20,0.6)] text-ink shadow-inner'
                    : 'bg-[rgba(255,240,180,0.25)] border-[rgba(100,70,20,0.2)] text-[#5a3010] hover:bg-[rgba(100,70,20,0.12)] hover:border-[rgba(100,70,20,0.4)]',
                ].join(' ')}
              >
                <div className="text-[1.2rem] mb-0.5 leading-none">{r.symbol}</div>
                <div>{gameLabel(t, 'race', r.name)}</div>
                {r.speed === 25 && (
                  <div className="font-cinzel text-deco text-[#8a6838] mt-0.5">{t('builder.feet', { value: 25 })}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {divider}

        {/* Alignment */}
        <div>
          <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase mb-2">
            {t('builder.alignment')}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ALIGNMENTS.map(a => (
              <button
                key={a}
                onClick={() => setS(prev => ({ ...prev, alignment: a }))}
                className={[
                  'px-2 py-1.5 rounded-sm font-fell-sc text-caption text-center transition-all duration-150 border',
                  s.alignment === a
                    ? 'bg-[rgba(100,70,20,0.25)] border-[rgba(100,70,20,0.6)] text-ink'
                    : 'bg-[rgba(255,240,180,0.25)] border-[rgba(100,70,20,0.2)] text-[#5a3010] hover:bg-[rgba(100,70,20,0.12)] hover:border-[rgba(100,70,20,0.4)]',
                ].join(' ')}
              >
                {gameLabel(t, 'alignment', a)}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderCalling() {
    return (
      <div>
        <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase mb-3">
          {t('builder.chooseClass')}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {CLASSES.map(c => (
            <button
              key={c.name}
              onClick={() => setClass(c.name)}
              className={[
                'flex flex-col items-center px-2 py-2.5 rounded-sm border text-center transition-all duration-150',
                s.className === c.name
                  ? 'bg-[rgba(100,70,20,0.25)] border-[rgba(100,70,20,0.6)] text-ink'
                  : 'bg-[rgba(255,240,180,0.25)] border-[rgba(100,70,20,0.2)] text-[#5a3010] hover:bg-[rgba(100,70,20,0.12)] hover:border-[rgba(100,70,20,0.4)]',
              ].join(' ')}
            >
              <div className="text-[1.4rem] leading-none mb-1">{c.symbol}</div>
              <div className="font-fell-sc text-caption">{gameLabel(t, 'class', c.name)}</div>
              <div className="font-cinzel text-deco text-[#8a6838] mt-0.5">d{c.hitDie}</div>
              {c.spellcastingAbility && (
                <div className="font-cinzel text-deco text-gold-dim mt-0.5">{t('builder.caster')}</div>
              )}
            </button>
          ))}
        </div>

        {cls && (
          <>
            {divider}
            <div className="font-fell text-body text-[#4a2e08] leading-relaxed">
              <span className="font-fell-sc">{t('builder.savingThrows')}</span>{' '}
              {cls.savingThrows.map(abilityShort).join(', ')}
              {cls.spellcastingAbility && (
                <span className="ml-3 font-fell-sc">
                  {t('builder.spellcasting')}{' '}
                  <span className="text-gold-dim">{abilityShort(cls.spellcastingAbility)}</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  function renderGifts() {
    return (
      <div>
        <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase mb-1">
          {t('builder.standardArray')}
        </div>
        <div className="font-fell text-caption text-[#6b4a20] mb-3 italic">{t('builder.standardArrayHint')}</div>

        {/* Score chips */}
        <div className="flex gap-2 flex-wrap mb-4">
          {STANDARD_ARRAY.map(score => {
            const isUsed = usedScores.includes(score)
            const isSel = s.selectedScore === score
            return (
              <button
                key={score}
                disabled={isUsed}
                onClick={() => handleScoreChipClick(score)}
                className={[
                  'w-10 h-10 rounded-sm border font-fell-sc text-subhead font-bold transition-all duration-150',
                  isUsed
                    ? 'opacity-20 cursor-not-allowed border-[rgba(100,70,20,0.15)] bg-transparent text-[#5a3010]'
                    : isSel
                      ? 'bg-[rgba(100,70,20,0.4)] border-[rgba(100,70,20,0.8)] text-ink ring-1 ring-[rgba(200,168,75,0.5)] scale-110'
                      : 'bg-[rgba(255,240,180,0.4)] border-[rgba(100,70,20,0.3)] text-[#5a3010] hover:bg-[rgba(100,70,20,0.15)] hover:border-[rgba(100,70,20,0.5)]',
                ].join(' ')}
              >
                {score}
              </button>
            )
          })}
        </div>

        {/* Ability rows */}
        <div className="flex flex-col gap-1.5">
          {ABILITY_NAMES.map(ability => {
            const base = s.assignedScores[ability]
            const bonus = race?.abilityBonuses[ability] ?? 0
            const final = (base ?? 0) + bonus
            const hasBase = base !== undefined

            return (
              <button
                key={ability}
                onClick={() => handleAbilityClick(ability)}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-sm border text-left transition-all duration-150',
                  s.selectedScore !== null
                    ? 'bg-[rgba(200,168,75,0.08)] border-[rgba(100,70,20,0.4)] hover:bg-[rgba(100,70,20,0.18)] cursor-pointer'
                    : hasBase
                      ? 'bg-[rgba(100,70,20,0.15)] border-[rgba(100,70,20,0.4)] hover:bg-[rgba(100,70,20,0.22)] cursor-pointer'
                      : 'bg-[rgba(255,240,180,0.15)] border-[rgba(100,70,20,0.15)] cursor-default',
                ].join(' ')}
              >
                <span className="font-cinzel text-caption tracking-widest text-[#8a6838] w-8">
                  {abilityShort(ability)}
                </span>
                <span className="font-fell-sc text-body text-ink w-[100px]">{gameLabel(t, 'ability', ability)}</span>

                <span className="font-fell-sc text-body text-red-ink w-6 text-center">{hasBase ? base : '—'}</span>

                {bonus > 0 && <span className="font-fell-sc text-caption text-gold-dim w-6">+{bonus}</span>}
                {bonus === 0 && <span className="w-6" />}

                <span className="font-fell-sc text-subhead text-ink font-bold w-6 text-center">
                  {hasBase ? final : '—'}
                </span>

                <span className="font-cinzel text-caption text-[#6b4a20] w-8 text-right">
                  {hasBase ? fmtMod(mod(final)) : ''}
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
    const classPool = cls?.skillPool ?? []
    const availableClassSkills = classPool.filter(sk => !bgSkills.includes(sk))

    return (
      <div className="flex flex-col gap-5">
        {/* Background */}
        <div>
          <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase mb-2">
            {t('builder.background')}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKGROUNDS.map(b => (
              <button
                key={b.name}
                onClick={() => setBackground(b.name)}
                className={[
                  'px-2 py-2 rounded-sm border font-fell-sc text-caption text-center transition-all duration-150',
                  s.background === b.name
                    ? 'bg-[rgba(100,70,20,0.25)] border-[rgba(100,70,20,0.6)] text-ink'
                    : 'bg-[rgba(255,240,180,0.25)] border-[rgba(100,70,20,0.2)] text-[#5a3010] hover:bg-[rgba(100,70,20,0.12)] hover:border-[rgba(100,70,20,0.4)]',
                ].join(' ')}
              >
                <div>{gameLabel(t, 'background', b.name)}</div>
                <div className="font-cinzel text-deco text-[#8a6838] mt-0.5">
                  {b.skills.map(skillLabel).join(' · ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {divider}

        {/* Skill choices */}
        {cls && (
          <div>
            <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase mb-1">
              {t('builder.classSkills')}
              <span className="ml-2 font-fell text-[#8a6838] normal-case">
                {t('builder.chosen', { count: s.chosenSkills.length, total: cls.skillCount })}
              </span>
            </div>

            {bg && bgSkills.length > 0 && (
              <div className="font-fell text-caption text-[#6b4a20] italic mb-2">
                {t('builder.backgroundGrants', { skills: bgSkills.map(skillLabel).join(', ') })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1">
              {availableClassSkills.map(skill => {
                const chosen = s.chosenSkills.includes(skill)
                const maxed = s.chosenSkills.length >= cls.skillCount && !chosen
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    disabled={maxed}
                    className={[
                      'flex items-center gap-2 px-2 py-1 rounded-sm border text-left font-fell-sc text-caption transition-all duration-150',
                      chosen
                        ? 'bg-[rgba(100,70,20,0.25)] border-[rgba(100,70,20,0.5)] text-ink'
                        : maxed
                          ? 'opacity-40 cursor-not-allowed bg-transparent border-[rgba(100,70,20,0.15)] text-[#6b4a20]'
                          : 'bg-[rgba(255,240,180,0.2)] border-[rgba(100,70,20,0.2)] text-[#5a3010] hover:bg-[rgba(100,70,20,0.12)] hover:border-[rgba(100,70,20,0.4)]',
                    ].join(' ')}
                  >
                    <span className="w-3 h-3 border border-[rgba(100,70,20,0.5)] rounded-sm flex items-center justify-center shrink-0">
                      {chosen && <span className="text-[8px] text-gold-dim leading-none">✦</span>}
                    </span>
                    {skillLabel(skill)}
                    <span className="text-[#8a6838] ml-auto">{abilityShort(SKILL_ABILITY[skill])}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderDestiny() {
    return (
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="bg-[rgba(100,70,20,0.08)] border border-[rgba(100,70,20,0.2)] rounded-sm px-4 py-3">
          <div className="font-cinzel-deco text-heading text-gold text-center mb-2">{s.name || '—'}</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-fell-sc text-caption text-ink">
            <div>
              <span className="text-[#8a6838]">{t('builder.summaryRace')}</span>{' '}
              {s.race ? gameLabel(t, 'race', s.race) : '—'}
            </div>
            <div>
              <span className="text-[#8a6838]">{t('builder.summaryClass')}</span>{' '}
              {s.className ? gameLabel(t, 'class', s.className) : '—'}
            </div>
            <div>
              <span className="text-[#8a6838]">{t('builder.summaryBackground')}</span>{' '}
              {s.background ? gameLabel(t, 'background', s.background) : '—'}
            </div>
            <div>
              <span className="text-[#8a6838]">{t('builder.summaryAlignment')}</span>{' '}
              {s.alignment ? gameLabel(t, 'alignment', s.alignment) : '—'}
            </div>
          </div>

          {divider}

          {allAssigned && cls && race && (
            <div className="grid grid-cols-3 gap-1 font-fell-sc text-caption">
              {ABILITY_NAMES.map(a => (
                <div key={a} className="text-center">
                  <div className="text-[#8a6838]">{abilityShort(a)}</div>
                  <div className="text-red-ink font-bold text-body">{finalScores[a]}</div>
                  <div className="text-ink-light">{fmtMod(mod(finalScores[a]))}</div>
                </div>
              ))}
            </div>
          )}

          {allAssigned && cls && race && (
            <>
              {divider}
              <div className="grid grid-cols-3 gap-1 font-cinzel text-deco text-center">
                <div>
                  <div className="text-[#8a6838]">{t('builder.hp')}</div>
                  <div className="text-red-ink text-caption">{cls.hitDie + mod(finalScores.constitution)}</div>
                </div>
                <div>
                  <div className="text-[#8a6838]">{t('builder.ac')}</div>
                  <div className="text-ink text-caption">{10 + mod(finalScores.dexterity)}</div>
                </div>
                <div>
                  <div className="text-[#8a6838]">{t('builder.speed')}</div>
                  <div className="text-ink text-caption">{t('builder.feet', { value: race.speed })}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {divider}

        {/* Personality (optional) */}
        <div className="font-cinzel text-caption tracking-widest text-[#5a3010] uppercase">
          {t('builder.personality')}{' '}
          <span className="font-fell normal-case text-[#8a6838]">{t('builder.optional')}</span>
        </div>

        {[
          ['personalityTraits', t('builder.personalityTraits')] as const,
          ['ideals', t('builder.ideals')] as const,
          ['bonds', t('builder.bonds')] as const,
          ['flaws', t('builder.flaws')] as const,
        ].map(([key, label]) => (
          <div key={key}>
            <label className="font-fell-sc text-caption text-[#5a3010] block mb-1">{label}</label>
            <textarea
              value={s[key]}
              onChange={e => setS(prev => ({ ...prev, [key]: e.target.value }))}
              rows={2}
              placeholder={t('builder.enterField', { field: label })}
              className="w-full px-3 py-2 bg-[rgba(255,240,180,0.4)] border border-[rgba(100,70,20,0.3)] rounded-sm font-fell text-caption text-ink placeholder:text-[#a08050] outline-none focus:border-[rgba(100,70,20,0.6)] transition-colors resize-none"
            />
          </div>
        ))}

        {error && (
          <div className="font-fell text-caption text-red-ink bg-[rgba(139,26,26,0.08)] border border-[rgba(139,26,26,0.3)] rounded-sm px-3 py-2">
            {error}
          </div>
        )}
      </div>
    )
  }

  const steps = [renderHeritage, renderCalling, renderGifts, renderPath, renderDestiny]

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-dungeon overflow-hidden">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-[clamp(16px,2.5vh,36px)]">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-7 h-7 rounded-full border flex items-center justify-center font-cinzel text-deco transition-all duration-200',
                  i < step
                    ? 'bg-[rgba(100,70,20,0.5)] border-[rgba(100,70,20,0.8)] text-gold-dim'
                    : i === step
                      ? 'bg-[rgba(200,168,75,0.2)] border-gold text-gold shadow-[0_0_8px_rgba(200,168,75,0.3)]'
                      : 'bg-transparent border-[rgba(100,70,20,0.3)] text-[#4a3818]',
                ].join(' ')}
              >
                {i < step ? '✓' : ['I', 'II', 'III', 'IV', 'V'][i]}
              </div>
              <span
                className={[
                  'font-cinzel text-deco tracking-wider transition-colors duration-200',
                  i === step ? 'text-gold' : 'text-[#4a3818]',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'w-[clamp(20px,3vw,48px)] h-px mx-1 mb-5 transition-colors duration-200',
                  i < step ? 'bg-[rgba(100,70,20,0.5)]' : 'bg-[rgba(100,70,20,0.2)]',
                ].join(' ')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Parchment card */}
      <div
        className="bg-parchment-sheet w-[clamp(320px,52vw,680px)] max-h-[70vh] rounded-sm shadow-[0_8px_40px_rgba(0,0,0,0.7)] flex flex-col"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(100,70,20,0.25)' }}
      >
        {/* Card header */}
        <div className="px-6 pt-5 pb-3 border-b border-[rgba(100,70,20,0.2)]">
          <div className="font-cinzel-deco text-heading text-ink text-center tracking-wide">{STEP_LABELS[step]}</div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto parchment-scroll px-6 py-4">{steps[step]()}</div>

        {/* Navigation */}
        <div className="px-6 pb-5 pt-3 border-t border-[rgba(100,70,20,0.2)] flex items-center justify-between">
          <button
            onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}
            className="font-cinzel text-caption tracking-widest text-[#6b4a20] hover:text-ink transition-colors uppercase px-3 py-1.5 border border-[rgba(100,70,20,0.3)] rounded-sm hover:border-[rgba(100,70,20,0.6)] hover:bg-[rgba(100,70,20,0.08)]"
          >
            {step === 0 ? t('builder.cancel') : t('builder.back')}
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <button
              disabled={!valid[step]}
              onClick={() => setStep(s => s + 1)}
              className={[
                'font-cinzel text-caption tracking-widest uppercase px-4 py-1.5 border rounded-sm transition-all duration-150',
                valid[step]
                  ? 'text-gold border-[rgba(200,168,75,0.5)] bg-[rgba(100,70,20,0.15)] hover:bg-[rgba(100,70,20,0.28)] hover:border-gold'
                  : 'text-[#6b4a20] border-[rgba(100,70,20,0.2)] opacity-40 cursor-not-allowed',
              ].join(' ')}
            >
              {t('builder.continue')}
            </button>
          ) : (
            <button
              disabled={creating || !valid.every(Boolean)}
              onClick={handleCreate}
              className={[
                'font-cinzel text-caption tracking-widest uppercase px-4 py-1.5 border rounded-sm transition-all duration-150',
                !creating && valid.every(Boolean)
                  ? 'text-gold border-gold bg-[rgba(100,70,20,0.2)] hover:bg-[rgba(100,70,20,0.35)] hover:shadow-[0_0_12px_rgba(200,168,75,0.25)]'
                  : 'text-[#6b4a20] border-[rgba(100,70,20,0.2)] opacity-40 cursor-not-allowed',
              ].join(' ')}
            >
              {creating ? t('builder.creating') : t('builder.create')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
