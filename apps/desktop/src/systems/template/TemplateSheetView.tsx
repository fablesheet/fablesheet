import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RollResult, RollSpec } from '@fablesheet/core'
import { performRoll } from '@fablesheet/core'
import type { TemplateCharacter } from '@fablesheet/templates'
import { applyTemplate, localize } from '@fablesheet/templates'
import { addToHistory } from '../../components/dice/history'
import { RollToast } from '../../components/dice/RollToast'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { CharacterViewProps } from '../types'
import { TemplateEditor } from './editor/TemplateEditor'
import { FieldView } from './FieldView'

/** A character sheet built from its template; the sheet builder opens from here. */
export function TemplateSheetView({ character, onUpdate }: CharacterViewProps<TemplateCharacter>) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<RollResult | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const { template, values } = character

  const roll = (spec: RollSpec, label: string) => {
    const result = performRoll(spec, label)
    if (!result) return
    addToHistory(result)
    setToast(result)
  }

  if (editing) {
    return (
      <TemplateEditor
        template={template}
        onCancel={() => setEditing(false)}
        onSave={updated => {
          onUpdate(applyTemplate(character, updated, lang))
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="flex-1 min-w-0 text-sm text-fs-bar-muted truncate">
          {t('sheetTemplate.basedOn', { name: localize(template.name, lang) })}
        </span>
        <Button onBar onClick={() => setEditing(true)}>
          ✎ {t('sheetTemplate.editSheet')}
        </Button>
      </div>
      <div className="columns-1 md:columns-2 xl:columns-3 gap-3 pb-4 [&>*]:break-inside-avoid [&>*]:mb-3">
        {template.sections.map(section => (
          <Card key={section.id} label={localize(section.title, lang)}>
            {section.fields.length === 0 ? (
              <p className="m-0 text-sm italic text-fs-ink-muted">{t('sheetTemplate.emptySection')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {section.fields.map(field => (
                  <FieldView
                    key={field.id}
                    field={field}
                    template={template}
                    values={values}
                    onChange={value => onUpdate({ ...character, values: { ...values, [field.id]: value } })}
                    onRoll={roll}
                  />
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
      {template.attribution && <p className="text-xs text-fs-bar-muted m-0 mb-4 max-w-3xl">{template.attribution}</p>}
      {toast && <RollToast result={toast} onClose={closeToast} />}
    </div>
  )
}
