import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { characterFileName, exportCharacter } from '@fablesheet/core'
import type { TemplateCharacter } from '@fablesheet/templates'
import { exportTemplate, localize } from '@fablesheet/templates'
import { deleteCharacter, updateCharacter } from '../../services/api'
import { saveJsonFile } from '../../services/files'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { saveToLibrary } from './library'

interface Props {
  character: TemplateCharacter
  onSaved: (updated: TemplateCharacter) => void
  onDeleted: () => void
  onClose: () => void
}

const inputCls =
  'fs-focus w-full min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted'

/** Name, export (character or its template), saving the template and deleting. */
export function TemplateEditDialog({ character, onSaved, onDeleted, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const [name, setName] = useState(character.name)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const templateName = localize(character.template.name, lang)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const updated = { ...character, name: name.trim() }
    try {
      await updateCharacter(updated.id, updated)
      onSaved(updated)
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  async function exportFile(kind: 'character' | 'template') {
    setError(null)
    try {
      const saved =
        kind === 'character'
          ? await saveJsonFile(characterFileName(character), exportCharacter(character))
          : await saveJsonFile(
              `${templateName.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'template'}.fablesheet-template.json`,
              exportTemplate(character.template),
            )
      if (saved) setStatus(kind === 'character' ? t('edit.exported') : t('builderTemplate.exported'))
    } catch (e) {
      setError(t('edit.exportFailed', { error: String(e) }))
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCharacter(character.id)
      onDeleted()
    } catch (e) {
      setError(String(e))
      setDeleting(false)
    }
  }

  return (
    <Dialog
      title={character.name}
      onClose={onClose}
      width="min(92vw, 500px)"
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-fs-ink-muted">{t('edit.name')}</span>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} maxLength={60} />
        </label>
        <p className="m-0 text-sm text-fs-ink-muted">{t('sheetTemplate.basedOn', { name: templateName })}</p>

        {error && <p className="text-sm text-fs-danger m-0">{error}</p>}
        {status && (
          <p role="status" className="text-sm text-fs-good m-0">
            {status}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-3 mt-1 border-t border-fs-card-line">
          <Button size="sm" onClick={() => exportFile('character')}>
            {t('edit.export')}
          </Button>
          <Button size="sm" onClick={() => exportFile('template')}>
            {t('builderTemplate.export')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              saveToLibrary(character.template)
              setStatus(t('builderTemplate.savedToLibrary'))
            }}
          >
            {t('builderTemplate.saveToLibrary')}
          </Button>
          <span className="flex-1" />
          {!confirmDelete ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              {t('edit.delete')}
            </Button>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-xs text-fs-danger">{t('edit.deleteConfirm')}</span>
              <Button size="sm" onClick={() => setConfirmDelete(false)}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? t('edit.deleting') : t('edit.deleteYes')}
              </Button>
            </span>
          )}
        </div>
      </div>
    </Dialog>
  )
}
