import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { addTimedEffect, ROUNDS_PER_MINUTE } from '@fablesheet/core'
import { gameLabel } from '../../i18n/game'
import { CONDITIONS } from '../sheet/conditions'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface Props {
  character: Character
  onAdd: (updated: Character) => void
  onClose: () => void
}

const inputCls =
  'fs-focus min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted'

/** Adds a condition or any other effect that lasts a number of rounds. */
export function EffectDialog({ character, onAdd, onClose }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [rounds, setRounds] = useState(ROUNDS_PER_MINUTE)
  const isCondition = (CONDITIONS as readonly string[]).includes(name)
  const valid = name.trim() !== '' && rounds >= 1

  return (
    <Dialog
      title={t('combat.addEffect')}
      onClose={onClose}
      width="min(94vw, 520px)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onAdd(
                addTimedEffect(
                  character,
                  { name: name.trim(), roundsLeft: rounds, condition: isCondition },
                  crypto.randomUUID(),
                ),
              )
            }
          >
            {t('combat.add')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-xs text-fs-ink-muted">
          {t('combat.effectName')}
          <input
            autoFocus
            value={isCondition ? gameLabel(t, 'condition', name) : name}
            onChange={e => setName(e.target.value)}
            placeholder={t('combat.effectPlaceholder')}
            className={inputCls}
          />
        </label>
        <div className="flex flex-wrap gap-1.5" aria-label={t('sheet.conditions')}>
          {CONDITIONS.filter(c => !c.startsWith('Exhaustion')).map(c => (
            <button
              key={c}
              type="button"
              aria-pressed={name === c}
              onClick={() => setName(c)}
              className={[
                'fs-focus text-xs px-2.5 py-1.5 min-h-8 rounded-full border cursor-pointer transition-colors',
                name === c
                  ? 'bg-fs-accent/15 border-fs-brass text-fs-ink'
                  : 'bg-fs-tile border-fs-card-line text-fs-ink-muted hover:border-fs-brass',
              ].join(' ')}
            >
              {gameLabel(t, 'condition', c)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            {t('combat.duration')}
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={rounds}
              onChange={e => setRounds(Math.floor(Number(e.target.value)))}
              className={`${inputCls} w-20`}
            />
            {t('combat.rounds')}
          </label>
          {[1, ROUNDS_PER_MINUTE, ROUNDS_PER_MINUTE * 10].map(n => (
            <Button key={n} size="sm" variant={rounds === n ? 'secondary' : 'ghost'} onClick={() => setRounds(n)}>
              {n === 1
                ? t('combat.oneRound')
                : n === ROUNDS_PER_MINUTE
                  ? t('combat.oneMinute')
                  : t('combat.tenMinutes')}
            </Button>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
