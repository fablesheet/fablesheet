import { Fragment, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, AbilityName } from '@fablesheet/core'
import {
  abilityModifier,
  armorClass,
  equippedAttacks,
  formatModifier,
  longRest,
  savingThrowBonus,
  shortRest,
  skillBonus,
  spellSlotMaximums,
} from '@fablesheet/core'
import { CharacterEditModal } from './CharacterEditModal'
import { CurrencyModal } from './CurrencyModal'
import { gameLabel } from '../i18n/game'

interface Props {
  character: Character
  onBack: () => void
  onSpellbook: () => void
  onInventory: () => void
  onNotes: () => void
  onUpdate: (c: Character) => void
}

const ABILITY_ORDER: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

const CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion 1',
  'Exhaustion 2',
  'Exhaustion 3',
  'Exhaustion 4',
  'Exhaustion 5',
  'Exhaustion 6',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
]

function profDot(level: string) {
  if (level === 'expertise') return '◆'
  if (level === 'proficient') return '◉'
  if (level === 'half') return '◑'
  return '○'
}

const DOT_COLOR: Record<string, string> = {
  expertise: 'text-[#2a408a]',
  proficient: 'text-[#2a5a28]',
  half: 'text-[#7a6020]',
  none: 'text-[rgba(100,70,20,0.3)]',
}

/* Shared section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-cinzel text-deco text-red-ink tracking-[0.28em] uppercase mb-[clamp(5px,0.7vh,10px)]">
      {children}
    </div>
  )
}

/* Gradient divider */
function Rule() {
  return <div className="deco-rule-subtle my-[clamp(6px,0.9vh,13px)]" />
}

