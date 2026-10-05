import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, Item } from '@fablesheet/core'
import { ATTUNEMENT_LIMIT, armorClass, attunedCount, carryingLimits, weaponAttack } from '@fablesheet/core'
import { gameLabel } from '../../i18n/game'
import { openJsonFile, saveJsonFile } from '../../services/files'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CatalogPanel } from './CatalogPanel'
import { ItemEditor } from './ItemEditor'
import { CATEGORIES, parseItemList } from './itemImport'
import { CATEGORY_ICON, RARITY_COLOR } from './rarity'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

const BLANK: Omit<Item, 'id'> = {
  name: '',
  category: 'Adventuring Gear',
  description: '',
  quantity: 1,
  weight: 0,
  value: 0,
  equipped: false,
  rarity: null,
  requiresAttunement: false,
  isAttuned: false,
  notes: '',
}

export function BackpackView({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const items = character.items
  const [editing, setEditing] = useState<Item | 'new' | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  // Equipped armor and shields determine the armor class
  const saveItems = (next: Item[]) =>
    onUpdate({ ...character, items: next, ac: armorClass({ ...character, items: next }) })

  const totalWeight = items.reduce((sum, i) => sum + i.weight * i.quantity, 0)
  const { capacity, encumberedAt, heavilyEncumberedAt } = carryingLimits(character.scores.strength)
  const loadPercent = Math.min(100, (totalWeight / capacity) * 100)
  const loadColor =
    totalWeight > heavilyEncumberedAt ? 'bg-fs-danger' : totalWeight > encumberedAt ? 'bg-fs-accent' : 'bg-fs-good'

  const equipped = items.filter(i => i.equipped)
  const packed = items.filter(i => !i.equipped)

  function toggleEquipped(item: Item) {
    saveItems(items.map(i => (i.id === item.id ? { ...i, equipped: !i.equipped } : i)))
  }

  async function importItems() {
    setMessage(null)
    try {
      const raw = await openJsonFile()
      if (raw === null) return
      const imported = parseItemList(raw, t('inventory.unnamedItem'))
      if (imported.length === 0) return setMessage({ text: t('inventory.noValidItems'), error: true })
      const existing = new Set(items.map(i => i.id))
      const fresh = imported.filter(i => !existing.has(i.id))
      saveItems([...items, ...fresh])
      setMessage({ text: t('inventory.imported', { count: fresh.length }), error: false })
    } catch (e) {
      setMessage({ text: e instanceof SyntaxError ? t('inventory.invalidJson') : String(e), error: true })
    }
  }

  function exportItems() {
    saveJsonFile(`${character.name.replace(/\s+/g, '_')}-inventory.json`, items).catch(e =>
      setMessage({ text: t('inventory.exportFailed', { error: String(e) }), error: true }),
    )
  }

  /** One-line combat summary for equipped weapons and armor */
  function statLine(item: Item): string | null {
    if (item.armor) {
      return item.armor.type === 'shield'
        ? t('inventory.acRule_shield', { ac: item.armor.baseAc })
        : t(`inventory.acRule_${item.armor.type}`, { ac: item.armor.baseAc })
    }
    const attack = weaponAttack(character, item)
    if (attack?.damage)
      return `${attack.damage}${attack.damageType ? ` ${gameLabel(t, 'damageType', attack.damageType)}` : ''}`
    return null
  }

  const tile = (item: Item) => (
    <li key={item.id} className="relative">
      <button
        onClick={() => setEditing(item)}
        className="fs-focus w-full h-full flex items-start gap-3 text-left p-3 pr-11 min-h-16 rounded-lg bg-fs-tile border border-fs-card-line cursor-pointer hover:border-fs-brass"
      >
        <span className="text-lg leading-none text-fs-brass mt-0.5" aria-hidden="true">
          {CATEGORY_ICON[item.category]}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block text-sm truncate"
            style={item.rarity && item.rarity !== 'Common' ? { color: RARITY_COLOR[item.rarity] } : undefined}
          >
            {item.name}
            {item.quantity > 1 && <span className="text-fs-ink-muted"> ×{item.quantity}</span>}
          </span>
          <span className="block text-xs text-fs-ink-muted truncate">
            {item.requiresAttunement && (
              <span className={item.isAttuned ? 'text-fs-brass' : ''}>
                {item.isAttuned ? `✧ ${t('magic.attuned')} · ` : `${t('magic.notAttuned')} · `}
              </span>
            )}
            {item.charges && `${t('magic.chargesShort', { current: item.charges.current, max: item.charges.max })} · `}
            {(item.equipped && statLine(item)) || gameLabel(t, 'itemCategory', item.category)}
            {item.weight > 0 && ` · ${+(item.weight * item.quantity).toFixed(1)} lb`}
          </span>
        </span>
      </button>
      <button
        onClick={() => toggleEquipped(item)}
        aria-pressed={item.equipped}
        title={item.equipped ? t('inventory.equippedToggle') : t('inventory.unequippedToggle')}
        aria-label={item.equipped ? t('inventory.equippedToggle') : t('inventory.unequippedToggle')}
        className={`fs-focus absolute top-2 right-2 size-8 rounded-md border-none cursor-pointer bg-transparent hover:bg-fs-hover ${item.equipped ? 'text-fs-good' : 'text-fs-card-line'}`}
      >
        ◉
      </button>
    </li>
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll">
      <div className="flex flex-col gap-3 pb-4">
        {/* Toolbar and carrying capacity */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-56 bg-fs-bar border border-fs-bar-line rounded-fs px-4 py-2.5">
            <div className="flex justify-between text-xs text-fs-bar-muted">
              <span>{t('inventory.carrying')}</span>
              <span className="text-fs-bar-text">
                {+totalWeight.toFixed(1)} / {capacity} lb
                {totalWeight > encumberedAt && (
                  <span className="text-fs-accent">
                    {' '}
                    · {totalWeight > heavilyEncumberedAt ? t('inventory.heavilyEncumbered') : t('inventory.encumbered')}
                  </span>
                )}
              </span>
            </div>
            {/* The backpack strap */}
            <div className="h-2 mt-2 rounded-full bg-fs-bar-line overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] ${loadColor}`}
                style={{ width: `${loadPercent}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onBar onClick={importItems}>
              {t('inventory.import')}
            </Button>
            {items.length > 0 && (
              <Button onBar onClick={exportItems}>
                {t('inventory.export')}
              </Button>
            )}
            <Button onBar onClick={() => setCatalogOpen(true)}>
              {t('inventory.browseCatalog')}
            </Button>
            <Button onBar variant="primary" onClick={() => setEditing('new')}>
              {t('inventory.addItem')}
            </Button>
          </div>
        </div>
        {message && (
          <p role="status" className={`m-0 text-sm ${message.error ? 'text-fs-danger' : 'text-fs-good'}`}>
            {message.text}
          </p>
        )}

        {/* Worn and wielded */}
        <Card
          label={t('inventory.onBody')}
          action={
            <span className="text-sm text-fs-ink-muted">
              {attunedCount(items) > 0 &&
                `${t('magic.attunementCount', { count: attunedCount(items), limit: ATTUNEMENT_LIMIT })} · `}
              {t('sheet.ac')} {armorClass(character)}
            </span>
          }
        >
          {equipped.length === 0 ? (
            <p className="m-0 text-sm italic text-fs-ink-muted">{t('inventory.nothingEquipped')}</p>
          ) : (
            <ul className="m-0 p-0 list-none grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {equipped.map(tile)}
            </ul>
          )}
        </Card>

        {/* In the backpack, grouped by category */}
        <Card label={t('inventory.inBackpack')}>
          {packed.length === 0 ? (
            <p className="m-0 text-sm italic text-fs-ink-muted">
              {t('inventory.empty')} {t('inventory.emptyHint')}
            </p>
          ) : (
            CATEGORIES.filter(c => packed.some(i => i.category === c)).map(c => (
              <div key={c} className="mb-3 last:mb-0">
                <div className="text-xs text-fs-ink-muted mb-1.5">
                  {gameLabel(t, 'itemCategory', c)} ({packed.filter(i => i.category === c).length})
                </div>
                <ul className="m-0 p-0 list-none grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                  {packed.filter(i => i.category === c).map(tile)}
                </ul>
              </div>
            ))
          )}
        </Card>
      </div>

      {editing && (
        <ItemEditor
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? BLANK : editing}
          isNew={editing === 'new'}
          attunedElsewhere={attunedCount(items.filter(i => editing === 'new' || i.id !== editing.id))}
          onClose={() => setEditing(null)}
          onSave={draft => {
            saveItems(
              editing === 'new'
                ? [...items, { ...draft, id: crypto.randomUUID() }]
                : items.map(i => (i.id === editing.id ? { ...draft, id: editing.id } : i)),
            )
            setEditing(null)
          }}
          onRemove={() => {
            if (editing !== 'new') saveItems(items.filter(i => i.id !== editing.id))
            setEditing(null)
          }}
        />
      )}
      {catalogOpen && (
        <CatalogPanel
          onClose={() => setCatalogOpen(false)}
          onAdd={item => saveItems([...items, { ...item, id: crypto.randomUUID() }])}
        />
      )}
    </div>
  )
}
