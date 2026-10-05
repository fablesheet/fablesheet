import { useTranslation } from 'react-i18next'
import type { ArmorStats, DamageType, WeaponStats } from '@fablesheet/dnd5e'
import { gameLabel } from '../../../i18n/game'

const DAMAGE_TYPES: DamageType[] = [
  'bludgeoning',
  'piercing',
  'slashing',
  'acid',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'poison',
  'psychic',
  'radiant',
  'thunder',
]
const ARMOR_TYPES: ArmorStats['type'][] = ['light', 'medium', 'heavy', 'shield']

/** Dexterity rules follow from the armor type */
function withArmorType(armor: ArmorStats, type: ArmorStats['type']): ArmorStats {
  const rules: Record<ArmorStats['type'], Pick<ArmorStats, 'addDex' | 'dexCap'>> = {
    light: { addDex: true, dexCap: null },
    medium: { addDex: true, dexCap: 2 },
    heavy: { addDex: false, dexCap: null },
    shield: { addDex: false, dexCap: null },
  }
  return { ...armor, type, ...rules[type], baseAc: type === 'shield' ? 2 : armor.type === 'shield' ? 11 : armor.baseAc }
}

interface FieldProps {
  inputCls: string
  labelCls: string
}

export function WeaponFields({
  weapon,
  onChange,
  inputCls,
  labelCls,
}: FieldProps & { weapon: WeaponStats; onChange: (w: WeaponStats) => void }) {
  const { t } = useTranslation()
  const set = (patch: Partial<WeaponStats>) => onChange({ ...weapon, ...patch })
  const finesse = weapon.properties.includes('finesse')

  return (
    <fieldset className="flex flex-col gap-3 border border-fs-card-line rounded-sm px-3 pt-1 pb-3">
      <legend className={`${labelCls} px-1`}>{t('inventory.weaponStats')}</legend>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className={labelCls}>{t('inventory.damage')}</span>
          <input
            className={inputCls}
            value={weapon.damage ?? ''}
            placeholder="1d8"
            onChange={e => set({ damage: e.target.value.trim() || null })}
          />
        </label>
        <label>
          <span className={labelCls}>{t('inventory.damageType')}</span>
          <select
            className={inputCls}
            value={weapon.damageType ?? ''}
            onChange={e => set({ damageType: (e.target.value || null) as DamageType | null })}
          >
            {DAMAGE_TYPES.map(d => (
              <option key={d} value={d}>
                {gameLabel(t, 'damageType', d)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>{t('inventory.kind')}</span>
          <select
            className={inputCls}
            value={weapon.kind}
            onChange={e => set({ kind: e.target.value as WeaponStats['kind'] })}
          >
            <option value="melee">{t('inventory.melee')}</option>
            <option value="ranged">{t('inventory.ranged')}</option>
          </select>
        </label>
        <label>
          <span className={labelCls}>{t('inventory.category')}</span>
          <select
            className={inputCls}
            value={weapon.category}
            onChange={e => set({ category: e.target.value as WeaponStats['category'] })}
          >
            <option value="simple">{t('inventory.simple')}</option>
            <option value="martial">{t('inventory.martial')}</option>
          </select>
        </label>
        <label>
          <span className={labelCls}>{t('inventory.versatile')}</span>
          <input
            className={inputCls}
            value={weapon.versatileDamage ?? ''}
            placeholder="—"
            onChange={e => set({ versatileDamage: e.target.value.trim() || null })}
          />
        </label>
        <label>
          <span className={labelCls}>{t('inventory.range')}</span>
          <input
            className={inputCls}
            value={weapon.range ?? ''}
            placeholder="80/320"
            onChange={e => set({ range: e.target.value.trim() || null })}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-fs-ink">
        <input
          type="checkbox"
          checked={finesse}
          onChange={() =>
            set({
              properties: finesse ? weapon.properties.filter(p => p !== 'finesse') : [...weapon.properties, 'finesse'],
            })
          }
        />
        {t('inventory.finesse')}
      </label>
      {weapon.properties.length > 0 && (
        <div className="text-xs text-fs-ink-muted">
          {t('inventory.properties')}: {weapon.properties.map(p => gameLabel(t, 'weaponProperty', p)).join(', ')}
        </div>
      )}
    </fieldset>
  )
}

export function ArmorFields({
  armor,
  onChange,
  inputCls,
  labelCls,
}: FieldProps & { armor: ArmorStats; onChange: (a: ArmorStats) => void }) {
  const { t } = useTranslation()

  return (
    <fieldset className="flex flex-col gap-3 border border-fs-card-line rounded-sm px-3 pt-1 pb-3">
      <legend className={`${labelCls} px-1`}>{t('inventory.armorStats')}</legend>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className={labelCls}>{t('inventory.armorType')}</span>
          <select
            className={inputCls}
            value={armor.type}
            onChange={e => onChange(withArmorType(armor, e.target.value as ArmorStats['type']))}
          >
            {ARMOR_TYPES.map(type => (
              <option key={type} value={type}>
                {gameLabel(t, 'armorType', type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>
            {armor.type === 'shield' ? t('inventory.shieldBonus') : t('inventory.baseAc')}
          </span>
          <input
            className={inputCls}
            type="number"
            min={0}
            max={30}
            value={armor.baseAc}
            onChange={e => onChange({ ...armor, baseAc: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
          />
        </label>
      </div>
      <div className="text-xs text-fs-ink-muted">
        {t(`inventory.acRule_${armor.type}`, { ac: armor.baseAc })}
        {armor.strengthRequired ? ` · ${t('inventory.strengthRequired', { value: armor.strengthRequired })}` : ''}
        {armor.stealthDisadvantage ? ` · ${t('inventory.stealthDisadvantage')}` : ''}
      </div>
      <p className="italic text-xs text-fs-ink-muted">{t('inventory.acHint')}</p>
    </fieldset>
  )
}
