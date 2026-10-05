import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { isItemUsable, spendCharge } from '@fablesheet/core'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

interface Token {
  key: string
  name: string
  current: number
  max: number
  /** Magic item charges are drawn as a round token, feature uses as a diamond */
  item: boolean
  spend: () => Character
}

/**
 * Tokens for features with limited uses and magic items with charges, ready on the
 * table: tap to spend one.
 */
export function FeatureTokens({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const tokens: Token[] = [
    ...character.features.flatMap((f, index) =>
      f.usesMax !== null && f.usesCurrent !== null
        ? [
            {
              key: `feature/${f.source}/${f.name}`,
              name: f.name,
              current: f.usesCurrent,
              max: f.usesMax,
              item: false,
              spend: () => ({
                ...character,
                features: character.features.map((g, i) =>
                  i === index && g.usesCurrent !== null ? { ...g, usesCurrent: Math.max(0, g.usesCurrent - 1) } : g,
                ),
              }),
            },
          ]
        : [],
    ),
    ...character.items
      .filter(i => i.charges && isItemUsable(i))
      .map(i => ({
        key: `item/${i.id}`,
        name: i.name,
        current: i.charges!.current,
        max: i.charges!.max,
        item: true,
        spend: () => spendCharge(character, i.id),
      })),
  ]
  if (tokens.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-4xl" aria-label={t('features.tokens')}>
      {tokens.map(token => {
        const empty = token.current === 0
        return (
          <button
            key={token.key}
            type="button"
            disabled={empty}
            onClick={() => onUpdate(token.spend())}
            title={t('features.useOne', { name: token.name })}
            aria-label={t('features.tokenLabel', { name: token.name, current: token.current, max: token.max })}
            className={[
              'fs-focus flex items-center gap-2 min-h-11 px-4 rounded-full border font-ui text-sm transition-colors',
              empty
                ? 'border-fs-bar-line text-fs-bar-muted bg-transparent cursor-not-allowed opacity-60'
                : 'border-fs-brass bg-fs-bar text-fs-bar-text cursor-pointer hover:border-fs-accent active:scale-95',
            ].join(' ')}
          >
            <span
              className={`size-2.5 border-[1.5px] border-fs-accent bg-fs-accent ${token.item ? 'rounded-full' : 'rotate-45'}`}
              aria-hidden="true"
            />
            <span className="font-display">{token.name}</span>
            <span className={empty ? '' : 'text-fs-accent'}>
              {token.current}/{token.max}
            </span>
          </button>
        )
      })}
    </div>
  )
}
