import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

/** Tokens for features with limited uses, ready on the table: tap to spend one. */
export function FeatureTokens({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const tokens = character.features
    .map((f, index) => ({ f, index }))
    .filter(({ f }) => f.usesMax !== null && f.usesCurrent !== null)
  if (tokens.length === 0) return null

  const spend = (index: number) =>
    onUpdate({
      ...character,
      features: character.features.map((f, i) =>
        i === index && f.usesCurrent !== null ? { ...f, usesCurrent: Math.max(0, f.usesCurrent - 1) } : f,
      ),
    })

  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-4xl" aria-label={t('features.tokens')}>
      {tokens.map(({ f, index }) => {
        const empty = f.usesCurrent === 0
        return (
          <button
            key={`${f.source}/${f.name}`}
            type="button"
            disabled={empty}
            onClick={() => spend(index)}
            title={t('features.useOne', { name: f.name })}
            aria-label={t('features.tokenLabel', { name: f.name, current: f.usesCurrent, max: f.usesMax })}
            className={[
              'fs-focus flex items-center gap-2 min-h-11 px-4 rounded-full border font-ui text-sm transition-colors',
              empty
                ? 'border-fs-bar-line text-fs-bar-muted bg-transparent cursor-not-allowed opacity-60'
                : 'border-fs-brass bg-fs-bar text-fs-bar-text cursor-pointer hover:border-fs-accent active:scale-95',
            ].join(' ')}
          >
            <span className="size-2.5 rotate-45 border-[1.5px] border-fs-accent bg-fs-accent" aria-hidden="true" />
            <span className="font-display">{f.name}</span>
            <span className={empty ? '' : 'text-fs-accent'}>
              {f.usesCurrent}/{f.usesMax}
            </span>
          </button>
        )
      })}
    </div>
  )
}
