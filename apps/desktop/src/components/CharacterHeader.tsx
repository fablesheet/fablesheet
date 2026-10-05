import { useTranslation } from 'react-i18next'
import type { CharacterBase } from '@fablesheet/core'
import type { GameSystemUI } from '../systems/types'
import { Button } from './ui/Button'

interface Props<C extends CharacterBase> {
  character: C
  system: GameSystemUI<C>
  onUpdate: (character: C) => void
  /** Label and action of the back button (to the table, or to all characters) */
  backLabel: string
  onBack: () => void
  onEdit: () => void
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
export function CharacterHeader<C extends CharacterBase>({
  character,
  system,
  onUpdate,
  backLabel,
  onBack,
  onEdit,
  onStartCombat,
}: Props<C>) {
  const { t } = useTranslation()
  const hp = system.hitPoints(character)
  const percent = hp ? Math.max(0, Math.min(100, (hp.current / hp.max) * 100)) : 0
  const hpColor = percent > 50 ? 'bg-fs-good' : percent > 25 ? 'bg-fs-accent' : 'bg-fs-danger'
  const { HeaderActions } = system

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
          <span className="block text-xs text-fs-bar-muted truncate">{system.subtitle(character, t)}</span>
        </span>
      </button>

      <div className="flex items-center">
        {system.headerStats(character, t).map(s => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
        {hp && (
          <div className="w-32 px-3" aria-label={t('sheet.hitPoints')}>
            <div className="flex justify-between text-[0.7rem] text-fs-bar-muted">
              <span>{t('select.hp')}</span>
              <span className="text-fs-bar-text">
                {hp.current} / {hp.max}
                {hp.temp > 0 && <span className="text-fs-accent"> +{hp.temp}</span>}
              </span>
            </div>
            <div className="h-1.5 mt-1.5 rounded-full bg-fs-bar-line overflow-hidden">
              <div className={`h-full rounded-full transition-[width] ${hpColor}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
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
        {HeaderActions && <HeaderActions character={character} onUpdate={onUpdate} />}
      </div>
    </header>
  )
}
