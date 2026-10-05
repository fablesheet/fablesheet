import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AbilityName, Character } from '@fablesheet/core'
import {
  abilityModifier,
  applyHealing,
  equippedAttacks,
  formatModifier,
  savingThrowBonus,
  skillBonus,
  spellSlotMaximums,
  takeDamage,
} from '@fablesheet/core'
import { gameLabel } from '../../i18n/game'
import { ConcentrationCheckDialog } from '../combat/ConcentrationCheckDialog'
import { CurrencyModal } from '../CurrencyModal'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { FeaturesCard } from './FeaturesCard'
import { Pips } from './Pips'
import { CONDITIONS } from './conditions'

const ABILITIES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

const PROFICIENCY_MARK = { none: '◇', half: '◈', proficient: '◆', expertise: '❖' } as const

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

export function SheetView({ character, onUpdate }: Props) {
  const update = (patch: Partial<Character>) => onUpdate({ ...character, ...patch })

  return (
    <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_0.9fr] pb-4">
        <div className="flex flex-col gap-3">
          <AbilitiesCard character={character} />
          <ConditionsCard character={character} update={update} />
          <FeaturesCard character={character} onUpdate={onUpdate} />
        </div>
        <div className="flex flex-col gap-3">
          <HitPointsCard character={character} onUpdate={onUpdate} />
          <AttacksCard character={character} />
          <SpellcastingCard character={character} update={update} />
        </div>
        <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-1">
          <SkillsCard character={character} />
          <DetailsCard character={character} update={update} />
        </div>
      </div>
    </div>
  )
}

// ── Abilities & saving throws ─────────────────────────────────────────────────