export function CharacterSheet({ character, onBack, onSpellbook, onInventory, onNotes, onUpdate }: Props) {
  const { t } = useTranslation()
  const abilityShort = (a: string) => gameLabel(t, 'abilityShort', a)
  const [hp, setHp] = useState(character.hp.current)
  const [tempHp, setTempHp] = useState(character.hp.temp)
  const [hpInput, setHpInput] = useState('')
  const [editingHp, setEditingHp] = useState(false)
  const [tempHpInput, setTempHpInput] = useState('')
  const [editingTempHp, setEditingTempHp] = useState(false)
  const [conditions, setConditions] = useState<string[]>(character.conditions)
  const [newCondition, setNewCondition] = useState('')
  const [deathSaves, setDeathSaves] = useState(character.deathSaves)
  const [hitDiceUsed, setHitDiceUsed] = useState(character.hitDice.used)
  const [inspiration, setInspiration] = useState(character.inspiration)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [slotsUsed, setSlotsUsed] = useState<number[]>(character.spellSlotsUsed)
  const [confirmRest, setConfirmRest] = useState<'short' | 'long' | null>(null)
  const [currencyOpen, setCurrencyOpen] = useState(false)

  // Stable refs so the debounced save never captures stale closures
  const characterRef = useRef(character)
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    characterRef.current = character
  }, [character])
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // Debounced auto-save — fires 600 ms after the last change
  useEffect(() => {
    const timer = setTimeout(() => {
      const c = characterRef.current
      onUpdateRef.current({
        ...c,
        hp: { ...c.hp, current: hp, temp: tempHp },
        conditions,
        deathSaves,
        hitDice: { ...c.hitDice, used: hitDiceUsed },
        inspiration,
        spellSlotsUsed: slotsUsed,
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [hp, tempHp, conditions, deathSaves, hitDiceUsed, inspiration, slotsUsed])

  // Rest confirmation resets itself if not confirmed
  useEffect(() => {
    if (!confirmRest) return
    const timer = setTimeout(() => setConfirmRest(null), 4000)
    return () => clearTimeout(timer)
  }, [confirmRest])

  const isCaster = character.spellcastingAbility !== null
  const attacks = equippedAttacks(character)
  const slotMaximums = spellSlotMaximums(character.className, character.level)
  const hasSlots = slotMaximums.some(n => n > 0)

  function toggleSlot(levelIndex: number, pip: number) {
    setSlotsUsed(prev => prev.map((used, i) => (i === levelIndex ? (pip + 1 === used ? pip : pip + 1) : used)))
  }

  /** Applies locally edited values to a character snapshot */
  function withLocalState(c: Character): Character {
    return {
      ...c,
      hp: { ...c.hp, current: hp, temp: tempHp },
      conditions,
      deathSaves,
      hitDice: { ...c.hitDice, used: hitDiceUsed },
      inspiration,
      spellSlotsUsed: slotsUsed,
    }
  }

  function syncLocalState(c: Character) {
    setHp(c.hp.current)
    setTempHp(c.hp.temp)
    setConditions(c.conditions)
    setDeathSaves(c.deathSaves)
    setHitDiceUsed(c.hitDice.used)
    setSlotsUsed(c.spellSlotsUsed)
  }

  function handleRest(kind: 'short' | 'long') {
    if (confirmRest !== kind) {
      setConfirmRest(kind)
      return
    }
    setConfirmRest(null)
    const current = withLocalState(character)
    const rested = kind === 'long' ? longRest(current) : shortRest(current)
    syncLocalState(rested)
    onUpdate(rested)
  }
  const hpPercent = Math.max(0, Math.min(100, (hp / character.hp.max) * 100))
  const hpColor = hpPercent > 60 ? '#3a7a3a' : hpPercent > 30 ? '#8a7020' : '#8b1a1a'

  function applyHpDelta(delta: number) {
    setHp(prev => Math.max(0, Math.min(character.hp.max, prev + delta)))
  }
  function commitHpEdit() {
    const v = parseInt(hpInput)
    if (!isNaN(v)) setHp(Math.max(0, Math.min(character.hp.max, v)))
    setEditingHp(false)
    setHpInput('')
  }
  function commitTempHpEdit() {
    const v = parseInt(tempHpInput)
    if (!isNaN(v)) setTempHp(Math.max(0, v))
    setEditingTempHp(false)
    setTempHpInput('')
  }

  function toggleDeathSave(type: 'successes' | 'failures', idx: number) {
    setDeathSaves(prev => ({
      ...prev,
      [type]: idx + 1 === prev[type] ? idx : idx + 1,
    }))
  }

  function addCondition() {
    const c = newCondition.trim()
    if (c && !conditions.includes(c)) setConditions(prev => [...prev, c])
    setNewCondition('')
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-dungeon animate-fade-up-fast overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between bg-topbar border-b border-[#1e1608] shrink-0 px-[clamp(14px,1.8vw,28px)] py-[clamp(8px,1.2vh,16px)]">
        <button
          onClick={onBack}
          className="font-cinzel text-caption tracking-[0.12em] text-[#8a7040] bg-transparent border border-[#2e2010] px-[clamp(12px,1.4vw,22px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020] whitespace-nowrap"
        >
          {t('common.back')}
        </button>

        <div className="text-center">
          <span className="block font-cinzel-deco text-heading text-gold tracking-[0.06em] leading-[1.2]">
            {character.name}
          </span>
          <span className="block font-fell-sc text-badge text-[#5a4a28] tracking-[0.12em] mt-0.5">
            {t('sheet.subtitle', {
              race: gameLabel(t, 'race', character.race),
              className: gameLabel(t, 'class', character.className),
              level: character.level,
            })}
            {character.subclass ? ` · ${character.subclass}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(['short', 'long'] as const).map(kind => (
            <button
              key={kind}
              onClick={() => handleRest(kind)}
              title={t(kind === 'short' ? 'sheet.shortRestHint' : 'sheet.longRestHint')}
              className={[
                'font-cinzel text-caption tracking-[0.1em] border px-[clamp(10px,1.2vw,18px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm whitespace-nowrap transition-colors',
                confirmRest === kind
                  ? 'text-gold border-gold-dim bg-[rgba(90,60,10,0.25)]'
                  : 'text-[#8a7040] border-[#2e2010] bg-transparent hover:text-gold hover:border-[#5a4020]',
              ].join(' ')}
            >
              {confirmRest === kind
                ? t('sheet.confirmRest')
                : t(kind === 'short' ? 'sheet.shortRest' : 'sheet.longRest')}
            </button>
          ))}
          <button
            onClick={() => setEditModalOpen(true)}
            title={t('select.editCharacter')}
            aria-label={t('select.editCharacter')}
            className="font-cinzel text-caption text-[#8a7040] bg-transparent border border-[#2e2010] px-[clamp(8px,1vw,14px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020]"
          >
            ✎
          </button>
          <button
            onClick={onNotes}
            className="font-cinzel text-caption tracking-[0.1em] text-[#8a7040] border border-[#2e2010] px-[clamp(10px,1.2vw,18px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm whitespace-nowrap transition-colors hover:text-gold hover:border-[#5a4020]"
          >
            {t('sheet.notes')}
          </button>
          <button
            onClick={onInventory}
            className="font-cinzel text-caption tracking-[0.1em] text-[#8a7040] border border-[#2e2010] px-[clamp(10px,1.2vw,18px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm whitespace-nowrap transition-colors hover:text-gold hover:border-[#5a4020]"
          >
            {t('sheet.inventory')}
            {(character.items ?? []).length > 0 && (
              <span className="ml-1.5 font-fell-sc text-deco text-[rgba(100,70,20,0.6)]">
                {(character.items ?? []).length}
              </span>
            )}
          </button>
          {isCaster && (
            <button
              onClick={onSpellbook}
              className="font-cinzel text-caption tracking-[0.1em] text-gold-dim border border-[#5a3e14] px-[clamp(12px,1.4vw,22px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm whitespace-nowrap transition-[color,border-color,box-shadow] hover:text-gold hover:border-gold-dim"
              style={{
                background: 'linear-gradient(160deg, #2a1a06 0%, #1a1004 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {t('sheet.spellbook')}
            </button>
          )}
        </div>
      </div>

      {/* ── 3-column body ── */}
      <div className="flex-1 flex bg-parchment-sheet shadow-sheet rounded-sm overflow-hidden min-h-0 mx-[clamp(10px,1.2vw,20px)] mt-[clamp(8px,1.2vh,16px)] mb-[clamp(6px,0.8vh,12px)]">
        {/* ── Left column: Ability Scores + Spell Info + Inspiration ── */}
        <div
          className="flex flex-col overflow-y-auto parchment-scroll px-[clamp(10px,1.2vw,20px)] py-[clamp(10px,1.4vh,20px)] shrink-0 border-r border-[rgba(100,70,20,0.2)] w-[clamp(185px,17vw,310px)]"
          style={{ background: 'linear-gradient(to right, rgba(90,60,10,0.04), transparent)' }}
        >
          <SectionLabel>{t('sheet.abilityScores')}</SectionLabel>
          <div className="grid grid-cols-2 gap-[clamp(5px,0.7vh,10px)_clamp(6px,0.8vw,12px)] mb-[clamp(4px,0.5vh,8px)]">
            {ABILITY_ORDER.map(ab => (
              <div
                key={ab}
                className="flex flex-col items-center px-[clamp(4px,0.5vw,8px)] py-[clamp(5px,0.8vh,12px)] rounded-sm border border-[rgba(100,70,20,0.2)] bg-[rgba(90,60,10,0.07)]"
              >
                <span className="font-cinzel text-deco text-red-ink tracking-[0.15em] uppercase mb-0.5">
                  {abilityShort(ab)}
                </span>
                <span className="font-cinzel-deco text-display text-ink leading-none">
                  {formatModifier(abilityModifier(character.scores[ab]))}
                </span>
                <span className="font-fell-sc text-badge text-[#7a5820] mt-0.5">{character.scores[ab]}</span>
              </div>
            ))}
          </div>

          <Rule />

          <div className="flex items-center justify-between py-[clamp(3px,0.4vh,6px)]">
            <span className="font-fell-sc text-caption text-[#5a3a18]">{t('sheet.proficiencyBonus')}</span>
            <span className="font-cinzel text-body text-ink">+{character.proficiencyBonus}</span>
          </div>

          {isCaster && (
            <>
              <Rule />
              <SectionLabel>{t('sheet.spellcasting')}</SectionLabel>
              <div className="flex flex-col gap-[clamp(2px,0.4vh,5px)]">
                {[
                  {
                    k: t('sheet.ability'),
                    v: character.spellcastingAbility ? abilityShort(character.spellcastingAbility) : '—',
                  },
                  { k: t('sheet.saveDc'), v: String(character.spellSaveDC ?? '—') },
                  {
                    k: t('sheet.attackBonus'),
                    v: character.spellAttackBonus !== null ? formatModifier(character.spellAttackBonus) : '—',
                  },
                  { k: t('sheet.prepared'), v: String(character.preparedSpells.length) },
                  { k: t('sheet.known'), v: String(character.knownSpells.length) },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="font-fell-sc text-caption text-[#7a5030]">{k}</span>
                    <span className="font-cinzel text-caption text-ink">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {hasSlots && (
            <>
              <Rule />
              <SectionLabel>{t('sheet.spellSlots')}</SectionLabel>
              <div className="flex flex-col gap-[clamp(2px,0.4vh,5px)]">
                {slotMaximums.map((max, i) =>
                  max === 0 ? null : (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-fell-sc text-caption text-[#7a5030]">
                        {t('sheet.slotLevel', { level: i + 1 })}
                      </span>
                      <div className="flex gap-[clamp(3px,0.4vw,6px)]">
                        {Array.from({ length: max }, (_, pip) => {
                          const used = pip < (slotsUsed[i] ?? 0)
                          return (
                            <button
                              key={pip}
                              onClick={() => toggleSlot(i, pip)}
                              title={used ? t('sheet.restoreSlot') : t('sheet.useSlot')}
                              aria-label={used ? t('sheet.restoreSlot') : t('sheet.useSlot')}
                              aria-pressed={used}
                              className={`text-caption leading-none cursor-pointer bg-transparent border-none p-0 transition-opacity hover:opacity-70 ${used ? 'text-[rgba(100,70,20,0.3)]' : 'text-gold-dim'}`}
                            >
                              {used ? '◇' : '◆'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </>
          )}

          <Rule />

          {/* Inspiration toggle */}
          <button
            onClick={() => setInspiration(prev => !prev)}
            className={[
              'font-cinzel text-badge tracking-[0.18em] text-center w-full',
              'py-[clamp(3px,0.4vh,7px)] border rounded-sm cursor-pointer transition-colors',
              inspiration
                ? 'text-[#4a7028] border-[rgba(74,112,40,0.4)] bg-[rgba(74,112,40,0.09)] hover:bg-[rgba(74,112,40,0.15)]'
                : 'text-[#9a8050] border-[rgba(100,70,20,0.2)] bg-transparent hover:border-[rgba(100,70,20,0.35)] hover:text-[#7a6030]',
            ].join(' ')}
          >
            {t('sheet.inspiration')}
          </button>
        </div>

        {/* ── Center column: HP, Combat, Hit Dice, Death Saves, Conditions ── */}
        <div className="flex flex-col flex-1 overflow-y-auto parchment-scroll px-[clamp(10px,1.2vw,20px)] py-[clamp(10px,1.4vh,20px)] border-r border-[rgba(100,70,20,0.2)]">
          {/* HP */}
          <SectionLabel>{t('sheet.hitPoints')}</SectionLabel>
          <div
            className="h-[clamp(8px,1.2vh,16px)] rounded-md border border-[rgba(100,70,20,0.2)] overflow-hidden my-[clamp(4px,0.7vh,10px)]"
            style={{ background: 'rgba(0,0,0,0.12)' }}
          >
            <div
              className="h-full rounded-md transition-[width,background] duration-300"
              style={{ width: `${hpPercent}%`, background: hpColor }}
            />
          </div>

          <div className="flex items-center justify-center gap-[clamp(8px,1.2vw,20px)] mt-[clamp(4px,0.6vh,8px)]">
            <button
              onClick={() => applyHpDelta(-1)}
              className="flex items-center justify-center w-[clamp(24px,2.2vw,34px)] h-[clamp(24px,2.2vw,34px)] border border-[rgba(100,70,20,0.3)] rounded-sm cursor-pointer text-subhead text-ink-light transition-colors hover:bg-[rgba(90,60,10,0.22)]"
              style={{ background: 'rgba(90,60,10,0.1)' }}
            >
              −
            </button>

            {editingHp ? (
              <input
                className="w-[clamp(60px,6vw,90px)] text-center font-cinzel-deco text-display bg-[rgba(255,240,180,0.5)] border border-[rgba(100,70,20,0.4)] rounded-sm text-ink p-1"
                type="number"
                value={hpInput}
                autoFocus
                onChange={e => setHpInput(e.target.value)}
                onBlur={commitHpEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitHpEdit()
                }}
              />
            ) : (
              <span
                className="cursor-text"
                onClick={() => {
                  setHpInput(String(hp))
                  setEditingHp(true)
                }}
                title={t('sheet.clickToEdit')}
              >
                <span className="font-cinzel-deco text-giant leading-none" style={{ color: hpColor }}>
                  {hp}
                </span>
                <span className="font-fell text-heading text-[#8a7040]"> / </span>
                <span className="font-cinzel text-heading text-[#5a4020]">{character.hp.max}</span>
              </span>
            )}

            <button
              onClick={() => applyHpDelta(+1)}
              className="flex items-center justify-center w-[clamp(24px,2.2vw,34px)] h-[clamp(24px,2.2vw,34px)] border border-[rgba(100,70,20,0.3)] rounded-sm cursor-pointer text-subhead text-ink-light transition-colors hover:bg-[rgba(90,60,10,0.22)]"
              style={{ background: 'rgba(90,60,10,0.1)' }}
            >
              +
            </button>
          </div>

          {/* Temp HP */}
          <div className="flex justify-center mt-[clamp(3px,0.5vh,7px)]">
            {editingTempHp ? (
              <input
                className="w-[clamp(70px,7vw,100px)] text-center font-cinzel text-caption bg-[rgba(58,106,138,0.15)] border border-[rgba(58,106,138,0.4)] rounded-sm text-ink p-1"
                type="number"
                value={tempHpInput}
                autoFocus
                onChange={e => setTempHpInput(e.target.value)}
                onBlur={commitTempHpEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitTempHpEdit()
                }}
              />
            ) : (
              <button
                onClick={() => {
                  setTempHpInput(String(tempHp))
                  setEditingTempHp(true)
                }}
                className="font-fell-sc text-badge cursor-pointer bg-transparent border-none p-0 transition-colors"
                style={{ color: tempHp > 0 ? '#3a6a8a' : 'rgba(100,70,20,0.35)' }}
                title={t('sheet.setTempHp')}
              >
                {tempHp > 0 ? t('sheet.tempHp', { value: tempHp }) : t('sheet.addTempHp')}
              </button>
            )}
          </div>

          <Rule />

          {/* Combat row */}
          <div className="flex items-center justify-center">
            {[
              { val: String(armorClass(character)), key: 'ac' },
              { val: formatModifier(character.initiativeBonus), key: 'initiative' },
              { val: String(character.speed), key: 'speed' },
            ].map(({ val, key }, i) => (
              <Fragment key={key}>
                {i > 0 && <div className="deco-vline h-[clamp(30px,4vh,50px)] mx-2" />}
                <div className="flex flex-col items-center flex-1">
                  <span className="font-cinzel-deco text-display text-ink leading-none">{val}</span>
                  <span className="font-cinzel text-deco text-red-ink tracking-[0.18em] uppercase mt-0.5">
                    {t(`sheet.${key}`)}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          <Rule />

          {/* Attacks from equipped weapons */}
          <SectionLabel>{t('sheet.attacks')}</SectionLabel>
          {attacks.length === 0 ? (
            <p className="font-fell italic text-caption text-[#9a8050] mb-1">{t('sheet.noAttacks')}</p>
          ) : (
            <div className="flex flex-col gap-[clamp(3px,0.5vh,7px)] mb-1">
              {attacks.map(a => (
                <div key={a.itemId} className="flex items-baseline gap-[clamp(6px,0.8vw,12px)]">
                  <span className="font-fell-sc text-caption text-ink flex-1 min-w-0 truncate" title={a.name}>
                    {a.name}
                    {!a.proficient && (
                      <span className="text-[#9a8050]" title={t('sheet.notProficient')}>
                        {' '}
                        *
                      </span>
                    )}
                  </span>
                  <span className="font-cinzel text-caption text-ink w-[clamp(28px,2.6vw,40px)] text-right shrink-0">
                    {formatModifier(a.attackBonus)}
                  </span>
                  <span className="font-fell-sc text-caption text-[#5a3a18] w-[clamp(110px,11vw,170px)] shrink-0">
                    {a.damage ?? '—'}
                    {a.versatileDamage && <span className="text-[#9a8050]"> ({a.versatileDamage})</span>}{' '}
                    {a.damageType && gameLabel(t, 'damageType', a.damageType)}
                  </span>
                </div>
              ))}
              {attacks.some(a => !a.proficient) && (
                <p className="font-fell italic text-deco text-[#9a8050]">* {t('sheet.notProficient')}</p>
              )}
            </div>
          )}

          <Rule />

          {/* Hit Dice */}
          <div className="flex justify-between items-center">
            <span className="font-fell-sc text-caption text-[#5a3a18]">{t('sheet.hitDice')}</span>
            <div className="flex items-center gap-[clamp(5px,0.8vw,10px)]">
              <span className="font-cinzel text-caption text-ink">
                {character.hitDice.total - hitDiceUsed}/{character.hitDice.total}&nbsp;{character.hitDice.die}
              </span>
              <button
                onClick={() => setHitDiceUsed(prev => Math.min(character.hitDice.total, prev + 1))}
                disabled={hitDiceUsed >= character.hitDice.total}
                className="font-cinzel text-deco text-[#5a3a18] border border-[rgba(100,70,20,0.3)] px-[clamp(5px,0.6vw,9px)] py-px rounded-sm cursor-pointer transition-colors hover:text-red-ink hover:border-[rgba(139,26,26,0.4)] disabled:opacity-30 disabled:cursor-default"
                style={{ background: 'rgba(90,60,10,0.08)' }}
              >
                {t('sheet.use')}
              </button>
              {hitDiceUsed > 0 && (
                <button
                  onClick={() => setHitDiceUsed(0)}
                  className="font-cinzel text-deco text-[#3a6a28] border border-[rgba(58,106,40,0.3)] px-[clamp(5px,0.6vw,9px)] py-px rounded-sm cursor-pointer transition-colors hover:border-[rgba(58,106,40,0.5)]"
                  style={{ background: 'rgba(58,106,40,0.06)' }}
                  title={t('sheet.recoverHitDice')}
                >
                  ↺
                </button>
              )}
            </div>
          </div>

          <Rule />

          {/* Death Saves — clickable dots */}
          <SectionLabel>{t('sheet.deathSaves')}</SectionLabel>
          {[
            { label: t('sheet.successes'), key: 'successes' as const, cls: 'text-[#3a6a28]' },
            { label: t('sheet.failures'), key: 'failures' as const, cls: 'text-red-ink' },
          ].map(({ label, key, cls }) => (
            <div key={label} className="flex items-center justify-between mb-[clamp(3px,0.4vh,6px)]">
              <span className={`font-fell-sc text-caption ${cls}`}>{label}</span>
              <div className="flex gap-[clamp(5px,0.8vw,10px)]">
                {[0, 1, 2].map(i => (
                  <button
                    key={i}
                    onClick={() => toggleDeathSave(key, i)}
                    className={`text-body cursor-pointer bg-transparent border-none p-0 transition-opacity hover:opacity-70 ${i < deathSaves[key] ? cls : 'text-[rgba(100,70,20,0.3)]'}`}
                    title={i < deathSaves[key] ? t('sheet.clickToUncheck') : t('sheet.clickToCheck')}
                  >
                    ○
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Rule />

          {/* Conditions — always visible, add/remove */}
          <SectionLabel>{t('sheet.conditions')}</SectionLabel>
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-[clamp(5px,0.7vh,8px)]">
              {conditions.map((c, i) => (
                <span
                  key={i}
                  className="font-cinzel text-deco tracking-[0.1em] text-red-ink bg-[rgba(139,26,26,0.08)] border border-[rgba(139,26,26,0.2)] pl-2 pr-1 py-0.5 rounded-sm flex items-center gap-1"
                >
                  {gameLabel(t, 'condition', c)}
                  <button
                    onClick={() => setConditions(prev => prev.filter(x => x !== c))}
                    className="text-red-ink opacity-40 hover:opacity-90 cursor-pointer bg-transparent border-none p-0 leading-none text-caption"
                    title={t('sheet.removeCondition')}
                    aria-label={t('sheet.removeCondition')}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-1.5">
            <input
              list="condition-suggestions"
              value={newCondition}
              onChange={e => setNewCondition(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addCondition()
              }}
              placeholder={t('sheet.addCondition')}
              className="flex-1 font-fell-sc text-caption text-ink bg-[rgba(255,240,180,0.3)] border border-[rgba(100,70,20,0.2)] rounded-sm px-2 py-[clamp(3px,0.4vh,6px)] outline-none focus:border-[rgba(100,70,20,0.45)] placeholder:text-[rgba(100,70,20,0.35)]"
            />
            <datalist id="condition-suggestions">
              {CONDITIONS.map(c => (
                <option key={c} value={gameLabel(t, 'condition', c)} />
              ))}
            </datalist>
            <button
              onClick={addCondition}
              className="font-cinzel text-body text-[#8a7040] border border-[rgba(100,70,20,0.3)] px-[clamp(8px,1vw,14px)] rounded-sm cursor-pointer transition-colors hover:text-gold hover:border-[rgba(100,70,20,0.5)]"
              style={{ background: 'rgba(90,60,10,0.08)' }}
            >
              +
            </button>
          </div>
        </div>

        {/* ── Right column: Saving Throws + Skills ── */}
        <div className="flex flex-col overflow-hidden px-[clamp(10px,1.2vw,20px)] py-[clamp(10px,1.4vh,20px)] shrink-0 w-[clamp(220px,22vw,400px)]">
          <SectionLabel>{t('sheet.savingThrows')}</SectionLabel>
          <div className="flex flex-col gap-[clamp(2px,0.4vh,6px)] mb-1">
            {ABILITY_ORDER.map(ab => {
              const isProficient = character.savingThrowProficiencies.includes(ab)
              const bonus = savingThrowBonus(character.scores[ab], isProficient, character.proficiencyBonus)
              return (
                <div key={ab} className="flex items-center gap-[clamp(5px,0.7vw,10px)]">
                  <span className={`text-caption ${isProficient ? 'text-[#2a5a28]' : 'text-[rgba(100,70,20,0.3)]'}`}>
                    {isProficient ? '◉' : '○'}
                  </span>
                  <span className="font-fell-sc text-caption text-ink w-[clamp(28px,2.6vw,44px)] shrink-0">
                    {abilityShort(ab)}
                  </span>
                  <span className="font-cinzel text-caption text-[#2a2a1a] ml-auto">{formatModifier(bonus)}</span>
                </div>
              )
            })}
          </div>

          <Rule />

          <SectionLabel>{t('sheet.skills')}</SectionLabel>
          <div className="flex flex-col gap-[clamp(1px,0.3vh,4px)] overflow-y-auto flex-1 min-h-0 pr-0.5 parchment-scroll">
            {character.skills.map(skill => {
              const bonus = skillBonus(character.scores[skill.ability], skill.proficiency, character.proficiencyBonus)
              return (
                <div
                  key={skill.name}
                  className="flex items-center gap-[clamp(4px,0.5vw,8px)] px-0.5 py-[clamp(1px,0.3vh,4px)] rounded-sm hover:bg-[rgba(90,60,10,0.08)] transition-colors"
                >
                  <span className={`text-caption shrink-0 ${DOT_COLOR[skill.proficiency]}`}>
                    {profDot(skill.proficiency)}
                  </span>
                  <span className="font-fell-sc text-caption text-ink flex-1 whitespace-nowrap">
                    {gameLabel(t, 'skill', skill.name)}
                  </span>
                  <span className="font-cinzel text-deco text-[#9a7850] shrink-0">({abilityShort(skill.ability)})</span>
                  <span className="font-cinzel text-caption text-[#2a2a1a] w-[clamp(22px,2.2vw,34px)] text-right shrink-0">
                    {formatModifier(bonus)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="flex items-center flex-wrap bg-parchment-footer shadow-footer rounded-sm shrink-0 px-[clamp(12px,1.4vw,22px)] py-[clamp(6px,0.9vh,12px)] mx-[clamp(10px,1.2vw,20px)] mb-[clamp(8px,1.1vh,14px)]">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-cinzel text-deco text-red-ink tracking-[0.2em] uppercase mb-0.5">
            {t('sheet.languages')}
          </span>
          <span className="font-fell-sc text-caption text-ink leading-[1.35] whitespace-nowrap overflow-hidden text-ellipsis">
            {character.languages.join(', ')}
          </span>
        </div>

        <div className="deco-vline h-[clamp(24px,3.5vh,40px)] mx-[clamp(10px,1.2vw,18px)]" />

        <button
          onClick={() => setCurrencyOpen(true)}
          title={t('sheet.editCurrency')}
          className="flex flex-col flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer rounded-sm hover:bg-[rgba(90,60,10,0.08)]"
        >
          <span className="font-cinzel text-deco text-red-ink tracking-[0.2em] uppercase mb-0.5">
            {t('sheet.currency')}
          </span>
          <span className="font-fell-sc text-caption text-ink leading-[1.35] whitespace-nowrap overflow-hidden text-ellipsis">
            {[
              (['pp', 'gp', 'ep', 'sp', 'cp'] as const).map(coin =>
                character.currency[coin] > 0 ? `${character.currency[coin]} ${gameLabel(t, 'currency', coin)}` : '',
              ),
            ]
              .flat()
              .filter(Boolean)
              .join(' ') || '—'}
          </span>
        </button>

        {character.features.length > 0 && (
          <>
            <div className="deco-vline h-[clamp(24px,3.5vh,40px)] mx-[clamp(10px,1.2vw,18px)]" />
            <div className="flex flex-col flex-[2] min-w-0">
              <span className="font-cinzel text-deco text-red-ink tracking-[0.2em] uppercase mb-0.5">
                {t('sheet.features')}
              </span>
              <span className="font-fell-sc text-caption text-ink leading-[1.35] whitespace-nowrap overflow-hidden text-ellipsis">
                {character.features.map(f => f.name).join(' · ')}
              </span>
            </div>
          </>
        )}
      </div>

      {currencyOpen && (
        <CurrencyModal
          currency={character.currency}
          onClose={() => setCurrencyOpen(false)}
          onSave={currency => {
            onUpdate(withLocalState({ ...character, currency }))
            setCurrencyOpen(false)
          }}
        />
      )}

      {/* ── Edit modal ── */}
      {editModalOpen && (
        <CharacterEditModal
          character={character}
          onSaved={updated => {
            // Level changes adjust HP, hit dice and slots, so refresh the locally edited values
            syncLocalState(updated)
            onUpdate(updated)
            setEditModalOpen(false)
          }}
          onDeleted={onBack}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  )
}
