import { useTranslation } from 'react-i18next'
import type { GameSystemUI } from '../systems/types'
import { Button } from './ui/Button'

interface Props {
  systems: readonly GameSystemUI[]
  onPick: (system: GameSystemUI) => void
  onCancel: () => void
}

/** First step of a new character: which game is it for? */
export function SystemPicker({ systems, onPick, onCancel }: Props) {
  const { t } = useTranslation()
  return (
    <div className="w-full h-full flex flex-col gap-3 bg-fs-bg p-3 font-ui overflow-hidden animate-fade-in">
      <header className="flex items-center gap-3 bg-fs-bar border border-fs-bar-line rounded-fs px-3 py-2.5">
        <Button onBar variant="ghost" size="sm" onClick={onCancel}>
          ✕ <span className="hidden sm:inline">{t('builder.cancel')}</span>
        </Button>
        <h1 className="flex-1 font-display text-lg font-medium m-0 text-fs-bar-text">{t('systems.pick')}</h1>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto bg-fs-table border border-fs-table-line rounded-2xl p-6">
        <ul className="m-0 p-0 list-none grid gap-4 max-w-4xl mx-auto grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {systems.map(system => (
            <li key={system.definition.id}>
              <button
                onClick={() => onPick(system)}
                className="fs-focus w-full h-full text-left flex flex-col gap-2 p-5 bg-fs-card text-fs-ink border border-fs-card-line rounded-fs cursor-pointer transition-transform hover:-translate-y-1"
              >
                <span className="font-display text-lg">{system.name(t)}</span>
                <span className="text-sm text-fs-ink-muted">{system.description(t)}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