function AbilitiesCard({ character }: { character: Character }) {
  const { t } = useTranslation()
  return (
    <Card label={t('table.abilitiesAndSaves')}>
      <div className="grid grid-cols-3 gap-2">
        {ABILITIES.map(ab => {
          const proficient = character.savingThrowProficiencies.includes(ab)
          const save = savingThrowBonus(character.scores[ab], proficient, character.proficiencyBonus)
          return (
            <div key={ab} className="bg-fs-tile border border-fs-card-line rounded-lg py-2 text-center">
              <div className="text-xs text-fs-ink-muted" title={gameLabel(t, 'ability', ab)}>
                {gameLabel(t, 'abilityShort', ab)} · {character.scores[ab]}
              </div>
              <div className="font-display text-2xl leading-tight">
                {formatModifier(abilityModifier(character.scores[ab]))}
              </div>
              <div className={`text-xs ${proficient ? 'text-fs-ink' : 'text-fs-ink-muted'}`}>
                {proficient ? '◆ ' : ''}
                {t('table.save')} {formatModifier(save)}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between items-center mt-3 text-sm">
        <span className="text-fs-ink-muted">{t('sheet.proficiencyBonus')}</span>
        <span className="font-display text-base">{formatModifier(character.proficiencyBonus)}</span>
      </div>
    </Card>
  )
}

// ── Hit points, hit dice, death saves ─────────────────────────────────────────

function HitPointsCard({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const value = Math.max(0, Math.floor(Number(amount) || 0))
  const [concentrationDC, setConcentrationDC] = useState<number | null>(null)
  const { hp, hitDice, deathSaves } = character

  function apply(kind: 'damage' | 'heal') {
    if (value === 0) return
    if (kind === 'damage') {
      const result = takeDamage(character, value)
      onUpdate(result.character)
      setConcentrationDC(result.concentrationCheck)
    } else {
      onUpdate(applyHealing(character, value))
    }
    setAmount('')
  }

  return (
    <Card label={t('sheet.hitPoints')}>
      {concentrationDC !== null && (
        <ConcentrationCheckDialog
          character={character}
          dc={concentrationDC}
          onResolve={updated => {
            onUpdate(updated)
            setConcentrationDC(null)
          }}
        />
      )}
      <div className="flex items-end gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl leading-none">{hp.current}</span>
          <span className="text-fs-ink-muted">/ {hp.max}</span>
        </div>
        <label className="ml-auto flex flex-col items-end text-xs text-fs-ink-muted">
          {t('table.tempHp')}
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={hp.temp}
            onChange={e =>
              onUpdate({ ...character, hp: { ...hp, temp: Math.max(0, Math.floor(Number(e.target.value) || 0)) } })
            }
            className="fs-focus w-16 mt-1 text-right font-display text-lg text-fs-ink bg-fs-tile border border-fs-card-line rounded-md px-2 py-1"
          />
        </label>
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={amount}
          placeholder={t('table.amount')}
          aria-label={t('table.amount')}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply('damage')}
          className="fs-focus w-20 min-h-10 text-center font-display text-lg text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg"
        />
        <Button variant="danger" className="flex-1" onClick={() => apply('damage')}>
          {t('table.damage')}
        </Button>
        <Button className="flex-1" onClick={() => apply('heal')}>
          {t('table.heal')}
        </Button>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-fs-ink-muted">{t('sheet.hitDice')}</span>
        <span className="flex items-center gap-2">
          <span className="font-display">
            {hitDice.total - hitDice.used} / {hitDice.total} {hitDice.die}
          </span>
          <Button
            size="sm"
            disabled={hitDice.used >= hitDice.total}
            onClick={() => onUpdate({ ...character, hitDice: { ...hitDice, used: hitDice.used + 1 } })}
          >
            {t('sheet.use')}
          </Button>
        </span>
      </div>

      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-fs-ink-muted">{t('sheet.deathSaves')}</span>
        <span className="flex items-center gap-3">
          <Pips
            shape="circle"
            tone="good"
            total={3}
            filled={deathSaves.successes}
            onChange={n => onUpdate({ ...character, deathSaves: { ...deathSaves, successes: n } })}
            labelFilled={t('sheet.successes')}
            labelEmpty={t('sheet.successes')}
          />
          <span className="text-fs-card-line">|</span>
          <Pips
            shape="circle"
            tone="danger"
            total={3}
            filled={deathSaves.failures}
            onChange={n => onUpdate({ ...character, deathSaves: { ...deathSaves, failures: n } })}
            labelFilled={t('sheet.failures')}
            labelEmpty={t('sheet.failures')}
          />
        </span>
      </div>
    </Card>
  )
}

// ── Attacks ───────────────────────────────────────────────────────────────────

function AttacksCard({ character }: { character: Character }) {
  const { t } = useTranslation()
  const attacks = equippedAttacks(character)
  return (
    <Card label={t('sheet.attacks')}>
      {attacks.length === 0 ? (
        <p className="text-sm text-fs-ink-muted italic m-0">{t('sheet.noAttacks')}</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {attacks.map(a => (
            <li
              key={a.itemId}
              className="flex items-baseline gap-3 py-2 border-b border-fs-card-line last:border-b-0 text-sm"
            >
              <span className="flex-1 min-w-0 truncate">
                {a.name}
                {!a.proficient && (
                  <span className="text-fs-ink-muted" title={t('sheet.notProficient')}>
                    {' '}
                    *
                  </span>
                )}
              </span>
              <span className="font-display w-10 text-right">{formatModifier(a.attackBonus)}</span>
              <span className="text-fs-ink-muted w-40 text-right">
                {a.damage ?? '—'}
                {a.versatileDamage && ` (${a.versatileDamage})`}{' '}
                {a.damageType && gameLabel(t, 'damageType', a.damageType)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {attacks.some(a => !a.proficient) && (
        <p className="text-xs text-fs-ink-muted m-0 mt-2">* {t('sheet.notProficient')}</p>
      )}
    </Card>
  )
}

// ── Spellcasting ──────────────────────────────────────────────────────────────

function SpellcastingCard({ character, update }: { character: Character; update: (p: Partial<Character>) => void }) {
  const { t } = useTranslation()
  if (!character.spellcastingAbility) return null
  const maximums = spellSlotMaximums(character.className, character.level)

  return (
    <Card label={t('sheet.spellcasting')}>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          [t('sheet.ability'), gameLabel(t, 'abilityShort', character.spellcastingAbility)],
          [t('sheet.saveDc'), String(character.spellSaveDC ?? '—')],
          [
            t('sheet.attackBonus'),
            character.spellAttackBonus !== null ? formatModifier(character.spellAttackBonus) : '—',
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-fs-tile border border-fs-card-line rounded-lg py-1.5 text-center">
            <div className="font-display text-lg leading-tight">{value}</div>
            <div className="text-xs text-fs-ink-muted">{label}</div>
          </div>
        ))}
      </div>
      {maximums.map((max, i) =>
        max === 0 ? null : (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-fs-ink-muted">{t('sheet.slotLevel', { level: i + 1 })}</span>
            <Pips
              total={max}
              filled={max - (character.spellSlotsUsed[i] ?? 0)}
              onChange={available =>
                update({ spellSlotsUsed: character.spellSlotsUsed.map((u, j) => (j === i ? max - available : u)) })
              }
              labelFilled={t('sheet.useSlot')}
              labelEmpty={t('sheet.restoreSlot')}
            />
          </div>
        ),
      )}
    </Card>
  )
}

// ── Conditions & inspiration ──────────────────────────────────────────────────

function ConditionsCard({ character, update }: { character: Character; update: (p: Partial<Character>) => void }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  function add() {
    const c = draft.trim()
    if (c && !character.conditions.includes(c)) update({ conditions: [...character.conditions, c] })
    setDraft('')
  }

  return (
    <Card
      label={t('sheet.conditions')}
      action={
        <Button
          size="sm"
          variant={character.inspiration ? 'primary' : 'secondary'}
          aria-pressed={character.inspiration}
          onClick={() => update({ inspiration: !character.inspiration })}
        >
          {t('sheet.inspiration')}
        </Button>
      }
    >
      {character.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {character.conditions.map(c => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-sm text-fs-danger bg-fs-danger-bg rounded-md pl-2.5"
            >
              {gameLabel(t, 'condition', c)}
              <button
                onClick={() => update({ conditions: character.conditions.filter(x => x !== c) })}
                aria-label={t('sheet.removeCondition')}
                title={t('sheet.removeCondition')}
                className="fs-focus size-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-fs-danger rounded-md hover:bg-black/5"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          list="condition-suggestions"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={t('sheet.addCondition')}
          aria-label={t('sheet.addCondition')}
          className="fs-focus flex-1 min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted"
        />
        <datalist id="condition-suggestions">
          {CONDITIONS.map(c => (
            <option key={c} value={gameLabel(t, 'condition', c)} />
          ))}
        </datalist>
        <Button onClick={add} aria-label={t('sheet.addCondition')}>
          +
        </Button>
      </div>
    </Card>
  )
}

// ── Skills ────────────────────────────────────────────────────────────────────

function SkillsCard({ character }: { character: Character }) {
  const { t } = useTranslation()
  return (
    <Card label={t('sheet.skills')}>
      <ul className="m-0 p-0 list-none columns-1 md:columns-2 xl:columns-1 gap-6">
        {character.skills.map(skill => (
          <li key={skill.name} className="flex items-baseline gap-2 py-1 text-sm break-inside-avoid">
            <span className={skill.proficiency === 'none' ? 'text-fs-card-line' : 'text-fs-brass'} aria-hidden="true">
              {PROFICIENCY_MARK[skill.proficiency]}
            </span>
            <span className="flex-1">{gameLabel(t, 'skill', skill.name)}</span>
            <span className="text-xs text-fs-ink-muted">{gameLabel(t, 'abilityShort', skill.ability)}</span>
            <span className="font-display w-8 text-right">
              {formatModifier(
                skillBonus(character.scores[skill.ability], skill.proficiency, character.proficiencyBonus),
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Languages and currency ───────────────────────────────────────────────────

function DetailsCard({ character, update }: { character: Character; update: (p: Partial<Character>) => void }) {
  const { t } = useTranslation()
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const coins = (['pp', 'gp', 'ep', 'sp', 'cp'] as const)
    .filter(c => character.currency[c] > 0)
    .map(c => `${character.currency[c]} ${gameLabel(t, 'currency', c)}`)

  return (
    <Card>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm items-baseline">
        <dt className="fs-section-label">{t('sheet.languages')}</dt>
        <dd className="m-0">{character.languages.map(l => gameLabel(t, 'language', l)).join(', ') || '—'}</dd>
        <dt className="fs-section-label">{t('sheet.currency')}</dt>
        <dd className="m-0">
          <button
            onClick={() => setCurrencyOpen(true)}
            className="fs-focus text-left bg-transparent border-none p-0 cursor-pointer text-fs-ink underline decoration-fs-card-line underline-offset-4 hover:decoration-fs-brass"
            title={t('sheet.editCurrency')}
          >
            {coins.join(' · ') || '—'}
          </button>
        </dd>
      </dl>
      {currencyOpen && (
        <CurrencyModal
          currency={character.currency}
          onClose={() => setCurrencyOpen(false)}
          onSave={currency => {
            update({ currency })
            setCurrencyOpen(false)
          }}
        />
      )}
    </Card>
  )
}
