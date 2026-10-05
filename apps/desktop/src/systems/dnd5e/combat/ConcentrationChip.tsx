import { useTranslation } from 'react-i18next'
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import { endConcentration } from '@fablesheet/dnd5e'
import type { CharacterViewProps } from '../../types'

/** Concentration in the combat bar, with a button to end it. */
export function ConcentrationChip({ character, onUpdate }: CharacterViewProps<Dnd5eCharacter>) {
  const { t } = useTranslation()
  const spell = character.concentration
  if (!spell) return null
  return (
    <span
      className="flex items-center gap-1.5 min-h-9 pl-3 pr-1 rounded-full border border-fs-accent text-sm"
      title={t('combat.concentratingOn', { spell })}
    >
      <span aria-hidden="true">◎</span>
      <span className="text-xs text-fs-bar-muted">{t('combat.concentration')}</span>
      {spell}
      <button
        type="button"
        onClick={() => onUpdate(endConcentration(character))}
        aria-label={t('combat.endConcentration')}
        className="fs-focus size-7 rounded-full bg-transparent border-none text-fs-bar-muted hover:text-fs-bar-text cursor-pointer"
      >
        ✕
      </button>
    </span>
  )
}
