import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { Character, Personality } from '@fablesheet/core'
import { Markdown } from './Markdown'

interface Props {
  character: Character
  onBack: () => void
  onUpdate: (c: Character) => void
}

type MarkdownField = 'notes' | 'backstory'

const PERSONALITY_FIELDS: Array<keyof Personality> = ['traits', 'ideals', 'bonds', 'flaws']

export function NotesPage({ character, onBack, onUpdate }: Props) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState(character.notes)
  const [backstory, setBackstory] = useState(character.backstory)
  const [personality, setPersonality] = useState(character.personality)
  const [editing, setEditing] = useState<Record<MarkdownField, boolean>>({
    notes: character.notes.trim() === '',
    backstory: character.backstory.trim() === '',
  })

  // Debounced auto-save, same pattern as the character sheet
  const characterRef = useRef(character)
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    characterRef.current = character
  }, [character])
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])
  useEffect(() => {
    const c = characterRef.current
    if (c.notes === notes && c.backstory === backstory && c.personality === personality) return
    const timer = setTimeout(() => onUpdateRef.current({ ...c, notes, backstory, personality }), 600)
    return () => clearTimeout(timer)
  }, [notes, backstory, personality])

  const textareaCls =
    'w-full font-fell text-body text-ink leading-[1.6] rounded-sm px-3 py-2 bg-[rgba(255,240,180,0.35)] border border-[rgba(100,70,20,0.28)] outline-none focus:border-[rgba(100,70,20,0.55)] focus:bg-[rgba(255,240,180,0.55)] placeholder:text-[rgba(100,70,20,0.35)] resize-none parchment-scroll'
  const labelCls = 'font-cinzel text-deco text-red-ink tracking-[0.2em] uppercase'

  function markdownSection(field: MarkdownField, value: string, setValue: (v: string) => void, rows: number) {
    const isEditing = editing[field]
    return (
      <section className="flex flex-col gap-1.5 min-h-0">
        <div className="flex items-center justify-between">
          <span className={labelCls}>{t(`notes.${field}`)}</span>
          <button
            onClick={() => setEditing(prev => ({ ...prev, [field]: !prev[field] }))}
            className="font-cinzel text-deco tracking-[0.12em] text-[#8a7040] border border-[rgba(100,70,20,0.3)] px-2 py-0.5 rounded-sm cursor-pointer bg-transparent hover:border-[rgba(100,70,20,0.5)] hover:text-[#5a4020]"
          >
            {isEditing ? t('notes.preview') : t('notes.edit')}
          </button>
        </div>
        {isEditing ? (
          <textarea
            className={textareaCls}
            rows={rows}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={t(`notes.${field}Placeholder`)}
            aria-label={t(`notes.${field}`)}
          />
        ) : (
          <div
            className="cursor-text rounded-sm px-3 py-2 border border-transparent hover:border-[rgba(100,70,20,0.2)]"
            onDoubleClick={() => setEditing(prev => ({ ...prev, [field]: true }))}
            title={t('notes.doubleClickToEdit')}
          >
            {value.trim() ? (
              <Markdown>{value}</Markdown>
            ) : (
              <p className="font-fell italic text-[#9a8050]">{t('notes.empty')}</p>
            )}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-dungeon animate-fade-in overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-[clamp(14px,1.8vw,28px)] py-[clamp(8px,1.2vh,16px)] border-b border-[#1e1608] shrink-0 bg-topbar">
        <button
          onClick={onBack}
          className="font-cinzel text-caption tracking-[0.12em] text-[#8a7040] bg-transparent border border-[#2e2010] px-[clamp(12px,1.4vw,22px)] py-[clamp(5px,0.6vh,9px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020] whitespace-nowrap"
        >
          {t('common.return')}
        </button>
        <span className="font-cinzel text-heading text-gold tracking-[0.05em]">
          <Trans
            i18nKey="notes.title"
            values={{ name: character.name }}
            components={{ name: <em className="not-italic text-[#e8ca60]" /> }}
          />
        </span>
        <div className="w-[clamp(100px,10vw,160px)]" />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0 gap-[clamp(8px,1vw,16px)] mx-[clamp(10px,1.2vw,20px)] mt-[clamp(8px,1.2vh,16px)] mb-[clamp(6px,0.8vh,12px)]">
        {/* Personality */}
        <div className="bg-parchment-sheet rounded-sm w-[clamp(240px,26vw,400px)] shrink-0 overflow-y-auto parchment-scroll px-[clamp(14px,1.6vw,24px)] py-[clamp(12px,1.6vh,20px)] flex flex-col gap-[clamp(10px,1.4vh,18px)]">
          <span className="font-cinzel-deco text-heading text-ink">{t('notes.personality')}</span>
          {PERSONALITY_FIELDS.map(field => (
            <label key={field} className="flex flex-col gap-1">
              <span className={labelCls}>{t(`notes.${field}`)}</span>
              <textarea
                className={textareaCls}
                rows={3}
                value={personality[field]}
                onChange={e => setPersonality(prev => ({ ...prev, [field]: e.target.value }))}
              />
            </label>
          ))}
        </div>

        {/* Backstory + notes */}
        <div className="bg-parchment-sheet rounded-sm flex-1 overflow-y-auto parchment-scroll px-[clamp(14px,1.6vw,24px)] py-[clamp(12px,1.6vh,20px)] flex flex-col gap-[clamp(14px,2vh,24px)]">
          {markdownSection('backstory', backstory, setBackstory, 6)}
          {markdownSection('notes', notes, setNotes, 14)}
          <p className="font-fell italic text-deco text-[#9a8050]">{t('notes.markdownHint')}</p>
        </div>
      </div>
    </div>
  )
}
