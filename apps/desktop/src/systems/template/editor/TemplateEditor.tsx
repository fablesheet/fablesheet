import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldKind, NumberField, SheetTemplate, TemplateField } from '@fablesheet/templates'
import {
  allFields,
  exportTemplate,
  isValidFormula,
  localize,
  TemplateError,
  validateTemplate,
} from '@fablesheet/templates'
import { saveJsonFile } from '../../../services/files'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { newTemplateId, saveToLibrary } from '../library'
import { FieldEditor } from './FieldEditor'
import { inputCls, labelCls } from './styles'

interface Props {
  template: SheetTemplate
  onSave: (template: SheetTemplate) => void
  onCancel: () => void
}

const KINDS: FieldKind[] = ['number', 'text', 'track', 'resource', 'list']

function newField(kind: FieldKind, taken: Set<string>): TemplateField {
  let n = 1
  while (taken.has(`${kind}${n}`)) n++
  const id = `${kind}${n}`
  switch (kind) {
    case 'number':
      return { id, kind, label: '', default: 0 }
    case 'text':
      return { id, kind, label: '' }
    case 'track':
      return { id, kind, label: '', boxes: 4 }
    case 'resource':
      return { id, kind, label: '', max: 10 }
    case 'list':
      return { id, kind, label: '' }
  }
}

const splitList = (text: string) =>
  text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

const fileName = (name: string) =>
  `${name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'template'}.fablesheet-template.json`

