import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { changeLevel, characterFileName, exportCharacter } from '@fablesheet/core'
import { syncFeatures } from '@fablesheet/srd-data'
import { updateCharacter, deleteCharacter } from '../services/api'
import { saveJsonFile } from '../services/files'
import { gameLabel } from '../i18n/game'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
]

interface Props {
  character: Character
  onSaved: (updated: Character) => void
  onDeleted: () => void
  onClose: () => void
}

const inputCls =
  'fs-focus w-full min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted'

export function CharacterEditModal({ character, onSaved, onDeleted, onClose }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState(character.name)
  const [level, setLevel] = useState(character.level)
  const [xp, setXp] = useState(character.experiencePoints)
  const [subclass, setSubclass] = useState(character.subclass ?? '')
  const [background, setBackground] = useState(character.background)
  const [alignment, setAlignment] = useState(character.alignment)

  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exported, setExported] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    // Features follow level and subclass; spent uses are kept
    const updated: Character = syncFeatures({
      ...changeLevel(character, level),
      name: name.trim(),
      experiencePoints: xp,
      subclass: subclass.trim() || null,
      background: background.trim(),
      alignment,
    })
    try {
      await updateCharacter(updated.id, updated)
      onSaved(updated)
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  async function handleExport() {
    setError(null)
    try {
      if (await saveJsonFile(characterFileName(character), exportCharacter(character))) setExported(true)
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

  const field = (label: string, control: React.ReactNode) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-fs-ink-muted">{label}</span>
      {control}
    </label>
  )

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
        {field(
          t('edit.name'),
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} maxLength={60} />,
        )}
        <div className="grid grid-cols-2 gap-3">
          {field(
            t('edit.level'),
            <input
              className={inputCls}
              type="number"
              min={1}
              max={20}
              inputMode="numeric"
              value={level}
              onChange={e => setLevel(Math.max(1, Math.min(20, Number(e.target.value))))}
            />,
          )}
          {field(
            t('edit.experience'),
            <input
              className={inputCls}
              type="number"
              min={0}
              inputMode="numeric"
              value={xp}
              onChange={e => setXp(Math.max(0, Number(e.target.value)))}
            />,
          )}
        </div>
        {field(
          t('edit.subclass'),
          <input
            className={inputCls}
            value={subclass}
            onChange={e => setSubclass(e.target.value)}
            placeholder={t('edit.subclassPlaceholder')}
            maxLength={60}
          />,
        )}
        <div className="grid grid-cols-2 gap-3">
          {field(
            t('edit.background'),
            <input
              className={inputCls}
              value={background}
              onChange={e => setBackground(e.target.value)}
              maxLength={50}
            />,
          )}
          {field(
            t('edit.alignment'),
            <select className={inputCls} value={alignment} onChange={e => setAlignment(e.target.value)}>
              {ALIGNMENTS.map(a => (
                <option key={a} value={a}>
                  {gameLabel(t, 'alignment', a)}
                </option>
              ))}
            </select>,
          )}
        </div>

        {error && <p className="text-sm text-fs-danger m-0">{error}</p>}

        <div className="flex flex-wrap gap-2 pt-3 mt-1 border-t border-fs-card-line">
          <Button size="sm" onClick={handleExport}>
            {exported ? t('edit.exported') : t('edit.export')}
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
