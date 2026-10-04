import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { BackpackArt, BookArt, DiceArt, JournalArt, SheetArt } from './TableObjects'

export type TableObject = 'sheet' | 'spellbook' | 'inventory' | 'notes' | 'dice'

interface Props {
  character: Character
  onOpen: (object: TableObject) => void
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
export function TableView({ character, onOpen }: Props) {
  const { t } = useTranslation()
  const isCaster = character.spellcastingAbility !== null
  const spellCount = new Set([...character.knownSpells, ...character.preparedSpells]).size

  return (
    <div
      className="flex-1 min-h-0 bg-fs-table border border-fs-table-line rounded-2xl flex items-center justify-center p-6 overflow-auto"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 45%, rgba(201,154,79,0.09), transparent 65%)' }}
    >
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 md:gap-x-10 xl:gap-x-14 w-full max-w-6xl">
        <ObjectButton
          art={<SheetArt initial={character.name.toUpperCase()} />}
          title={t('table.sheet')}
          subtitle={t('table.sheetHint')}
          onClick={() => onOpen('sheet')}
        />
        {isCaster && (
          <ObjectButton
            art={<BookArt />}
            title={t('table.spellbook')}
            subtitle={t('table.spellCount', { count: spellCount })}
            onClick={() => onOpen('spellbook')}
          />
        )}
        <ObjectButton
          art={<BackpackArt />}
          title={t('table.backpack')}
          subtitle={t('inventory.catalogCount', { count: character.items.length })}
          onClick={() => onOpen('inventory')}
        />
        <ObjectButton
          art={<JournalArt label={t('table.journal')} />}
          title={t('table.journal')}
          subtitle={t('table.journalHint')}
          onClick={() => onOpen('notes')}
        />
        <ObjectButton
          art={<DiceArt />}
          title={t('table.dice')}
          subtitle={t('table.diceHint')}
          onClick={() => onOpen('dice')}
        />
      </div>
    </div>
  )
}
