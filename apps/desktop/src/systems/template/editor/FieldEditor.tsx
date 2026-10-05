import { useTranslation } from 'react-i18next'
import type { NumberField, TemplateField } from '@fablesheet/templates'
import { isValidFormula, localize } from '@fablesheet/templates'
import { RollEditor } from './RollEditor'
import { inputCls, labelCls } from './styles'

interface Props {
  field: TemplateField
  numberFields: NumberField[]
  /** The id is already used by another field */
  duplicateId: boolean
  onChange: (field: TemplateField) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
  first: boolean
  last: boolean
}

const VALID_ID = /^[a-zA-Z][\w-]*$/

function NumberInput({
  label,
  value,
  onChange,
  allowEmpty = true,
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  allowEmpty?: boolean
}) {
  return (
    <label className="w-24">
      <span className={labelCls}>{label}</span>
      <input
        className={inputCls}
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        onChange={e =>
          onChange(e.target.value === '' && allowEmpty ? undefined : Math.floor(Number(e.target.value)) || 0)
        }
      />
    </label>
  )
}

const iconBtn =
  'fs-focus size-8 rounded-md bg-transparent border border-fs-card-line text-fs-ink-muted cursor-pointer hover:text-fs-ink disabled:opacity-30 disabled:cursor-default'

/** Edits one field of a template: label, id, kind-specific options and its roll. */
export function FieldEditor({ field, numberFields, duplicateId, onChange, onMove, onRemove, first, last }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const idInvalid = !VALID_ID.test(field.id) || duplicateId

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-fs-card-line bg-fs-tile/40 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-xs uppercase tracking-wide text-fs-brass min-w-20 pb-2.5">
          {t(`builderTemplate.kind.${field.kind}`)}
        </span>
        <label className="flex-1 min-w-40">
          <span className={labelCls}>{t('builderTemplate.label')}</span>
          <input
            className={inputCls}
            value={localize(field.label, lang)}
            onChange={e => onChange({ ...field, label: e.target.value })}
          />
        </label>
        <label className="w-32">
          <span className={labelCls}>{t('builderTemplate.id')}</span>
          <input
            className={`${inputCls} font-mono`}
            value={field.id}
            aria-invalid={idInvalid}
            onChange={e => onChange({ ...field, id: e.target.value.replace(/\s/g, '') })}
          />
        </label>
        <span className="flex gap-1 pb-1">
          <button
            type="button"
            className={iconBtn}
            disabled={first}
            onClick={() => onMove(-1)}
            aria-label={t('builderTemplate.moveUp')}
          >
            ↑
          </button>
          <button
            type="button"
            className={iconBtn}
            disabled={last}
            onClick={() => onMove(1)}
            aria-label={t('builderTemplate.moveDown')}
          >
            ↓
          </button>
          <button
            type="button"
            className={`${iconBtn} hover:text-fs-danger`}
            onClick={onRemove}
            aria-label={t('builderTemplate.removeField')}
          >
            ✕
          </button>
        </span>
      </div>
      {idInvalid && (
        <p className="m-0 text-xs text-fs-danger">
          {duplicateId ? t('builderTemplate.idTaken') : t('builderTemplate.idInvalid')}
        </p>
      )}

      {field.kind === 'number' && (
        <>
          <div className="flex flex-wrap gap-2">
            <NumberInput
              label={t('builderTemplate.default')}
              value={field.default}
              onChange={v => onChange({ ...field, default: v })}
            />
            <NumberInput
              label={t('builderTemplate.min')}
              value={field.min}
              onChange={v => onChange({ ...field, min: v })}
            />
            <NumberInput
              label={t('builderTemplate.max')}
              value={field.max}
              onChange={v => onChange({ ...field, max: v })}
            />
          </div>
          <RollEditor roll={field.roll} numberFields={numberFields} onChange={roll => onChange({ ...field, roll })} />
        </>
      )}
      {field.kind === 'text' && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!field.multiline}
            onChange={e => onChange({ ...field, multiline: e.target.checked })}
          />
          {t('builderTemplate.multiline')}
        </label>
      )}
      {field.kind === 'track' && (
        <NumberInput
          label={t('builderTemplate.boxes')}
          value={field.boxes}
          allowEmpty={false}
          onChange={v => onChange({ ...field, boxes: Math.min(50, Math.max(1, v ?? 1)) })}
        />
      )}
      {field.kind === 'resource' && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="w-40">
            <span className={labelCls}>{t('builderTemplate.resourceMax')}</span>
            <input
              className={`${inputCls} font-mono`}
              value={String(field.max)}
              aria-invalid={!isValidFormula(field.max)}
              onChange={e =>
                onChange({ ...field, max: /^\d+$/.test(e.target.value) ? Number(e.target.value) : e.target.value })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm min-h-10">
            <input
              type="checkbox"
              checked={!!field.onTable}
              onChange={e => onChange({ ...field, onTable: e.target.checked })}
            />
            {t('builderTemplate.onTable')}
          </label>
        </div>
      )}
      {field.kind === 'list' && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <label className="flex items-center gap-2 min-h-9">
              <input
                type="checkbox"
                checked={!!field.withValue}
                onChange={e =>
                  onChange({ ...field, withValue: e.target.checked, ...(e.target.checked ? {} : { roll: undefined }) })
                }
              />
              {t('builderTemplate.withValue')}
            </label>
            {field.withValue && (
              <label className="flex items-center gap-2 min-h-9">
                <input
                  type="checkbox"
                  checked={!!field.entryAttributes}
                  onChange={e => onChange({ ...field, entryAttributes: e.target.checked })}
                />
                {t('builderTemplate.entryAttributes')}
              </label>
            )}
          </div>
          {field.withValue && (
            <RollEditor
              roll={field.roll}
              numberFields={numberFields}
              attributesFromEntry={field.entryAttributes}
              onChange={roll => onChange({ ...field, roll })}
            />
          )}
        </>
      )}
    </div>
  )
}
