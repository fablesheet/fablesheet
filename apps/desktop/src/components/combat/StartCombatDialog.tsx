import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterBase, RollMode, RollResult } from '@fablesheet/core'
import { formatModifier, rollD20, startCombat } from '@fablesheet/core'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Segmented } from '../ui/Segmented'

interface Props<C extends CharacterBase> {
  character: C
  /** Initiative modifier from the game system */
  initiativeModifier: number
  onStart: (updated: C) => void
  onClose: () => void
}

/** Roll initiative in the app or enter a roll from the table, then start the combat. */
export function StartCombatDialog<C extends CharacterBase>({
  character,
  initiativeModifier,
  onStart,
  onClose,
}: Props<C>) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<RollMode>('normal')
  const [roll, setRoll] = useState<RollResult | null>(null)
  const [manual, setManual] = useState('')
  const manualValue = manual.trim() === '' ? null : Math.floor(Number(manual))
  const initiative = manualValue !== null && Number.isFinite(manualValue) ? manualValue : (roll?.total ?? null)

  return (
    <Dialog
      title={t('combat.start')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={initiative === null}
            onClick={() => initiative !== null && onStart(startCombat(character, initiative))}
          >
            ⚔ {t('combat.begin')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2.5">
          <h3 className="fs-section-label m-0 font-normal">
            {t('combat.initiative')} ({formatModifier(initiativeModifier)})
          </h3>
          <Segmented
            label={t('dice.mode')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'normal', label: t('dice.normal') },
              { value: 'advantage', label: t('dice.advantage') },
              { value: 'disadvantage', label: t('dice.disadvantage') },
            ]}
          />
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                setManual('')
                setRoll(rollD20(initiativeModifier, mode, t('combat.initiative')))
              }}
            >
              🎲 {t('combat.rollInitiative')}
            </Button>
            {roll && manualValue === null && (
              <span className="flex items-baseline gap-2" role="status">
                <span className="font-display text-3xl text-fs-brass">{roll.total}</span>
                <span className="text-xs text-fs-ink-muted">
                  {roll.dice.map(d => (d.dropped ? `(${d.value})` : d.value)).join(' / ')}{' '}
                  {formatModifier(roll.modifier)}
                </span>
              </span>
            )}
          </div>
        </section>
        <label className="flex flex-col gap-1 text-xs text-fs-ink-muted">
          {t('combat.manualInitiative')}
          <input
            type="number"
            inputMode="numeric"
            value={manual}
            onChange={e => setManual(e.target.value)}
            className="fs-focus w-28 min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3"
          />
        </label>
      </div>
    </Dialog>
  )
}
