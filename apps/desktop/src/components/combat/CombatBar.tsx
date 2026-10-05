import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterBase } from '@fablesheet/core'
import { endCombat, nextRound, removeTimedEffect, toggleAction } from '@fablesheet/core'
import type { GameSystemUI } from '../../systems/types'
import { Button } from '../ui/Button'
import { EffectDialog } from './EffectDialog'

interface Props<C extends CharacterBase> {
  character: C
  system: GameSystemUI<C>
  onUpdate: (c: C) => void
}

const chip = 'flex items-center gap-1.5 min-h-9 pl-3 pr-1 rounded-full border text-sm'

/** Strip under the header during combat (or for system states such as concentration): rounds, actions, effects. */
export function CombatBar<C extends CharacterBase>({ character, system, onUpdate }: Props<C>) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const { combat } = character
  const { BarExtras, showBarOutsideCombat } = system.combat
  if (!combat && !showBarOutsideCombat?.(character)) return null

  return (
    <section
      aria-label={t('combat.title')}
      className="flex flex-wrap items-center gap-2 bg-fs-bar border border-fs-brass/60 rounded-fs px-3 py-2 font-ui text-fs-bar-text animate-fade-in"
    >
      {combat && (
        <>
          <span className="flex items-baseline gap-2 pr-2">
            <span className="font-display text-lg">⚔ {t('combat.round', { round: combat.round })}</span>
            <span className="text-xs text-fs-bar-muted">
              {t('combat.initiativeShort', { value: combat.initiative })}
            </span>
          </span>
          <span className="flex gap-1" role="group" aria-label={t('combat.actions')}>
            {system.combat.actions(t).map(action => {
              const spent = combat.spentActions.includes(action.id)
              return (
                <button
                  key={action.id}
                  type="button"
                  aria-pressed={spent}
                  onClick={() => onUpdate(toggleAction(character, action.id))}
                  title={spent ? t('combat.used') : t('combat.available')}
                  className={[
                    'fs-focus min-h-9 px-3 rounded-full border text-xs cursor-pointer transition-colors',
                    spent
                      ? 'border-fs-bar-line text-fs-bar-muted line-through bg-transparent'
                      : 'border-fs-accent text-fs-bar-text bg-fs-accent/15',
                  ].join(' ')}
                >
                  {action.label}
                </button>
              )
            })}
          </span>
          {combat.effects.map(e => (
            <span key={e.id} className={`${chip} border-fs-bar-line`}>
              {e.condition ? system.combat.conditionLabel(t, e.name) : e.name}
              <span className="text-xs text-fs-accent">{t('combat.roundsLeft', { count: e.roundsLeft })}</span>
              <button
                type="button"
                onClick={() => onUpdate(removeTimedEffect(character, e.id))}
                aria-label={t('combat.removeEffect', { name: e.name })}
                className="fs-focus size-7 rounded-full bg-transparent border-none text-fs-bar-muted hover:text-fs-bar-text cursor-pointer"
              >
                ✕
              </button>
            </span>
          ))}
          <Button onBar size="sm" variant="ghost" onClick={() => setAdding(true)}>
            + {t('combat.effect')}
          </Button>
        </>
      )}

      {BarExtras && <BarExtras character={character} onUpdate={onUpdate} />}

      {combat && (
        <span className="flex gap-2 ml-auto">
          <Button
            onBar
            size="sm"
            variant={confirmEnd ? 'danger' : 'ghost'}
            onClick={() => {
              if (confirmEnd) onUpdate(endCombat(character))
              setConfirmEnd(c => !c)
            }}
            onBlur={() => setConfirmEnd(false)}
          >
            {confirmEnd ? t('combat.confirmEnd') : t('combat.end')}
          </Button>
          <Button onBar size="md" variant="primary" onClick={() => onUpdate(nextRound(character))}>
            {t('combat.nextRound')} ▸
          </Button>
        </span>
      )}

      {adding && (
        <EffectDialog
          character={character}
          conditions={system.combat.conditions}
          conditionLabel={c => system.combat.conditionLabel(t, c)}
          onClose={() => setAdding(false)}
          onAdd={updated => {
            onUpdate(updated)
            setAdding(false)
          }}
        />
      )}
    </section>
  )
}
