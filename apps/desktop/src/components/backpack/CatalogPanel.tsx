import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Item, ItemCategory } from '@fablesheet/core'
import { ITEM_CATALOG } from '@fablesheet/srd-data'
import { gameLabel } from '../../i18n/game'
import { Drawer } from '../ui/Drawer'
import { inputCls } from './styles'
import { CATEGORY_ICON, RARITY_COLOR } from './rarity'

const FILTERS: Array<ItemCategory | 'all'> = [
  'all',
  'Weapon',
  'Armor',
  'Adventuring Gear',
  'Tool',
  'Potion',
  'Container',
  'Ammunition',
  'Magic Item',
]

interface Props {
  onAdd: (item: Omit<Item, 'id'>) => void
  onClose: () => void
}

/** The merchant: SRD equipment to add to the backpack. */
export function CatalogPanel({ onAdd, onClose }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')
  const [added, setAdded] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const items = ITEM_CATALOG.filter(
    i => (category === 'all' || i.category === category) && (!q || i.name.toLowerCase().includes(q)),
  )

  return (
    <Drawer title={t('inventory.catalog')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('inventory.searchItems')}
          aria-label={t('inventory.searchItems')}
          className={inputCls}
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`fs-focus min-h-8 px-2.5 text-xs rounded-md border cursor-pointer ${category === c ? 'bg-fs-accent text-fs-on-accent border-transparent' : 'bg-transparent text-fs-ink-muted border-fs-card-line hover:text-fs-ink'}`}
            >
              {c === 'all' ? t('common.all') : gameLabel(t, 'itemCategory', c)}
            </button>
          ))}
        </div>
        <p className="text-xs text-fs-ink-muted m-0">{t('inventory.catalogHint')}</p>
        <ul className="m-0 p-0 list-none -mx-2">
          {items.length === 0 && (
            <li className="text-sm italic text-fs-ink-muted text-center py-6">{t('inventory.noCatalogMatches')}</li>
          )}
          {items.map(item => (
            <li key={item.name}>
              <button
                onClick={() => {
                  onAdd(item)
                  setAdded(item.name)
                }}
                className="fs-focus w-full flex items-center gap-3 px-2 py-2 min-h-11 rounded-md bg-transparent border-none cursor-pointer text-left text-sm text-fs-ink hover:bg-fs-hover"
              >
                <span className="w-5 text-center text-fs-brass" aria-hidden="true">
                  {CATEGORY_ICON[item.category]}
                </span>
                <span
                  className="flex-1 min-w-0 truncate"
                  style={item.rarity && item.rarity !== 'Common' ? { color: RARITY_COLOR[item.rarity] } : undefined}
                >
                  {item.name}
                  {item.requiresAttunement && <span className="text-xs text-fs-ink-muted"> ✧</span>}
                </span>
                <span className="text-xs text-fs-ink-muted w-12 text-right">
                  {item.weight > 0 ? `${item.weight} lb` : '—'}
                </span>
                <span className="text-xs text-fs-ink-muted w-16 text-right">
                  {item.rarity && item.value === 0
                    ? gameLabel(t, 'rarity', item.rarity)
                    : item.value >= 1
                      ? `${item.value} ${gameLabel(t, 'currency', 'gp')}`
                      : `${Math.round(item.value * 100)} ${gameLabel(t, 'currency', 'cp')}`}
                </span>
                <span className={`w-6 text-center ${added === item.name ? 'text-fs-good' : 'text-fs-brass'}`}>
                  {added === item.name ? '✓' : '+'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  )
}
