import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { armorClass, formatModifier } from '@fablesheet/core'
import { gameLabel } from '../i18n/game'
import { Button } from './ui/Button'

interface Props {
  character: Character
  /** Label and action of the back button (to the table, or to all characters) */
  backLabel: string
  onBack: () => void
  onEdit: () => void
  onRest: () => void
  onLevelUp: () => void
  onStartCombat: () => void
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 min-w-12">
      <span className="font-display text-lg leading-tight text-fs-bar-text">{value}</span>
      <span className="text-[0.7rem] text-fs-bar-muted">{label}</span>
    </div>
  )
}

/** Leather bar with the character's identity and the numbers needed at every moment. */
export function CharacterHeader({ character, backLabel, onBack, onEdit, onRest, onLevelUp, onStartCombat }: Props) {
  const { t } = useTranslation()
  const { current, max, temp } = character.hp
  const percent = Math.max(0, Math.min(100, (current / max) * 100))
  const hpColor = percent > 50 ? 'bg-fs-good' : percent > 25 ? 'bg-fs-accent' : 'bg-fs-danger'

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-fs-bar border border-fs-bar-line rounded-fs px-3 py-2.5 font-ui">
      <Button onBar variant="ghost" size="sm" onClick={onBack} aria-label={backLabel}>
        ← <span className="hidden sm:inline">{backLabel}</span>
      </Button>

      <button
        onClick={onEdit}
        title={t('select.editCharacter')}
        className="fs-focus flex items-center gap-3 min-w-0 flex-1 text-left bg-transparent border-none cursor-pointer rounded-lg p-1 -m-1 hover:bg-white/5"
      >
        <span className="size-10 shrink-0 rounded-full border-[1.5px] border-fs-accent text-fs-accent font-display text-lg flex items-center justify-center">
          {character.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg leading-tight text-fs-bar-text truncate">{character.name}</span>
          <span className="block text-xs text-fs-bar-muted truncate">
            {t('sheet.subtitle', {
              race: gameLabel(t, 'race', character.race),
              className: gameLabel(t, 'class', character.className),
              level: character.level,
            })}
          </span>
        </span>
      </button>

      <div className="flex items-center">
        <Stat label={t('sheet.ac')} value={String(armorClass(character))} />
        <Stat label={t('sheet.initiative')} value={formatModifier(character.initiativeBonus)} />
        <Stat label={t('sheet.speed')} value={String(character.speed)} />
        <div className="w-32 px-3" aria-label={t('sheet.hitPoints')}>
          <div className="flex justify-between text-[0.7rem] text-fs-bar-muted">
            <span>{t('select.hp')}</span>
            <span className="text-fs-bar-text">
              {current} / {max}
              {temp > 0 && <span className="text-fs-accent"> +{temp}</span>}
            </span>
          </div>
          <div className="h-1.5 mt-1.5 rounded-full bg-fs-bar-line overflow-hidden">
            <div className={`h-full rounded-full transition-[width] ${hpColor}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
        {!character.combat && (
          <Button
            onBar
            size="sm"
            onClick={onStartCombat}
            title={t('combat.start')}
            aria-label={t('combat.start')}
            className="mr-2"
          >
            ⚔<span className="hidden lg:inline"> {t('combat.short')}</span>
          </Button>
        )}
        {character.level < 20 && (
          <Button
            onBar
            size="sm"
            onClick={onLevelUp}
            title={t('levelUp.button')}
            aria-label={t('levelUp.button')}
            className="mr-2"
          >
            ▲<span className="hidden lg:inline"> {t('levelUp.short')}</span>
          </Button>
        )}
        <Button onBar variant="primary" size="sm" onClick={onRest}>
          {t('table.rest')}
        </Button>
      </div>
    </header>
  )
}
