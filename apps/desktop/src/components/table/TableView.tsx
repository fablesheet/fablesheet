import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterBase } from '@fablesheet/core'
import type { GameSystemUI } from '../../systems/types'
import { FeatureTokens } from './FeatureTokens'
import { DiceArt } from './TableObjects'

/** The dice tray is on every table, whatever the system */
export const DICE_OBJECT = 'dice'

interface Props<C extends CharacterBase> {
  character: C
  system: GameSystemUI<C>
  onOpen: (objectId: string) => void
  onUpdate: (c: C) => void
}

function ObjectButton({
  art,
  title,
  subtitle,
  onClick,
}: {
  art: ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="fs-focus group flex flex-col items-center justify-end gap-3 p-4 w-40 md:w-48 rounded-fs bg-transparent border-none cursor-pointer min-h-56 xl:min-h-72"
    >
      <span className="transition-transform duration-200 group-hover:-translate-y-1.5 group-active:translate-y-0">
        <span className="block md:scale-125 xl:scale-150 origin-bottom">{art}</span>
      </span>
      <span className="text-center">
        <span className="block font-display text-base text-fs-bar-text">{title}</span>
        <span className="block font-ui text-xs text-fs-bar-muted">{subtitle}</span>
      </span>
    </button>
  )
}

/** The character's table: every part of the character is an object you pick up. */
export function TableView<C extends CharacterBase>({ character, system, onOpen, onUpdate }: Props<C>) {
  const { t } = useTranslation()

  return (
    <div
      className="flex-1 min-h-0 bg-fs-table border border-fs-table-line rounded-2xl flex flex-col items-center justify-center gap-8 p-6 overflow-auto"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 45%, rgba(201,154,79,0.09), transparent 65%)' }}
    >
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 md:gap-x-10 xl:gap-x-14 w-full max-w-6xl">
        {system.tableObjects(character, t).map(o => (
          <ObjectButton key={o.id} art={o.art} title={o.title} subtitle={o.subtitle} onClick={() => onOpen(o.id)} />
        ))}
        <ObjectButton
          art={<DiceArt />}
          title={t('table.dice')}
          subtitle={t('table.diceHint')}
          onClick={() => onOpen(DICE_OBJECT)}
        />
      </div>
      <FeatureTokens character={character} system={system} onUpdate={onUpdate} />
    </div>
  )
}
