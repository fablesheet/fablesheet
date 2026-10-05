import { useTranslation } from 'react-i18next'
import type { ItemBonuses, ItemCharges, ItemRarity } from '@fablesheet/dnd5e'
import { parseDice } from '@fablesheet/core'
import { NO_BONUSES } from '@fablesheet/dnd5e'
import { Segmented } from '../../../components/ui/Segmented'

interface Props {
  kind: 'weapon' | 'armor' | 'other'
  bonuses: ItemBonuses | null
  charges: ItemCharges | null
  rarity: ItemRarity | null
  onChange: (patch: { bonuses?: ItemBonuses | null; charges?: ItemCharges | null; rarity?: ItemRarity | null }) => void
  inputCls: string
  labelCls: string
}

/** Usual rarity of +1, +2 and +3 weapons and armor */
const ENHANCEMENT_RARITY: Record<number, ItemRarity> = { 1: 'Uncommon', 2: 'Rare', 3: 'Very Rare' }
type Recharge = 'long' | 'short' | 'never'

/** Magic bonuses (+1 weapons, rings of protection, …) and charges (wands, staffs). */
export function MagicFields({ kind, bonuses, charges, rarity, onChange, inputCls, labelCls }: Props) {
  const { t } = useTranslation()
  const b = bonuses ?? NO_BONUSES
  const enhancement = kind === 'weapon' ? (b.attack === b.damage ? b.attack : -1) : kind === 'armor' ? b.ac : -1

  const setBonus = (patch: Partial<ItemBonuses>) => {
    const next = { ...b, ...patch }
    onChange({ bonuses: Object.values(next).some(v => v !== 0) ? next : null })
  }
  const setEnhancement = (n: number) => {
    setBonus(kind === 'weapon' ? { attack: n, damage: n } : { ac: n })
    if (n > 0 && (rarity === null || Object.values(ENHANCEMENT_RARITY).includes(rarity))) {
      onChange({ rarity: ENHANCEMENT_RARITY[n] })
    }
  }
  const number = (label: string, value: number, change: (n: number) => void) => (
    <label>
      <span className={labelCls}>{label}</span>
      <input
        className={inputCls}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={e => change(Math.floor(Number(e.target.value)) || 0)}
      />
    </label>
  )
  const regainValid = !charges?.regain || parseDice(charges.regain) !== null

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-fs-card-line p-3">
      <h3 className="fs-section-label m-0 font-normal">{t('magic.title')}</h3>

      {kind !== 'other' && (
        <div>
          <span className={labelCls}>{t('magic.enhancement')}</span>
          <Segmented
            label={t('magic.enhancement')}
            value={String(enhancement)}
            onChange={v => setEnhancement(Number(v))}
            options={[0, 1, 2, 3].map(n => ({ value: String(n), label: n === 0 ? t('common.none') : `+${n}` }))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {kind === 'weapon' && number(t('magic.attack'), b.attack, n => setBonus({ attack: n }))}
        {kind === 'weapon' && number(t('magic.damage'), b.damage, n => setBonus({ damage: n }))}
        {number(t('magic.ac'), b.ac, n => setBonus({ ac: n }))}
        {number(t('magic.savingThrows'), b.savingThrows, n => setBonus({ savingThrows: n }))}
      </div>
      <p className="m-0 text-xs text-fs-ink-muted">{t('magic.bonusHint')}</p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={charges !== null}
          onChange={e =>
            onChange({
              charges: e.target.checked ? { max: 7, current: 7, recharge: 'long', regain: '1d6+1' } : null,
            })
          }
        />
        {t('magic.hasCharges')}
      </label>
      {charges && (
        <div className="flex flex-col gap-3 pl-6">
          <div className="grid grid-cols-2 gap-3">
            {number(t('magic.chargesCurrent'), charges.current, n =>
              onChange({ charges: { ...charges, current: Math.min(charges.max, Math.max(0, n)) } }),
            )}
            {number(t('magic.chargesMax'), charges.max, n => {
              const max = Math.max(1, n)
              onChange({ charges: { ...charges, max, current: Math.min(max, charges.current) } })
            })}
          </div>
          <div>
            <span className={labelCls}>{t('magic.recharge')}</span>
            <Segmented<Recharge>
              label={t('magic.recharge')}
              value={charges.recharge ?? 'never'}
              onChange={v => onChange({ charges: { ...charges, recharge: v === 'never' ? null : v } })}
              options={[
                { value: 'long', label: t('magic.rechargeLong') },
                { value: 'short', label: t('magic.rechargeShort') },
                { value: 'never', label: t('magic.rechargeNever') },
              ]}
            />
          </div>
          {charges.recharge && (
            <label>
              <span className={labelCls}>{t('magic.regain')}</span>
              <input
                className={inputCls}
                value={charges.regain ?? ''}
                onChange={e => onChange({ charges: { ...charges, regain: e.target.value.trim() || null } })}
                placeholder={t('magic.regainPlaceholder')}
                aria-invalid={!regainValid}
              />
              {!regainValid && <span className="text-xs text-fs-danger">{t('dice.invalid')}</span>}
            </label>
          )}
        </div>
      )}
    </section>
  )
}
