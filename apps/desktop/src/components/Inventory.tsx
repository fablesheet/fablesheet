import { useState, useRef } from 'react'
import type { Character, Item, ItemCategory, ItemRarity } from '@fablesheet/core'
import { carryingLimits } from '@fablesheet/core'
import { ITEM_CATALOG } from '@fablesheet/srd-data'

interface Props {
  character: Character
  onBack: () => void
  onUpdate: (c: Character) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: ItemCategory[] = [
  'Weapon',
  'Armor',
  'Adventuring Gear',
  'Tool',
  'Potion',
  'Scroll',
  'Container',
  'Valuable',
  'Ammunition',
  'Magic Item',
  'Other',
]

const RARITIES: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact']

const CATEGORY_SYMBOL: Record<ItemCategory, string> = {
  Weapon: '⚔',
  Armor: '🛡',
  'Adventuring Gear': '🎒',
  Tool: '⚙',
  Potion: '⚗',
  Scroll: '📜',
  Container: '📦',
  Valuable: '◈',
  Ammunition: '◎',
  'Magic Item': '✦',
  Other: '·',
}

const RARITY_COLOR: Record<ItemRarity, string> = {
  Common: '#8a8a7a',
  Uncommon: '#3a7a3a',
  Rare: '#3a5a9a',
  'Very Rare': '#6a3a9a',
  Legendary: '#b87820',
  Artifact: '#8b1a1a',
}

function blankItem(): Omit<Item, 'id'> {
  return {
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
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Inventory({ character, onBack, onUpdate }: Props) {
  const items = character.items ?? []

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<Omit<Item, 'id'>>(blankItem())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [rightPanel, setRightPanel] = useState<'form' | 'catalog'>('form')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategory, setCatalogCategory] = useState<ItemCategory | 'all'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived ──────────────────────────────────────────────────────────────────

  const totalWeight = items.reduce((s, it) => s + it.weight * it.quantity, 0)
  const {
    capacity: carryCapacity,
    encumberedAt,
    heavilyEncumberedAt: heavyAt,
  } = carryingLimits(character.scores.strength)
  const weightPct = Math.min(100, (totalWeight / carryCapacity) * 100)
  const weightColor = totalWeight > heavyAt ? '#8b1a1a' : totalWeight > encumberedAt ? '#8a7020' : '#3a7a3a'

  const grouped = CATEGORIES.reduce<Record<ItemCategory, Item[]>>(
    (acc, cat) => {
      acc[cat] = items.filter(i => i.category === cat)
      return acc
    },
    {} as Record<ItemCategory, Item[]>,
  )

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function saveItems(updated: Item[]) {
    onUpdate({ ...character, items: updated })
  }

  function selectItem(item: Item) {
    setSelectedId(item.id)
    setForm({ ...item })
    setConfirmDelete(false)
  }

  function startNew() {
    setSelectedId('new')
    setForm(blankItem())
    setConfirmDelete(false)
    setRightPanel('form')
  }

  function openCatalog() {
    setSelectedId(null)
    setRightPanel('catalog')
  }

  function addFromCatalog(catalogItem: Omit<Item, 'id'>) {
    const newItem: Item = { ...catalogItem, id: crypto.randomUUID() }
    saveItems([...items, newItem])
    setSelectedId(newItem.id)
    setForm({ ...catalogItem })
    setRightPanel('form')
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (selectedId === 'new') {
      const newItem: Item = { ...form, name: form.name.trim(), id: crypto.randomUUID() }
      saveItems([...items, newItem])
      setSelectedId(newItem.id)
    } else if (selectedId) {
      saveItems(items.map(i => (i.id === selectedId ? { ...form, name: form.name.trim(), id: selectedId } : i)))
    }
  }

  function handleDelete() {
    if (!selectedId || selectedId === 'new') return
    saveItems(items.filter(i => i.id !== selectedId))
    setSelectedId(null)
    setConfirmDelete(false)
  }

  function toggleEquipped(item: Item, e: React.MouseEvent) {
    e.stopPropagation()
    saveItems(items.map(i => (i.id === item.id ? { ...i, equipped: !i.equipped } : i)))
    if (selectedId === item.id) setForm(f => ({ ...f, equipped: !f.equipped }))
  }

  // ── Import ────────────────────────────────────────────────────────────────────

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        let parsed = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(parsed)) parsed = [parsed]

        const imported: Item[] = parsed
          .filter((x: unknown) => typeof x === 'object' && x !== null && 'name' in (x as object))
          .map((x: Record<string, unknown>) => ({
            id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
            name: String(x.name ?? '').trim() || 'Unnamed Item',
            category: (CATEGORIES.includes(x.category as ItemCategory) ? x.category : 'Other') as ItemCategory,
            description: String(x.description ?? ''),
            quantity: Math.max(1, Number(x.quantity) || 1),
            weight: Math.max(0, Number(x.weight) || 0),
            value: Math.max(0, Number(x.value) || 0),
            equipped: Boolean(x.equipped),
            rarity: (RARITIES.includes(x.rarity as ItemRarity) ? x.rarity : null) as ItemRarity | null,
            requiresAttunement: Boolean(x.requiresAttunement),
            isAttuned: Boolean(x.isAttuned),
            notes: String(x.notes ?? ''),
          }))

        if (imported.length === 0) {
          setImportError('No valid items found in file.')
          return
        }

        // Merge: skip items whose id already exists
        const existingIds = new Set(items.map(i => i.id))
        const fresh = imported.filter(i => !existingIds.has(i.id))
        saveItems([...items, ...fresh])
        setImportSuccess(`Imported ${fresh.length} item${fresh.length !== 1 ? 's' : ''}.`)
        setTimeout(() => setImportSuccess(null), 3000)
      } catch {
        setImportError('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Export ────────────────────────────────────────────────────────────────────

  function handleExport() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character.name.replace(/\s+/g, '_')}-inventory.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Shared style helpers ───────────────────────────────────────────────────────

  const inputCls = [
    'w-full font-fell-sc text-body text-ink rounded-sm px-2 py-[clamp(3px,0.4vh,6px)]',
    'bg-[rgba(255,240,180,0.35)] border border-[rgba(100,70,20,0.28)]',
    'outline-none focus:border-[rgba(100,70,20,0.55)] focus:bg-[rgba(255,240,180,0.55)]',
    'placeholder:text-[rgba(100,70,20,0.35)]',
  ].join(' ')

  const labelCls = 'font-cinzel text-deco text-red-ink tracking-[0.18em] uppercase mb-0.5 block'

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="w-screen h-screen flex flex-col bg-dungeon animate-fade-in overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-[clamp(14px,1.8vw,28px)] py-[clamp(8px,1.2vh,16px)] border-b border-[#1e1608] shrink-0 bg-topbar">
        <button
          onClick={onBack}
          className="font-cinzel text-caption tracking-[0.12em] text-[#8a7040] bg-transparent border border-[#2e2010] px-[clamp(12px,1.4vw,22px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020] whitespace-nowrap"
        >
          ← Return
        </button>

        <div className="text-center">
          <span className="block font-cinzel text-heading text-gold tracking-[0.05em]">
            Inventory of <em className="not-italic text-[#e8ca60]">{character.name}</em>
          </span>
          <span className="block font-fell-sc text-badge text-[#5a4a28] tracking-[0.12em] mt-0.5">
            {items.length} item{items.length !== 1 ? 's' : ''} · {totalWeight.toFixed(1)} lb carried
          </span>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={handleExport}
              className="font-cinzel text-caption tracking-[0.1em] text-[#8a7040] border border-[#2e2010] px-[clamp(10px,1.2vw,18px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020] whitespace-nowrap"
            >
              ↓ Export
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="font-cinzel text-caption tracking-[0.1em] text-[#8a7040] border border-[#2e2010] px-[clamp(10px,1.2vw,18px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020] whitespace-nowrap"
          >
            ↑ Import
          </button>
          <button
            onClick={openCatalog}
            className={[
              'font-cinzel text-caption tracking-[0.1em] border px-[clamp(10px,1.2vw,18px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm whitespace-nowrap transition-colors',
              rightPanel === 'catalog'
                ? 'text-gold border-gold-dim bg-[rgba(90,60,10,0.18)]'
                : 'text-[#8a7040] border-[#2e2010] hover:text-gold hover:border-[#5a4020]',
            ].join(' ')}
          >
            ◈ Browse Catalog
          </button>
          <button
            onClick={startNew}
            className="font-cinzel text-caption tracking-[0.1em] text-gold-dim border border-[#5a3e14] px-[clamp(12px,1.4vw,22px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm whitespace-nowrap transition-colors hover:text-gold hover:border-gold-dim"
            style={{
              background: 'linear-gradient(160deg, #2a1a06 0%, #1a1004 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            + Add Item
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImport}
      />

      {/* ── Import feedback ── */}
      {(importError || importSuccess) && (
        <div
          className={`text-center font-fell text-caption py-1.5 shrink-0 ${importError ? 'text-red-ink bg-[rgba(139,26,26,0.08)]' : 'text-[#3a7a3a] bg-[rgba(58,122,58,0.08)]'}`}
        >
          {importError ?? importSuccess}
        </div>
      )}

      {/* ── Body: list + detail ── */}
      <div className="flex-1 flex min-h-0 mx-[clamp(10px,1.2vw,20px)] mt-[clamp(8px,1.2vh,16px)] mb-[clamp(6px,0.8vh,12px)] gap-[clamp(8px,1vw,16px)]">
        {/* ── Left: item list ── */}
        <div
          className="flex flex-col w-[clamp(260px,30vw,420px)] shrink-0 rounded-sm overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 40% 20%, #f0e2b8 0%, #e0cc90 50%, #ccb060 100%)',
            border: '1px solid rgba(100,70,20,0.3)',
          }}
        >
          {/* Carrying capacity bar */}
          <div className="px-4 pt-3 pb-2 shrink-0 border-b border-[rgba(100,70,20,0.18)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-cinzel text-deco text-red-ink tracking-[0.18em] uppercase">Carrying</span>
              <span className="font-cinzel text-deco text-ink">
                {totalWeight.toFixed(1)} / {carryCapacity} lb
              </span>
            </div>
            <div className="h-[6px] rounded-full bg-[rgba(0,0,0,0.12)] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width,background] duration-300"
                style={{ width: `${weightPct}%`, background: weightColor }}
              />
            </div>
            {totalWeight > encumberedAt && (
              <div className="font-fell-sc text-deco mt-0.5" style={{ color: weightColor }}>
                {totalWeight > heavyAt ? '⚠ Heavily Encumbered' : '⚠ Encumbered'}
              </div>
            )}
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto parchment-scroll">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9a8050] py-10">
                <div className="text-[2.5rem] opacity-30">⚔</div>
                <p className="font-fell italic text-body text-center px-4 leading-[1.5]">
                  Your pack is empty.
                  <br />
                  Add items or import a list.
                </p>
              </div>
            ) : (
              CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
                <div key={cat}>
                  <div className="px-4 pt-3 pb-0.5 font-cinzel text-deco text-red-ink tracking-[0.22em] uppercase border-b border-[rgba(100,70,20,0.18)]">
                    {CATEGORY_SYMBOL[cat]} {cat}
                    <span className="ml-1.5 text-[rgba(100,70,20,0.5)] font-fell-sc normal-case tracking-normal">
                      ({grouped[cat].length})
                    </span>
                  </div>
                  {grouped[cat].map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={[
                        'w-full flex items-center gap-2 px-4 py-[clamp(5px,0.7vh,9px)] text-left',
                        'border-b border-[rgba(100,70,20,0.1)] transition-colors cursor-pointer',
                        'bg-transparent border-l-0 border-r-0 border-t-0',
                        selectedId === item.id ? 'bg-[rgba(90,60,10,0.18)]' : 'hover:bg-[rgba(90,60,10,0.10)]',
                      ].join(' ')}
                    >
                      {/* Equipped dot */}
                      <span
                        onClick={e => toggleEquipped(item, e)}
                        title={item.equipped ? 'Equipped — click to unequip' : 'Unequipped — click to equip'}
                        className={`shrink-0 text-body cursor-pointer transition-colors ${item.equipped ? 'text-[#3a7a3a]' : 'text-[rgba(100,70,20,0.28)]'}`}
                      >
                        ◉
                      </span>

                      {/* Name */}
                      <span
                        className={`font-fell-sc text-body flex-1 min-w-0 truncate ${item.rarity ? '' : 'text-ink'}`}
                        style={item.rarity ? { color: RARITY_COLOR[item.rarity] } : undefined}
                      >
                        {item.name}
                      </span>

                      {/* Qty */}
                      {item.quantity > 1 && (
                        <span className="font-cinzel text-deco text-[#8a7040] shrink-0">×{item.quantity}</span>
                      )}

                      {/* Weight */}
                      {item.weight > 0 && (
                        <span className="font-fell-sc text-deco text-[#9a8050] shrink-0">
                          {(item.weight * item.quantity).toFixed(item.weight % 1 === 0 ? 0 : 1)}lb
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right: detail / form / catalog ── */}
        <div
          className="flex-1 rounded-sm overflow-hidden flex flex-col"
          style={{
            background: 'radial-gradient(ellipse at 60% 30%, #f5e8c8 0%, #e8d5a8 40%, #d4b87a 100%)',
            border: '1px solid rgba(100,70,20,0.3)',
          }}
        >
          {rightPanel === 'catalog' ? (
            <CatalogBrowser
              catalogSearch={catalogSearch}
              setCatalogSearch={setCatalogSearch}
              catalogCategory={catalogCategory}
              setCatalogCategory={setCatalogCategory}
              onAddItem={addFromCatalog}
              inputCls={inputCls}
              labelCls={labelCls}
            />
          ) : selectedId ? (
            <ItemForm
              key={selectedId}
              form={form}
              isNew={selectedId === 'new'}
              confirmDelete={confirmDelete}
              setForm={setForm}
              onSave={handleSave}
              onDelete={handleDelete}
              onConfirmDelete={() => setConfirmDelete(true)}
              onCancelDelete={() => setConfirmDelete(false)}
              inputCls={inputCls}
              labelCls={labelCls}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#9a8050]">
              <div className="text-[clamp(2.5rem,4vw,4rem)] opacity-20">⚔</div>
              <p className="font-fell italic text-body text-center leading-[1.6] px-6">
                Select an item to view details,
                <br />
                or click <strong className="not-italic font-fell-sc text-[#8a7040]">+ Add Item</strong> to create one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Catalog browser sub-component ────────────────────────────────────────────

const CATALOG_CATEGORIES: Array<ItemCategory | 'all'> = [
  'all',
  'Weapon',
  'Armor',
  'Adventuring Gear',
  'Tool',
  'Potion',
  'Container',
  'Ammunition',
  'Other',
]

interface CatalogBrowserProps {
  catalogSearch: string
  setCatalogSearch: (v: string) => void
  catalogCategory: ItemCategory | 'all'
  setCatalogCategory: (v: ItemCategory | 'all') => void
  onAddItem: (item: Omit<Item, 'id'>) => void
  inputCls: string
  labelCls: string
}

function CatalogBrowser({
  catalogSearch,
  setCatalogSearch,
  catalogCategory,
  setCatalogCategory,
  onAddItem,
  inputCls,
}: CatalogBrowserProps) {
  const filtered = ITEM_CATALOG.filter(item => {
    if (catalogCategory !== 'all' && item.category !== catalogCategory) return false
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase()
      if (!item.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  const catBtnCls = (active: boolean) =>
    [
      'font-cinzel text-deco px-2 py-1 border rounded-sm cursor-pointer transition-colors whitespace-nowrap',
      active
        ? 'text-[#3e2208] border-[rgba(100,70,20,0.5)] bg-[rgba(90,60,10,0.2)]'
        : 'text-[rgba(100,70,20,0.5)] border-[rgba(100,70,20,0.2)] bg-transparent hover:text-[#6a4820] hover:border-[rgba(100,70,20,0.38)]',
    ].join(' ')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-[clamp(14px,1.6vw,24px)] pt-[clamp(12px,1.6vh,20px)] pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-cinzel-deco text-heading text-ink">Item Catalog</span>
          <span className="font-fell-sc text-deco text-[#9a8050]">{filtered.length} items</span>
        </div>
        <div className="deco-rule-subtle" />
      </div>

      {/* Filters */}
      <div className="px-[clamp(14px,1.6vw,24px)] pb-2 shrink-0 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Search items…"
          value={catalogSearch}
          onChange={e => setCatalogSearch(e.target.value)}
          className={inputCls}
        />
        <div className="flex flex-wrap gap-1">
          {CATALOG_CATEGORIES.map(cat => (
            <button key={cat} className={catBtnCls(catalogCategory === cat)} onClick={() => setCatalogCategory(cat)}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item grid */}
      <div className="flex-1 overflow-y-auto parchment-scroll px-[clamp(10px,1.2vw,18px)] pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9a8050] py-10">
            <div className="text-[2rem] opacity-30">◈</div>
            <p className="font-fell italic text-body text-center px-4 leading-[1.5]">No items match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((item, idx) => (
              <button
                key={`${item.name}-${idx}`}
                onClick={() => onAddItem(item)}
                className="w-full flex items-center gap-2 px-3 py-[clamp(4px,0.6vh,8px)] text-left border border-transparent rounded-sm transition-colors hover:bg-[rgba(90,60,10,0.12)] hover:border-[rgba(100,70,20,0.2)] cursor-pointer bg-transparent"
              >
                <span className="font-cinzel text-body shrink-0 w-5 text-center text-[#9a8050]">
                  {CATEGORY_SYMBOL[item.category]}
                </span>
                <span className="font-fell-sc text-body text-ink flex-1 min-w-0 truncate">{item.name}</span>
                <span className="font-cinzel text-deco text-[#9a8050] shrink-0 text-[0.65rem]">
                  {item.weight > 0 ? `${item.weight}lb` : '—'}
                </span>
                <span className="font-cinzel text-deco text-[#8a7040] shrink-0 text-[0.65rem] min-w-[3.5rem] text-right">
                  {item.value >= 1 ? `${item.value}gp` : `${Math.round(item.value * 100)}cp`}
                </span>
                <span className="font-cinzel text-deco text-[#4a7028] shrink-0 text-[0.6rem] opacity-70">+</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 px-[clamp(14px,1.6vw,24px)] py-2 border-t border-[rgba(100,70,20,0.2)]">
        <p className="font-fell italic text-deco text-[#9a8050] text-center leading-[1.4]">
          Click any item to add it to your inventory
        </p>
      </div>
    </div>
  )
}

// ── Item form sub-component ───────────────────────────────────────────────────

interface FormProps {
  form: Omit<Item, 'id'>
  isNew: boolean
  confirmDelete: boolean
  setForm: React.Dispatch<React.SetStateAction<Omit<Item, 'id'>>>
  onSave: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  inputCls: string
  labelCls: string
}

function ItemForm({
  form,
  isNew,
  confirmDelete,
  setForm,
  onSave,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  inputCls,
  labelCls,
}: FormProps) {
  const f =
    <K extends keyof Omit<Item, 'id'>>(key: K) =>
    (val: Omit<Item, 'id'>[K]) =>
      setForm(prev => ({ ...prev, [key]: val }))

  const showMagic = form.rarity !== null || form.category === 'Magic Item'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-[clamp(14px,1.6vw,24px)] pt-[clamp(12px,1.6vh,20px)] pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-cinzel-deco text-heading text-ink">
            {isNew ? 'New Item' : form.name || 'Edit Item'}
          </span>
          {form.rarity && (
            <span className="font-cinzel text-badge tracking-[0.15em]" style={{ color: RARITY_COLOR[form.rarity] }}>
              {form.rarity}
            </span>
          )}
        </div>
        <div className="deco-rule-subtle" />
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto parchment-scroll px-[clamp(14px,1.6vw,24px)] pb-4">
        <div className="flex flex-col gap-[clamp(10px,1.4vh,18px)]">
          {/* Name */}
          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={e => f('name')(e.target.value)}
              placeholder="Item name"
              maxLength={80}
              autoFocus={isNew}
            />
          </div>

          {/* Category + Qty row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select
                className={inputCls}
                value={form.category}
                onChange={e => f('category')(e.target.value as ItemCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantity</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={form.quantity}
                onChange={e => f('quantity')(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* Weight + Value row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Weight (lb/unit)</label>
              <input
                className={inputCls}
                type="number"
                min={0}
                step={0.5}
                value={form.weight}
                onChange={e => f('weight')(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className={labelCls}>Value (gp)</label>
              <input
                className={inputCls}
                type="number"
                min={0}
                step={0.1}
                value={form.value}
                onChange={e => f('value')(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* Equipped toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => f('equipped')(!form.equipped)}
              className={[
                'font-cinzel text-badge tracking-[0.15em] px-3 py-1.5 border rounded-sm cursor-pointer transition-colors',
                form.equipped
                  ? 'text-[#3a7a3a] border-[rgba(58,122,58,0.4)] bg-[rgba(58,122,58,0.1)] hover:bg-[rgba(58,122,58,0.18)]'
                  : 'text-[#8a7040] border-[rgba(100,70,20,0.3)] bg-transparent hover:border-[rgba(100,70,20,0.5)]',
              ].join(' ')}
            >
              {form.equipped ? '◉ Equipped' : '○ Unequipped'}
            </button>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={e => f('description')(e.target.value)}
              placeholder="Item description…"
            />
          </div>

          {/* ── Magic section ── */}
          <div>
            <label className={labelCls}>Rarity</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  f('rarity')(null)
                  f('requiresAttunement')(false)
                  f('isAttuned')(false)
                }}
                className={`font-cinzel text-deco px-2 py-1 border rounded-sm cursor-pointer transition-colors ${form.rarity === null ? 'text-[#8a7040] border-[rgba(100,70,20,0.5)] bg-[rgba(90,60,10,0.12)]' : 'text-[rgba(100,70,20,0.45)] border-[rgba(100,70,20,0.2)] hover:border-[rgba(100,70,20,0.4)]'}`}
              >
                None
              </button>
              {RARITIES.map(r => (
                <button
                  key={r}
                  onClick={() => f('rarity')(r)}
                  className={`font-cinzel text-deco px-2 py-1 border rounded-sm cursor-pointer transition-colors ${form.rarity === r ? 'border-current bg-[rgba(0,0,0,0.06)]' : 'border-[rgba(100,70,20,0.2)] hover:border-[rgba(100,70,20,0.4)]'}`}
                  style={{ color: RARITY_COLOR[r] }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {showMagic && (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  f('requiresAttunement')(!form.requiresAttunement)
                  if (form.requiresAttunement) f('isAttuned')(false)
                }}
                className={`font-cinzel text-badge tracking-[0.12em] px-3 py-1 border rounded-sm cursor-pointer transition-colors ${form.requiresAttunement ? 'text-[#6a3a9a] border-[rgba(106,58,154,0.4)] bg-[rgba(106,58,154,0.08)]' : 'text-[#8a7040] border-[rgba(100,70,20,0.28)] hover:border-[rgba(100,70,20,0.45)]'}`}
              >
                {form.requiresAttunement ? '◆ Requires Attunement' : '◇ No Attunement'}
              </button>
              {form.requiresAttunement && (
                <button
                  onClick={() => f('isAttuned')(!form.isAttuned)}
                  className={`font-cinzel text-badge tracking-[0.12em] px-3 py-1 border rounded-sm cursor-pointer transition-colors ${form.isAttuned ? 'text-[#3a5a9a] border-[rgba(58,90,154,0.4)] bg-[rgba(58,90,154,0.08)]' : 'text-[#8a7040] border-[rgba(100,70,20,0.28)] hover:border-[rgba(100,70,20,0.45)]'}`}
                >
                  {form.isAttuned ? '✦ Attuned' : '○ Not Attuned'}
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={form.notes}
              onChange={e => f('notes')(e.target.value)}
              placeholder="Extra notes…"
            />
          </div>
        </div>
      </div>

      {/* Footer: Save + Delete */}
      <div className="shrink-0 px-[clamp(14px,1.6vw,24px)] py-3 border-t border-[rgba(100,70,20,0.2)]">
        <button
          onClick={onSave}
          disabled={!form.name.trim()}
          className="w-full font-cinzel text-caption tracking-[0.12em] text-[#e8d090] border border-[rgba(100,70,20,0.5)] py-[clamp(6px,0.8vh,10px)] rounded-sm cursor-pointer transition-colors hover:border-[rgba(200,168,75,0.6)] hover:text-gold disabled:opacity-40 disabled:cursor-default mb-2"
          style={{ background: 'linear-gradient(160deg, #3a2208 0%, #2a1606 100%)' }}
        >
          {isNew ? 'Add to Inventory' : 'Save Changes'}
        </button>

        {!isNew &&
          (confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={onCancelDelete}
                className="flex-1 font-cinzel text-deco text-[#8a7040] border border-[rgba(100,70,20,0.3)] py-1.5 rounded-sm cursor-pointer hover:border-[rgba(100,70,20,0.5)]"
                style={{ background: 'rgba(90,60,10,0.06)' }}
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-[2] font-cinzel text-deco text-[#eec0a8] border border-[rgba(139,26,26,0.45)] py-1.5 rounded-sm cursor-pointer hover:border-[rgba(139,26,26,0.65)]"
                style={{ background: 'linear-gradient(160deg, #4a0808 0%, #360606 100%)' }}
              >
                Yes, Remove
              </button>
            </div>
          ) : (
            <button
              onClick={onConfirmDelete}
              className="w-full font-cinzel text-deco text-red-ink border border-[rgba(139,26,26,0.22)] py-1.5 rounded-sm cursor-pointer transition-colors hover:border-[rgba(139,26,26,0.45)] hover:bg-[rgba(139,26,26,0.05)]"
            >
              Remove from Inventory
            </button>
          ))}
      </div>
    </div>
  )
}
