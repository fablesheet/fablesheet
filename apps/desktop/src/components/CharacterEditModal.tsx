import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { changeLevel, characterFileName, exportCharacter } from '@fablesheet/core'
import { updateCharacter, deleteCharacter } from '../services/api'
import { saveJsonFile } from '../services/files'
import { gameLabel } from '../i18n/game'

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
    const updated: Character = {
      ...changeLevel(character, level),
      name: name.trim(),
      experiencePoints: xp,
      subclass: subclass.trim() || null,
      background: background.trim(),
      alignment,
    }
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

  const inputCls = [
    'w-full font-fell-sc text-body text-ink rounded-sm px-3 py-[clamp(4px,0.5vh,8px)]',
    'bg-[rgba(255,240,180,0.4)] border border-[rgba(100,70,20,0.3)]',
    'outline-none focus:border-[rgba(100,70,20,0.6)] focus:bg-[rgba(255,240,180,0.65)]',
    'placeholder:text-[rgba(100,70,20,0.35)]',
  ].join(' ')

  const labelCls = 'font-cinzel text-deco text-red-ink tracking-[0.2em] uppercase mb-1 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(8,4,0,0.78)]" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 w-[clamp(320px,38vw,520px)] rounded-sm animate-fade-in"
        style={{
          background: 'radial-gradient(ellipse at 60% 30%, #f5e8c8 0%, #e8d5a8 40%, #d4b87a 100%)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.15)',
          border: '1px solid rgba(100,70,20,0.45)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2 pt-[clamp(14px,2vh,24px)] pb-1">
          <span className="text-gold-dim text-deco">✦</span>
          <span className="font-cinzel-deco text-heading text-ink tracking-[0.05em]">{character.name}</span>
          <span className="text-gold-dim text-deco">✦</span>
        </div>
        <div className="font-fell-sc text-badge text-[#7a5820] text-center mb-3 tracking-[0.1em]">
          {gameLabel(t, 'race', character.race)} {gameLabel(t, 'class', character.className)}
        </div>

        <div
          className="h-px mx-6"
          style={{ background: 'linear-gradient(to right, transparent, rgba(100,70,20,0.4), transparent)' }}
        />

        {/* Form */}
        <div className="px-6 pt-4 pb-3 flex flex-col gap-[clamp(10px,1.4vh,18px)]">
          <div>
            <label className={labelCls}>{t('edit.name')}</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} maxLength={60} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('edit.level')}</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                max={20}
                value={level}
                onChange={e => setLevel(Math.max(1, Math.min(20, Number(e.target.value))))}
              />
            </div>
            <div>
              <label className={labelCls}>{t('edit.experience')}</label>
              <input
                className={inputCls}
                type="number"
                min={0}
                value={xp}
                onChange={e => setXp(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('edit.subclass')}</label>
            <input
              className={inputCls}
              value={subclass}
              onChange={e => setSubclass(e.target.value)}
              placeholder={t('edit.subclassPlaceholder')}
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('edit.background')}</label>
              <input
                className={inputCls}
                value={background}
                onChange={e => setBackground(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <label className={labelCls}>{t('edit.alignment')}</label>
              <select className={inputCls} value={alignment} onChange={e => setAlignment(e.target.value)}>
                {ALIGNMENTS.map(a => (
                  <option key={a} value={a}>
                    {gameLabel(t, 'alignment', a)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="font-fell text-caption text-red-ink text-center italic">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 font-cinzel text-caption tracking-[0.12em] text-[#8a7040] border border-[rgba(100,70,20,0.3)] py-[clamp(5px,0.7vh,10px)] rounded-sm cursor-pointer transition-colors hover:border-[rgba(100,70,20,0.5)] hover:text-[#5a4020]"
              style={{ background: 'rgba(90,60,10,0.06)' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-[2] font-cinzel text-caption tracking-[0.12em] text-[#e8d090] border border-[rgba(100,70,20,0.5)] py-[clamp(5px,0.7vh,10px)] rounded-sm cursor-pointer transition-colors hover:border-[rgba(200,168,75,0.6)] hover:text-gold disabled:opacity-40 disabled:cursor-default"
              style={{ background: 'linear-gradient(160deg, #3a2208 0%, #2a1606 100%)' }}
            >
              {saving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </div>
        </div>

        {/* Export */}
        <div className="px-6 pb-[clamp(10px,1.4vh,18px)]">
          <button
            onClick={handleExport}
            className="w-full font-cinzel text-caption tracking-[0.15em] text-[#8a7040] border border-[rgba(100,70,20,0.3)] py-[clamp(5px,0.6vh,9px)] rounded-sm cursor-pointer transition-colors hover:border-[rgba(100,70,20,0.5)] hover:text-[#5a4020]"
            style={{ background: 'rgba(90,60,10,0.06)' }}
          >
            {exported ? t('edit.exported') : t('edit.export')}
          </button>
        </div>

        {/* Divider before danger zone */}
        <div
          className="h-px mx-6"
          style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,26,0.22), transparent)' }}
        />

        {/* Delete zone */}
        <div className="px-6 py-[clamp(10px,1.4vh,18px)]">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full font-cinzel text-caption tracking-[0.15em] text-red-ink border border-[rgba(139,26,26,0.25)] py-[clamp(5px,0.6vh,9px)] rounded-sm cursor-pointer transition-colors hover:border-[rgba(139,26,26,0.5)] hover:bg-[rgba(139,26,26,0.06)]"
            >
              {t('edit.delete')}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-fell text-caption text-[#8a3020] text-center italic">{t('edit.deleteConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 font-cinzel text-deco text-[#8a7040] border border-[rgba(100,70,20,0.3)] py-1.5 rounded-sm cursor-pointer transition-colors hover:border-[rgba(100,70,20,0.5)]"
                  style={{ background: 'rgba(90,60,10,0.06)' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-[2] font-cinzel text-deco text-[#eec0a8] border border-[rgba(139,26,26,0.45)] py-1.5 rounded-sm cursor-pointer transition-colors hover:border-[rgba(139,26,26,0.65)] disabled:opacity-40 disabled:cursor-default"
                  style={{ background: 'linear-gradient(160deg, #4a0808 0%, #360606 100%)' }}
                >
                  {deleting ? t('edit.deleting') : t('edit.deleteYes')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
