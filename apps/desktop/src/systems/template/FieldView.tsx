import { useTranslation } from 'react-i18next'
import type { RollSpec } from '@fablesheet/core'
import type { FieldValue, ListEntry, SheetTemplate, TemplateField } from '@fablesheet/templates'
import { allFields, localize, newEntryId, resolveRoll, resourceMax } from '@fablesheet/templates'
import { Button } from '../../components/ui/Button'

interface Props {
  field: TemplateField
  template: SheetTemplate
  values: Record<string, FieldValue>
  onChange: (value: FieldValue) => void
  onRoll: (spec: RollSpec, label: string) => void
}

const inputCls =
  'fs-focus w-full min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted'
const stepCls =
  'fs-focus size-8 rounded-md border border-fs-card-line bg-fs-tile text-fs-ink cursor-pointer hover:border-fs-brass'

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  label: string
}) {
  const { t } = useTranslation()
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v))
  return (
    <span className="flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        className={stepCls}
        onClick={() => onChange(clamp(value - 1))}
        aria-label={t('sheetTemplate.decrease', { label })}
      >
        −
      </button>
      <span className="font-display text-lg min-w-9 text-center">{value}</span>
      <button
        type="button"
        className={stepCls}
        onClick={() => onChange(clamp(value + 1))}
        aria-label={t('sheetTemplate.increase', { label })}
      >
        +
      </button>
    </span>
  )
}

function RollButton({ onClick, label }: { onClick: () => void; label: string }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      title={t('sheetTemplate.roll', { label })}
      aria-label={t('sheetTemplate.roll', { label })}
      className="fs-focus size-9 shrink-0 rounded-md border border-fs-brass bg-fs-accent/15 text-fs-ink cursor-pointer hover:bg-fs-accent/30"
    >
      🎲
    </button>
  )
}

/** One field of a template sheet: shows its value, lets the player change it and roll. */
export function FieldView({ field, template, values, onChange, onRoll }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const label = localize(field.label, lang)
  const hint = field.hint ? localize(field.hint, lang) : null
  const value = values[field.id]

  const roll = (
    rollTemplate: Parameters<typeof resolveRoll>[0],
    rollLabel: string,
    self?: number,
    entry?: ListEntry,
  ) => {
    const spec = resolveRoll(rollTemplate, template, values, self, entry)
    if (spec) onRoll(spec, rollLabel)
  }

  switch (field.kind) {
    case 'number': {
      const n = typeof value === 'number' ? value : 0
      return (
        <div className="flex items-center gap-2 min-h-10">
          <span className="flex-1 min-w-0 text-sm">
            {label}
            {hint && <span className="block text-xs text-fs-ink-muted">{hint}</span>}
          </span>
          <Stepper value={n} min={field.min} max={field.max} onChange={onChange} label={label} />
          {field.roll && <RollButton label={label} onClick={() => roll(field.roll!, label, n)} />}
        </div>
      )
    }
    case 'text':
      return (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fs-ink-muted">{label}</span>
          {field.multiline ? (
            <textarea
              className={`${inputCls} py-2 resize-y`}
              rows={3}
              value={typeof value === 'string' ? value : ''}
              placeholder={field.placeholder ? localize(field.placeholder, lang) : undefined}
              onChange={e => onChange(e.target.value)}
            />
          ) : (
            <input
              className={inputCls}
              value={typeof value === 'string' ? value : ''}
              placeholder={field.placeholder ? localize(field.placeholder, lang) : undefined}
              onChange={e => onChange(e.target.value)}
            />
          )}
          {hint && <span className="text-xs text-fs-ink-muted">{hint}</span>}
        </label>
      )
    case 'track': {
      const boxes = Array.isArray(value) ? (value as boolean[]) : []
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-fs-ink-muted">
            {label} · {boxes.filter(Boolean).length}/{field.boxes}
          </span>
          <span className="flex flex-wrap gap-1" role="group" aria-label={label}>
            {Array.from({ length: field.boxes }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={!!boxes[i]}
                aria-label={`${label} ${i + 1}`}
                onClick={() =>
                  onChange(Array.from({ length: field.boxes }, (_, j) => (j === i ? !boxes[j] : !!boxes[j])))
                }
                className={`fs-focus size-8 rounded-md border-[1.5px] cursor-pointer ${boxes[i] ? 'bg-fs-brass border-fs-brass' : 'bg-transparent border-fs-card-line hover:border-fs-brass'}`}
              />
            ))}
          </span>
        </div>
      )
    }
    case 'resource': {
      const max = resourceMax(template, values, field.id)
      const n = typeof value === 'number' ? value : 0
      return (
        <div className="flex items-center gap-2 min-h-10">
          <span className="flex-1 min-w-0 text-sm">{label}</span>
          <Stepper value={n} min={0} max={max} onChange={onChange} label={label} />
          <span className="text-sm text-fs-ink-muted min-w-10">/ {max}</span>
        </div>
      )
    }
    case 'list': {
      const entries = Array.isArray(value) ? (value as ListEntry[]) : []
      const numberFields = allFields(template).filter(f => f.kind === 'number')
      const setEntry = (id: string, patch: Partial<ListEntry>) =>
        onChange(entries.map(e => (e.id === id ? { ...e, ...patch } : e)))
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-fs-ink-muted">{label}</span>
          {hint && <span className="text-xs text-fs-ink-muted -mt-1">{hint}</span>}
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {entries.map(entry => (
              <li key={entry.id} className="flex flex-wrap items-center gap-1.5">
                <input
                  className={`${inputCls} flex-1 min-w-32`}
                  value={entry.name}
                  aria-label={t('sheetTemplate.entryName')}
                  onChange={e => setEntry(entry.id, { name: e.target.value })}
                />
                {field.entryAttributes &&
                  [0, 1, 2].map(i => (
                    <select
                      key={i}
                      value={entry.attributes?.[i] ?? ''}
                      aria-label={t('sheetTemplate.entryAttribute', { n: i + 1 })}
                      onChange={e => {
                        const attributes = [...(entry.attributes ?? ['', '', ''])] as [string, string, string]
                        attributes[i] = e.target.value
                        setEntry(entry.id, { attributes })
                      }}
                      className="fs-focus min-h-10 max-w-28 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-1"
                    >
                      <option value="">—</option>
                      {numberFields.map(f => (
                        <option key={f.id} value={f.id}>
                          {localize(f.label, lang)}
                        </option>
                      ))}
                    </select>
                  ))}
                {field.withValue && (
                  <Stepper
                    value={entry.value ?? 0}
                    onChange={v => setEntry(entry.id, { value: v })}
                    label={entry.name || label}
                  />
                )}
                {field.roll && (
                  <RollButton
                    label={entry.name || label}
                    onClick={() => roll(field.roll!, entry.name || label, entry.value ?? 0, entry)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onChange(entries.filter(e => e.id !== entry.id))}
                  aria-label={t('sheetTemplate.removeEntry', { name: entry.name })}
                  className="fs-focus size-8 rounded-md bg-transparent border-none text-fs-ink-muted cursor-pointer hover:text-fs-danger"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onClick={() =>
              onChange([...entries, { id: newEntryId(), name: '', ...(field.withValue ? { value: 0 } : {}) }])
            }
          >
            + {t('sheetTemplate.addEntry')}
          </Button>
        </div>
      )
    }
  }
}
