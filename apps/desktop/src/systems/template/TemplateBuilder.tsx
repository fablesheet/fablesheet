import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SheetTemplate, TemplateCharacter } from '@fablesheet/templates'
import {
  BUILTIN_TEMPLATES,
  createTemplateCharacter,
  importTemplate,
  localize,
  TemplateError,
} from '@fablesheet/templates'
import { createCharacter } from '../../services/api'
import { openJsonFile } from '../../services/files'
import { Button } from '../../components/ui/Button'
import { loadLibrary, removeFromLibrary, saveToLibrary } from './library'

interface Props {
  onCreated: (character: TemplateCharacter) => void
  onCancel: () => void
}

/** New character for any game: pick a template (built-in, own or from a file) and a name. */
export function TemplateBuilder({ onCreated, onCancel }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const [library, setLibrary] = useState<SheetTemplate[]>(loadLibrary)
  const [selected, setSelected] = useState<SheetTemplate | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleImport() {
    setError(null)
    try {
      const file = await openJsonFile()
      if (file === null) return
      const template = importTemplate(file)
      saveToLibrary(template)
      setLibrary(loadLibrary())
      setSelected(template)
    } catch (e) {
      setError(
        e instanceof TemplateError ? e.message : e instanceof SyntaxError ? t('select.importNotJson') : String(e),
      )
    }
  }

  async function handleCreate() {
    if (!selected || !name.trim()) return
    setCreating(true)
    try {
      onCreated(await createCharacter<TemplateCharacter>(createTemplateCharacter(selected, name.trim(), lang)))
    } catch (e) {
      setError(String(e))
      setCreating(false)
    }
  }

  const card = (template: SheetTemplate, own: boolean) => {
    const active = selected?.id === template.id
    return (
      <li key={template.id} className="relative">
        <button
          type="button"
          aria-pressed={active}
          onClick={() => setSelected(template)}
          className={[
            'fs-focus w-full h-full text-left flex flex-col gap-1.5 p-4 rounded-fs border cursor-pointer transition-transform hover:-translate-y-0.5',
            active ? 'bg-fs-card border-fs-brass ring-2 ring-fs-accent' : 'bg-fs-card border-fs-card-line',
          ].join(' ')}
        >
          <span className="font-display text-base text-fs-ink pr-6">{localize(template.name, lang)}</span>
          {template.description && (
            <span className="text-sm text-fs-ink-muted">{localize(template.description, lang)}</span>
          )}
        </button>
        {own && (
          <button
            type="button"
            onClick={() => {
              removeFromLibrary(template.id)
              setLibrary(loadLibrary())
              if (selected?.id === template.id) setSelected(null)
            }}
            aria-label={t('builderTemplate.removeFromLibrary', { name: localize(template.name, lang) })}
            className="fs-focus absolute top-2 right-2 size-8 rounded-md bg-transparent border-none text-fs-ink-muted cursor-pointer hover:text-fs-danger"
          >
            ✕
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="w-full h-full flex flex-col gap-3 bg-fs-bg p-3 font-ui overflow-hidden animate-fade-in">
      <header className="flex items-center gap-3 bg-fs-bar border border-fs-bar-line rounded-fs px-3 py-2.5">
        <Button onBar variant="ghost" size="sm" onClick={onCancel}>
          ✕ <span className="hidden sm:inline">{t('builder.cancel')}</span>
        </Button>
        <h1 className="flex-1 font-display text-lg font-medium m-0 text-fs-bar-text">
          {t('builderTemplate.pickTemplate')}
        </h1>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto parchment-scroll bg-fs-table border border-fs-table-line rounded-2xl p-4 sm:p-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-5">
          <section>
            <h2 className="fs-section-label text-fs-bar-muted m-0 mb-2 font-normal">{t('builderTemplate.builtin')}</h2>
            <ul className="m-0 p-0 list-none grid gap-3 grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
              {BUILTIN_TEMPLATES.map(tpl => card(tpl, false))}
            </ul>
          </section>
          <section>
            <h2 className="fs-section-label text-fs-bar-muted m-0 mb-2 font-normal">{t('builderTemplate.own')}</h2>
            {library.length > 0 && (
              <ul className="m-0 p-0 list-none grid gap-3 grid-cols-[repeat(auto-fill,minmax(230px,1fr))] mb-3">
                {library.map(tpl => card(tpl, true))}
              </ul>
            )}
            <Button onBar onClick={handleImport}>
              ↑ {t('builderTemplate.import')}
            </Button>
            <p className="text-xs text-fs-bar-muted m-0 mt-2">{t('builderTemplate.ownHint')}</p>
          </section>
          {error && <p className="text-sm text-fs-danger m-0">{error}</p>}
        </div>
      </main>
      <footer className="flex flex-wrap items-center gap-3 bg-fs-bar border border-fs-bar-line rounded-fs px-3 py-2.5">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('builder.namePlaceholder')}
          aria-label={t('builder.characterName')}
          maxLength={60}
          className="fs-focus flex-1 min-w-48 min-h-11 px-3 font-display text-lg text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg placeholder:text-fs-ink-muted placeholder:font-ui placeholder:text-base"
        />
        <Button onBar variant="primary" disabled={!selected || !name.trim() || creating} onClick={handleCreate}>
          {creating ? t('builder.creating') : t('builder.create')}
        </Button>
      </footer>
    </div>
  )
}
