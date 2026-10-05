import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { armorClass, CharacterMigrationError, importCharacter } from '@fablesheet/core'
import logo from '../assets/logo.svg'
import { createCharacter, getCharacters } from '../services/api'
import { openJsonFile } from '../services/files'
import { gameLabel } from '../i18n/game'
import { CharacterEditModal } from './CharacterEditModal'
import { InstallHint } from './InstallHint'
import { SettingsDialog } from './SettingsDialog'
import { Button } from './ui/Button'

interface Props {
  onSelect: (character: Character) => void
  onCreateNew: () => void
}

export function CharacterSelect({ onSelect, onCreateNew }: Props) {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Character | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    getCharacters()
      .then(setCharacters)
      .catch(() => setCharacters([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleImport() {
    setImportError(null)
    try {
      const file = await openJsonFile()
      if (file === null) return
      const created = await createCharacter(importCharacter(file))
      setCharacters(prev => [...prev, created])
    } catch (e) {
      if (e instanceof CharacterMigrationError) setImportError(e.message)
      else if (e instanceof SyntaxError) setImportError(t('select.importNotJson'))
      else setImportError(t('select.importFailed', { error: String(e) }))
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-3 bg-fs-bg p-3 font-ui overflow-hidden animate-fade-in">
      <header className="flex items-center gap-3 px-2 pt-1">
        <img src={logo} alt="" className="size-10 rounded-lg" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-medium leading-tight m-0 text-fs-bar-text">Fablesheet</h1>
          <p className="text-xs text-fs-bar-muted m-0">{t('select.subtitle')}</p>
        </div>
        <Button onBar variant="ghost" onClick={() => setSettingsOpen(true)}>
          ⚙ <span className="hidden sm:inline">{t('settings.title')}</span>
        </Button>
      </header>

      <InstallHint />

      <main
        className="flex-1 min-h-0 overflow-y-auto parchment-scroll bg-fs-table border border-fs-table-line rounded-2xl p-6 lg:p-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at 50% 35%, rgba(201,154,79,0.08), transparent 65%)' }}
      >
        {loading ? (
          <p className="text-fs-bar-muted text-center mt-20 animate-pulse">{t('select.loading')}</p>
        ) : (
          <>
            {characters.length === 0 && (
              <div className="text-center max-w-md mx-auto mt-6 mb-10">
                <h2 className="font-display text-xl font-medium text-fs-bar-text m-0">{t('select.welcomeTitle')}</h2>
                <p className="text-sm text-fs-bar-muted mt-2">{t('select.welcomeText')}</p>
              </div>
            )}
            <ul className="m-0 p-0 list-none flex flex-wrap justify-center gap-5 max-w-6xl mx-auto [&>li]:w-56">
              {characters.map(c => (
                <li key={c.id}>
                  <CharacterCard character={c} onOpen={() => onSelect(c)} onEdit={() => setEditing(c)} />
                </li>
              ))}
              <li>
                <AddCard icon="+" label={t('select.newCharacter')} onClick={onCreateNew} />
              </li>
              <li>
                <AddCard icon="↑" label={t('select.importCharacter')} onClick={handleImport} />
              </li>
            </ul>
            {importError && <p className="text-sm text-fs-danger text-center mt-4">{importError}</p>}
          </>
        )}
      </main>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {editing && (
        <CharacterEditModal
          character={editing}
          onSaved={updated => {
            setCharacters(prev => prev.map(c => (c.id === updated.id ? updated : c)))
            setEditing(null)
          }}
          onDeleted={() => {
            setCharacters(prev => prev.filter(c => c.id !== editing.id))
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function CharacterCard({
  character: c,
  onOpen,
  onEdit,
}: {
  character: Character
  onOpen: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const percent = Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100))
  return (
    <div className="group relative h-full">
      <button
        onClick={onOpen}
        className="fs-focus w-full h-full flex flex-col items-center text-center gap-2 px-4 pt-6 pb-4 bg-fs-card text-fs-ink border border-fs-card-line rounded-fs shadow-lg cursor-pointer transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[-0.6deg]"
      >
        <span className="size-14 rounded-full border-2 border-fs-brass text-fs-brass font-display text-2xl flex items-center justify-center">
          {c.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <span className="font-display text-lg leading-tight mt-1">{c.name}</span>
        <span className="text-xs text-fs-ink-muted">
          {gameLabel(t, 'race', c.race)} · {gameLabel(t, 'class', c.className)} ·{' '}
          {t('common.level', { level: c.level })}
        </span>
        <span className="w-full h-px bg-fs-card-line my-1.5" />
        <span className="w-full grid grid-cols-3 text-xs text-fs-ink-muted">
          <span>
            <span className="block font-display text-base text-fs-ink">
              {c.hp.current}/{c.hp.max}
            </span>
            {t('select.hp')}
          </span>
          <span>
            <span className="block font-display text-base text-fs-ink">{armorClass(c)}</span>
            {t('select.ac')}
          </span>
          <span>
            <span className="block font-display text-base text-fs-ink">
              {c.alignment ? gameLabel(t, 'alignmentShort', c.alignment) : '—'}
            </span>
            {t('select.alignmentShort')}
          </span>
        </span>
        <span className="w-full h-1 rounded-full bg-fs-track overflow-hidden mt-1">
          <span className="block h-full bg-fs-good" style={{ width: `${percent}%` }} />
        </span>
      </button>
      <button
        onClick={onEdit}
        title={t('select.editCharacter')}
        aria-label={t('select.editCharacter')}
        className="fs-focus absolute top-2 right-2 size-9 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-fs-ink-muted opacity-60 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-fs-hover hover:text-fs-ink"
      >
        ✎
      </button>
    </div>
  )
}

function AddCard({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fs-focus w-full h-full min-h-56 flex flex-col items-center justify-center gap-3 rounded-fs border-2 border-dashed border-fs-table-line bg-transparent cursor-pointer text-fs-bar-muted transition-colors hover:border-fs-accent hover:text-fs-accent"
    >
      <span className="text-4xl leading-none">{icon}</span>
      <span className="font-display text-sm tracking-wider">{label}</span>
    </button>
  )
}