/** The sheet builder: sections, fields, rolls and the sheet's settings. */
export function TemplateEditor({ template, onSave, onCancel }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const [draft, setDraft] = useState<SheetTemplate>(template)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const fields = allFields(draft)
  const numberFields = fields.filter((f): f is NumberField => f.kind === 'number')
  const idCount = (id: string) => fields.filter(f => f.id === id).length
  const statFields = fields.filter(f => f.kind === 'number' || f.kind === 'resource')
  const resources = fields.filter(f => f.kind === 'resource')

  const setSections = (sections: SheetTemplate['sections']) => setDraft(d => ({ ...d, sections }))
  const updateSection = (index: number, patch: Partial<SheetTemplate['sections'][number]>) =>
    setSections(draft.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  const move = <T,>(list: T[], from: number, delta: number) => {
    const to = from + delta
    if (to < 0 || to >= list.length) return list
    const copy = [...list]
    ;[copy[from], copy[to]] = [copy[to], copy[from]]
    return copy
  }

  /** The draft as a valid template, ready to use; null (with a message) if something is wrong */
  function finished(): SheetTemplate | null {
    try {
      const own = draft.id.startsWith('builtin:') ? { ...draft, id: newTemplateId() } : draft
      const clean = validateTemplate({ ...own, version: draft.version + 1 })
      setError(null)
      return clean
    } catch (e) {
      setError(e instanceof TemplateError ? e.message : String(e))
      return null
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll">
      <div className="flex flex-col gap-3 pb-24 max-w-4xl mx-auto">
        <Card label={t('builderTemplate.title')}>
          <div className="flex flex-col gap-3">
            <label>
              <span className={labelCls}>{t('builderTemplate.name')}</span>
              <input
                className={inputCls}
                value={localize(draft.name, lang)}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label>
              <span className={labelCls}>{t('builderTemplate.description')}</span>
              <textarea
                className={`${inputCls} py-2 resize-y`}
                rows={2}
                value={localize(draft.description, lang)}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              />
            </label>
            <p className="m-0 text-xs text-fs-ink-muted">{t('builderTemplate.intro')}</p>
          </div>
        </Card>

        {draft.sections.map((section, si) => (
          <Card
            key={si}
            label={localize(section.title, lang) || t('builderTemplate.untitledSection')}
            action={
              <span className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={si === 0}
                  onClick={() => setSections(move(draft.sections, si, -1))}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={si === draft.sections.length - 1}
                  onClick={() => setSections(move(draft.sections, si, 1))}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSections(draft.sections.filter((_, i) => i !== si))}
                >
                  {t('builderTemplate.removeSection')}
                </Button>
              </span>
            }
          >
            <div className="flex flex-col gap-3">
              <label>
                <span className={labelCls}>{t('builderTemplate.sectionTitle')}</span>
                <input
                  className={inputCls}
                  value={localize(section.title, lang)}
                  onChange={e => updateSection(si, { title: e.target.value })}
                />
              </label>
              {section.fields.map((field, fi) => (
                <FieldEditor
                  key={fi}
                  field={field}
                  numberFields={numberFields.filter(f => f.id !== field.id)}
                  duplicateId={idCount(field.id) > 1}
                  first={fi === 0}
                  last={fi === section.fields.length - 1}
                  onChange={updated =>
                    updateSection(si, { fields: section.fields.map((f, i) => (i === fi ? updated : f)) })
                  }
                  onMove={delta => updateSection(si, { fields: move(section.fields, fi, delta) })}
                  onRemove={() => updateSection(si, { fields: section.fields.filter((_, i) => i !== fi) })}
                />
              ))}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-fs-ink-muted mr-1">{t('builderTemplate.addField')}</span>
                {KINDS.map(kind => (
                  <Button
                    key={kind}
                    size="sm"
                    onClick={() =>
                      updateSection(si, { fields: [...section.fields, newField(kind, new Set(fields.map(f => f.id)))] })
                    }
                  >
                    + {t(`builderTemplate.kind.${kind}`)}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ))}

        <Button
          className="self-start"
          onBar
          onClick={() =>
            setSections([...draft.sections, { id: `section${Date.now().toString(36)}`, title: '', fields: [] }])
          }
        >
          + {t('builderTemplate.addSection')}
        </Button>

        <Card label={t('builderTemplate.settings')}>
          <div className="flex flex-col gap-3">
            <div>
              <span className={labelCls}>{t('builderTemplate.headerFields')}</span>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map(i => (
                  <select
                    key={i}
                    className={`${inputCls} w-auto min-w-36`}
                    value={draft.headerFields?.[i] ?? ''}
                    onChange={e => {
                      const header = [...(draft.headerFields ?? [])]
                      header[i] = e.target.value
                      setDraft(d => ({ ...d, headerFields: header.filter(Boolean) }))
                    }}
                  >
                    <option value="">—</option>
                    {statFields.map(f => (
                      <option key={f.id} value={f.id}>
                        {localize(f.label, lang) || f.id}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
            <label>
              <span className={labelCls}>{t('builderTemplate.healthField')}</span>
              <select
                className={`${inputCls} w-auto min-w-36`}
                value={draft.healthField ?? ''}
                onChange={e => setDraft(d => ({ ...d, healthField: e.target.value || undefined }))}
              >
                <option value="">—</option>
                {resources.map(f => (
                  <option key={f.id} value={f.id}>
                    {localize(f.label, lang) || f.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelCls}>{t('builderTemplate.initiative')}</span>
              <input
                className={`${inputCls} font-mono`}
                value={draft.initiative === undefined ? '' : String(draft.initiative)}
                aria-invalid={draft.initiative !== undefined && !isValidFormula(draft.initiative)}
                placeholder="0"
                onChange={e =>
                  setDraft(d => ({ ...d, initiative: e.target.value.trim() === '' ? undefined : e.target.value }))
                }
              />
            </label>
            <label>
              <span className={labelCls}>{t('builderTemplate.combatActions')}</span>
              <input
                className={inputCls}
                value={(draft.combatActions ?? []).map(a => localize(a, lang)).join(', ')}
                placeholder={t('builderTemplate.combatActionsPlaceholder')}
                onChange={e => setDraft(d => ({ ...d, combatActions: splitList(e.target.value) }))}
              />
            </label>
            <label>
              <span className={labelCls}>{t('builderTemplate.conditions')}</span>
              <input
                className={inputCls}
                value={(draft.conditions ?? []).map(c => localize(c, lang)).join(', ')}
                placeholder={t('builderTemplate.conditionsPlaceholder')}
                onChange={e => setDraft(d => ({ ...d, conditions: splitList(e.target.value) }))}
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Actions stay in reach on long sheets */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 bg-fs-bar border border-fs-bar-line rounded-fs px-3 py-2.5">
        {error && (
          <p role="alert" className="basis-full m-0 text-sm text-fs-danger">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="basis-full m-0 text-sm text-fs-good">
            {message}
          </p>
        )}
        <Button
          onBar
          variant="ghost"
          onClick={() => {
            const ready = finished()
            if (!ready) return
            saveToLibrary(ready)
            setDraft(ready)
            setMessage(t('builderTemplate.savedToLibrary'))
          }}
        >
          {t('builderTemplate.saveToLibrary')}
        </Button>
        <Button
          onBar
          variant="ghost"
          onClick={() => {
            const ready = finished()
            if (ready)
              saveJsonFile(fileName(localize(ready.name, lang)), exportTemplate(ready)).catch(e => setError(String(e)))
          }}
        >
          {t('builderTemplate.export')}
        </Button>
        <span className="flex-1" />
        <Button onBar onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          onBar
          variant="primary"
          onClick={() => {
            const ready = finished()
            if (ready) onSave(ready)
          }}
        >
          {t('builderTemplate.apply')}
        </Button>
      </div>
    </div>
  )
}
