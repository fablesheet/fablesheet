import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, Personality } from '@fablesheet/core'
import { Markdown } from '../Markdown'
import { Button } from '../ui/Button'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

const PERSONALITY: Array<keyof Personality> = ['traits', 'ideals', 'bonds', 'flaws']

/** Faint ruled lines like a notebook page */
const RULED = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(122,98,70,0.16) 27px, rgba(122,98,70,0.16) 28px)',
  backgroundAttachment: 'local' as const,
}

const fieldCls =
  'fs-focus w-full bg-transparent border-none outline-none resize-none text-[0.95rem] leading-[28px] text-fs-ink placeholder:text-fs-ink-muted placeholder:italic'

export function JournalView({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<Character>) => onUpdate({ ...character, ...patch })

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center px-1">
      {/* Green leather notebook with an elastic band */}
      <div className="relative flex-1 min-h-0 w-full max-w-6xl flex flex-col lg:flex-row gap-px bg-[#3a4a3a] rounded-xl p-2 lg:p-3 shadow-2xl overflow-y-auto lg:overflow-visible parchment-scroll">
        <div
          className="hidden lg:block absolute -right-1.5 top-1/3 w-3 h-24 bg-[#2c3a2c] rounded-r-md"
          aria-hidden="true"
        />
        <Page side="left">
          <h2 className="font-display text-xl font-medium m-0 mb-2">{t('notes.personality')}</h2>
          {PERSONALITY.map(field => (
            <label key={field} className="block mb-3">
              <span className="fs-section-label">{t(`notes.${field}`)}</span>
              <textarea
                className={fieldCls}
                style={RULED}
                rows={2}
                value={character.personality[field]}
                onChange={e => update({ personality: { ...character.personality, [field]: e.target.value } })}
              />
            </label>
          ))}
          <MarkdownField
            label={t('notes.backstory')}
            value={character.backstory}
            placeholder={t('notes.backstoryPlaceholder')}
            rows={6}
            onChange={backstory => update({ backstory })}
          />
        </Page>
        <Page side="right">
          <MarkdownField
            label={t('notes.notes')}
            value={character.notes}
            placeholder={t('notes.notesPlaceholder')}
            rows={18}
            grow
            onChange={notes => update({ notes })}
          />
          <p className="text-xs italic text-fs-ink-muted m-0 mt-2">{t('notes.markdownHint')}</p>
        </Page>
      </div>
    </div>
  )
}

function Page({ side, children }: { side: 'left' | 'right'; children: ReactNode }) {
  return (
    <section
      className={[
        'flex-1 min-w-0 lg:min-h-0 flex flex-col bg-fs-card text-fs-ink font-ui px-5 py-5 lg:px-7 lg:overflow-y-auto parchment-scroll',
        side === 'left' ? 'rounded-lg lg:rounded-r-none' : 'rounded-lg lg:rounded-l-none',
      ].join(' ')}
    >
      {children}
    </section>
  )
}

function MarkdownField({
  label,
  value,
  placeholder,
  rows,
  grow = false,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  rows: number
  grow?: boolean
  onChange: (v: string) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(value.trim() === '')

  return (
    <div className={`flex flex-col ${grow ? 'flex-1 min-h-0' : ''}`}>
      <div className="flex items-center gap-3 mb-1">
        <span className="fs-section-label flex-1">{label}</span>
        <Button size="sm" variant="ghost" onClick={() => setEditing(e => !e)}>
          {editing ? t('notes.preview') : t('notes.edit')}
        </Button>
      </div>
      {editing ? (
        <textarea
          className={`${fieldCls} ${grow ? 'flex-1 min-h-64' : ''}`}
          style={RULED}
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div className="py-1 cursor-text" onDoubleClick={() => setEditing(true)} title={t('notes.doubleClickToEdit')}>
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="m-0 italic text-fs-ink-muted">{t('notes.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
