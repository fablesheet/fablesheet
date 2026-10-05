import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, RollResult } from '@fablesheet/core'
import { endConcentration, formatModifier, rollD20, savingThrowBonus } from '@fablesheet/core'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface Props {
  character: Character
  dc: number
  onResolve: (updated: Character) => void
}

/** After taking damage: Constitution save to keep concentrating. */
export function ConcentrationCheckDialog({ character, dc, onResolve }: Props) {
  const { t } = useTranslation()
  const [roll, setRoll] = useState<RollResult | null>(null)
  const bonus = savingThrowBonus(
    character.scores.constitution,
    character.savingThrowProficiencies.includes('constitution'),
    character.proficiencyBonus,
  )
  const success = roll ? roll.total >= dc : null
  const keep = () => onResolve(character)
  const lose = () => onResolve(endConcentration(character))

  return (
    <Dialog
      title={t('combat.concentrationCheck')}
      onClose={keep}
      footer={
        <>
          <Button variant={success === false ? 'primary' : 'secondary'} onClick={lose}>
            {t('combat.concentrationLost')}
          </Button>
          <Button variant={success === false ? 'secondary' : 'primary'} onClick={keep}>
            {t('combat.concentrationKept')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <p className="m-0">
          {t('combat.concentrationCheckText', {
            spell: character.concentration,
            dc,
            bonus: formatModifier(bonus),
          })}
        </p>
        <div className="flex items-center gap-4">
          <Button onClick={() => setRoll(rollD20(bonus, 'normal', t('combat.concentrationCheck')))}>
            🎲 {t('combat.rollSave')}
          </Button>
          {roll && (
            <span role="status" className="flex items-baseline gap-2">
              <span className={`font-display text-3xl ${success ? 'text-fs-good' : 'text-fs-danger'}`}>
                {roll.total}
              </span>
              <span className="text-fs-ink-muted">{success ? t('combat.saveSuccess') : t('combat.saveFailure')}</span>
            </span>
          )}
        </div>
      </div>
    </Dialog>
  )
}
