import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AbilityName, Dnd5eCharacter } from '@fablesheet/dnd5e'
import { rollDie } from '@fablesheet/core'
import {
  ABILITY_SCORE_MAX,
  abilityModifier,
  averageHitPointsPerLevel,
  formatModifier,
  hitDieSize,
  levelUp,
  spellSlotMaximums,
} from '@fablesheet/dnd5e'
import { findClass, raceHitPointsPerLevel, syncFeatures } from '@fablesheet/dnd5e-srd'
import { gameLabel } from '../../../i18n/game'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { Segmented } from '../../../components/ui/Segmented'
import { SubclassPicker } from './SubclassPicker'

const ABILITIES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

type HpMode = 'average' | 'roll'
type AsiMode = 'two' | 'split' | 'later'

interface Props {
  character: Dnd5eCharacter
  onLevelUp: (updated: Dnd5eCharacter) => void
  onClose: () => void
}

function Section({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="fs-section-label m-0 font-normal">{label}</h3>
      {hint && <p className="text-xs text-fs-ink-muted m-0 -mt-1">{hint}</p>}
      {children}
    </section>
  )
}

/** Guides through one level: hit points, subclass, ability scores, and shows what is new. */
export function LevelUpDialog({ character, onLevelUp, onClose }: Props) {
  const { t } = useTranslation()
  const next = character.level + 1
  const srd = findClass(character.className)
  const dieSize = hitDieSize(character.hitDice.die)
  const conMod = abilityModifier(character.scores.constitution)

  const [hpMode, setHpMode] = useState<HpMode>('average')
  const [rolled, setRolled] = useState<number | null>(null)
  // Also asked later if the subclass was skipped when it was due
  const needsSubclass = !!srd && next >= srd.subclassLevel && !character.subclass
  const [subclass, setSubclass] = useState(needsSubclass ? srd.subclass.name : '')
  const isAsiLevel = (srd?.asiLevels ?? DEFAULT_ASI_LEVELS).includes(next)
  const [asiMode, setAsiMode] = useState<AsiMode>('two')
  const [picked, setPicked] = useState<AbilityName[]>([])

  const hitDieResult = hpMode === 'average' ? averageHitPointsPerLevel(dieSize) : rolled
  const asiComplete = !isAsiLevel || asiMode === 'later' || picked.length === (asiMode === 'two' ? 1 : 2)
  const ready = hitDieResult !== null && asiComplete

  const abilityIncreases: Partial<Record<AbilityName, number>> = {}
  if (isAsiLevel && asiMode !== 'later') {
    for (const a of picked) abilityIncreases[a] = asiMode === 'two' ? 2 : 1
  }

  const preview = syncFeatures(
    levelUp(character, {
      hitDieResult: hitDieResult ?? 0,
      bonusHitPointsPerLevel: raceHitPointsPerLevel(character.race),
      abilityIncreases,
      ...(needsSubclass ? { subclass: subclass.trim() || null } : {}),
    }),
  )
  const newConMod = abilityModifier(preview.scores.constitution)
  const retroHp = (newConMod - conMod) * character.level
  const known = new Set(character.features.map(f => `${f.source}/${f.name}`))
  const gained = preview.features.filter(f => !known.has(`${f.source}/${f.name}`))
  const slotsBefore = spellSlotMaximums(character.className, character.level)
  const slotsAfter = spellSlotMaximums(character.className, next)
  const newSlotLevels = slotsAfter.flatMap((max, i) => (max > (slotsBefore[i] ?? 0) ? [i + 1] : []))

  function togglePick(ability: AbilityName) {
    setPicked(prev => {
      if (prev.includes(ability)) return prev.filter(a => a !== ability)
      if (asiMode === 'two') return [ability]
      return prev.length >= 2 ? [prev[1], ability] : [...prev, ability]
    })
  }

  const choiceCls = (selected: boolean, disabled = false) =>
    [
      'fs-focus rounded-lg border text-sm transition-colors min-h-11',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      selected
        ? 'bg-fs-accent/15 border-fs-brass text-fs-ink'
        : 'bg-fs-tile border-fs-card-line text-fs-ink hover:border-fs-brass',
    ].join(' ')

  return (
    <Dialog
      title={t('levelUp.title', { from: character.level, to: next })}
      onClose={onClose}
      width="min(94vw, 560px)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" disabled={!ready} onClick={() => onLevelUp(preview)}>
            {t('levelUp.confirm', { level: next })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6 max-h-[65dvh] overflow-y-auto -mx-5 px-5">
        <Section label={t('levelUp.hitPoints')}>
          <Segmented
            label={t('levelUp.hitPoints')}
            value={hpMode}
            onChange={setHpMode}
            options={[
              { value: 'average', label: t('levelUp.average', { value: averageHitPointsPerLevel(dieSize) }) },
              { value: 'roll', label: t('levelUp.roll') },
            ]}
          />
          {hpMode === 'roll' && rolled === null ? (
            <Button className="self-start" onClick={() => setRolled(rollDie(dieSize))}>
              🎲 {t('levelUp.rollDie', { die: `${t('dice.die')}${dieSize}` })}
            </Button>
          ) : (
            <p className="m-0 text-sm">
              <span className="font-display text-2xl text-fs-brass mr-2">+{preview.hp.max - character.hp.max}</span>
              <span className="text-fs-ink-muted">
                {t('levelUp.hpBreakdown', {
                  die: `${t('dice.die')}${dieSize}`,
                  value: hitDieResult,
                  con: formatModifier(newConMod),
                })}
                {retroHp > 0 && ` · ${t('levelUp.hpRetro', { value: retroHp })}`}
              </span>
            </p>
          )}
        </Section>

        {needsSubclass && (
          <Section label={t('levelUp.subclass')} hint={t('levelUp.subclassHint')}>
            <SubclassPicker srdName={srd.subclass.name} value={subclass} onChange={setSubclass} />
          </Section>
        )}

        {isAsiLevel && (
          <Section label={t('levelUp.asi')} hint={t('levelUp.asiHint')}>
            <Segmented
              label={t('levelUp.asi')}
              value={asiMode}
              onChange={mode => {
                setAsiMode(mode)
                setPicked(prev => (mode === 'two' ? prev.slice(0, 1) : prev))
              }}
              options={[
                { value: 'two', label: t('levelUp.asiTwo') },
                { value: 'split', label: t('levelUp.asiSplit') },
                { value: 'later', label: t('levelUp.asiLater') },
              ]}
            />
            {asiMode !== 'later' && (
              <div className="grid grid-cols-3 gap-2">
                {ABILITIES.map(a => {
                  const score = character.scores[a]
                  const selected = picked.includes(a)
                  const full = score >= ABILITY_SCORE_MAX
                  const after = Math.min(ABILITY_SCORE_MAX, score + (asiMode === 'two' ? 2 : 1))
                  return (
                    <button
                      key={a}
                      type="button"
                      disabled={full}
                      aria-pressed={selected}
                      onClick={() => togglePick(a)}
                      className={`${choiceCls(selected, full)} px-2 py-2 text-center`}
                    >
                      <span className="block text-xs text-fs-ink-muted">{gameLabel(t, 'ability', a)}</span>
                      <span className="block font-display text-lg">
                        {score}
                        {selected && <span className="text-fs-brass"> → {after}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </Section>
        )}

        <Section label={t('levelUp.newAtLevel', { level: next })}>
          <ul className="m-0 p-0 list-none flex flex-col gap-2 text-sm">
            {preview.proficiencyBonus !== character.proficiencyBonus && (
              <li>
                <span className="font-display">{t('sheet.proficiencyBonus')}</span>{' '}
                <span className="text-fs-brass">{formatModifier(preview.proficiencyBonus)}</span>
              </li>
            )}
            {newSlotLevels.length > 0 && (
              <li>
                <span className="font-display">{t('sheet.spellSlots')}</span>{' '}
                <span className="text-fs-ink-muted">
                  {newSlotLevels.map(level => t('sheet.slotLevel', { level })).join(', ')}
                </span>
                <span className="block text-xs text-fs-ink-muted">{t('levelUp.spellsHint')}</span>
              </li>
            )}
            {gained.map(f => (
              <li key={`${f.source}/${f.name}`} className="border-l-2 border-fs-brass pl-3">
                <span className="font-display">{f.name}</span>
                <span className="text-xs text-fs-ink-muted"> · {gameLabel(t, 'class', f.source)}</span>
                <span className="block text-fs-ink-muted">{f.description}</span>
              </li>
            ))}
            {!srd && <li className="text-fs-ink-muted">{t('levelUp.unknownClass')}</li>}
            {srd && gained.length === 0 && newSlotLevels.length === 0 && (
              <li className="text-fs-ink-muted">{t('levelUp.nothingNew')}</li>
            )}
          </ul>
        </Section>
      </div>
    </Dialog>
  )
}
