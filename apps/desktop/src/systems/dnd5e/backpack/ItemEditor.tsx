import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Item, ItemCategory } from '@fablesheet/dnd5e'
import { ATTUNEMENT_LIMIT } from '@fablesheet/dnd5e'
import { gameLabel } from '../../../i18n/game'
import { Button } from '../../../components/ui/Button'
import { Drawer } from '../../../components/ui/Drawer'
import { DEFAULT_ARMOR, DEFAULT_WEAPON } from './itemDefaults'
import { CATEGORIES, RARITIES } from './itemImport'
import { ArmorFields, WeaponFields } from './ItemStatsFields'
import { MagicFields } from './MagicFields'
import { RARITY_COLOR } from './rarity'
import { inputCls, labelCls } from './styles'

type Draft = Omit<Item, 'id'>

interface Props {
  item: Draft
  isNew: boolean
  /** Number of other items the character is attuned to */
  attunedElsewhere: number
  onSave: (item: Draft) => void
  onRemove: () => void
  onClose: () => void
}

export function ItemEditor({ item, isNew, attunedElsewhere, onSave, onRemove, onClose }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Draft>(item)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const set = (patch: Partial<Draft>) => setForm(prev => ({ ...prev, ...patch }))
  const showMagic = form.rarity !== null || form.category === 'Magic Item' || !!form.bonuses || !!form.charges
  const attunementFull = attunedElsewhere >= ATTUNEMENT_LIMIT

  function save() {
    if (!form.name.trim()) return
    // Stats only belong to their category; the form shows defaults until edited
    onSave({
      ...form,
      name: form.name.trim(),
      weapon: form.category === 'Weapon' ? (form.weapon ?? DEFAULT_WEAPON) : null,
      armor: form.category === 'Armor' ? (form.armor ?? DEFAULT_ARMOR) : null,
    })
  }

  return (
    <Drawer
      title={isNew ? t('inventory.newItem') : form.name || t('inventory.editItem')}
      onClose={onClose}
      footer={
        <>
          {!isNew &&
            (confirmRemove ? (
              <Button variant="danger" onClick={onRemove}>
                {t('inventory.removeYes')}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmRemove(true)}>
                {t('inventory.remove')}
              </Button>
            ))}
          <span className="flex-1" />
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
            {isNew ? t('inventory.addToInventory') : t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label>
          <span className={labelCls}>{t('inventory.name')}</span>
          <input
            className={inputCls}
            value={form.name}
            onChange={e => set({ name: e.target.value })}
            placeholder={t('inventory.namePlaceholder')}
            maxLength={80}
            autoFocus={isNew}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={labelCls}>{t('inventory.category')}</span>
            <select
              className={inputCls}
              value={form.category}
              onChange={e => set({ category: e.target.value as ItemCategory })}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {gameLabel(t, 'itemCategory', c)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelCls}>{t('inventory.quantity')}</span>
            <input
              className={inputCls}
              type="number"
              min={1}
              inputMode="numeric"
              value={form.quantity}
              onChange={e => set({ quantity: Math.max(1, Number(e.target.value)) })}
            />
          </label>
          <label>
            <span className={labelCls}>{t('inventory.weight')}</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              value={form.weight}
              onChange={e => set({ weight: Math.max(0, Number(e.target.value)) })}
            />
          </label>
          <label>
            <span className={labelCls}>{t('inventory.value')}</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              value={form.value}
              onChange={e => set({ value: Math.max(0, Number(e.target.value)) })}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.equipped} onChange={e => set({ equipped: e.target.checked })} />
          {t('inventory.equippedLabel')}
        </label>

        {form.category === 'Weapon' && (
          <WeaponFields
            weapon={form.weapon ?? DEFAULT_WEAPON}
            onChange={w => set({ weapon: w })}
            inputCls={inputCls}
            labelCls={labelCls}
          />
        )}
        {form.category === 'Armor' && (
          <ArmorFields
            armor={form.armor ?? DEFAULT_ARMOR}
            onChange={a => set({ armor: a })}
            inputCls={inputCls}
            labelCls={labelCls}
          />
        )}

        <label>
          <span className={labelCls}>{t('inventory.description')}</span>
          <textarea
            className={`${inputCls} py-2 resize-none`}
            rows={3}
            value={form.description}
            onChange={e => set({ description: e.target.value })}
            placeholder={t('inventory.descriptionPlaceholder')}
          />
        </label>

        <div>
          <span className={labelCls}>{t('inventory.rarity')}</span>
          <div className="flex flex-wrap gap-1.5">
            {[null, ...RARITIES].map(r => (
              <button
                key={r ?? 'none'}
                type="button"
                onClick={() =>
                  set(r === null ? { rarity: null, requiresAttunement: false, isAttuned: false } : { rarity: r })
                }
                aria-pressed={form.rarity === r}
                className={`fs-focus min-h-8 px-2.5 text-xs rounded-md border cursor-pointer bg-transparent ${form.rarity === r ? 'border-current bg-fs-hover' : 'border-fs-card-line'}`}
                style={{ color: r ? RARITY_COLOR[r] : undefined }}
              >
                {r ? gameLabel(t, 'rarity', r) : t('common.none')}
              </button>
            ))}
          </div>
        </div>

        {showMagic && (
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requiresAttunement}
                onChange={e =>
                  set({ requiresAttunement: e.target.checked, isAttuned: e.target.checked && form.isAttuned })
                }
              />
              {t('inventory.requiresAttunementLabel')}
            </label>
            {form.requiresAttunement && (
              <label className="flex items-center gap-2 pl-6">
                <input
                  type="checkbox"
                  checked={form.isAttuned}
                  disabled={!form.isAttuned && attunementFull}
                  onChange={e => set({ isAttuned: e.target.checked })}
                />
                {t('inventory.attunedLabel')}
                <span className="text-xs text-fs-ink-muted">
                  {!form.isAttuned && attunementFull
                    ? t('magic.attunementFull', { limit: ATTUNEMENT_LIMIT })
                    : t('magic.attunementCount', {
                        count: attunedElsewhere + (form.isAttuned ? 1 : 0),
                        limit: ATTUNEMENT_LIMIT,
                      })}
                </span>
              </label>
            )}
          </div>
        )}

        {(showMagic || form.category === 'Weapon' || form.category === 'Armor') && (
          <MagicFields
            kind={form.category === 'Weapon' ? 'weapon' : form.category === 'Armor' ? 'armor' : 'other'}
            bonuses={form.bonuses ?? null}
            charges={form.charges ?? null}
            rarity={form.rarity}
            onChange={set}
            inputCls={inputCls}
            labelCls={labelCls}
          />
        )}

        <label>
          <span className={labelCls}>{t('inventory.notes')}</span>
          <textarea
            className={`${inputCls} py-2 resize-none`}
            rows={2}
            value={form.notes}
            onChange={e => set({ notes: e.target.value })}
            placeholder={t('inventory.notesPlaceholder')}
          />
        </label>
      </div>
    </Drawer>
  )
}
