import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character } from '@fablesheet/core'
import { armorClass, CharacterMigrationError, importCharacter } from '@fablesheet/core'
import { createCharacter, getCharacters } from '../services/api'
import { openJsonFile } from '../services/files'
import { LANGUAGES, setLanguage } from '../i18n'
import { gameLabel } from '../i18n/game'
import { CharacterEditModal } from './CharacterEditModal'

interface Props {
  onSelect: (character: Character) => void
  onCreateNew: () => void
}

const CLASS_SYMBOL: Record<string, string> = {
  Wizard: '✦',
  Fighter: '⚔',
  Cleric: '☩',
  Rogue: '◈',
  Ranger: '◎',
  Bard: '♪',
  Paladin: '✠',
  Barbarian: '⚡',
  Druid: '✿',
  Monk: '◯',
  Sorcerer: '✧',
  Warlock: '◆',
}

export function CharacterSelect({ onSelect, onCreateNew }: Props) {
  const { t, i18n } = useTranslation()
  const [savedChars, setSavedChars] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [editingChar, setEditingChar] = useState<Character | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    getCharacters()
      .then(setSavedChars)
      .catch(() => setSavedChars([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleImport() {
    setImportError(null)
    try {
      const file = await openJsonFile()
      if (file === null) return
      const created = await createCharacter(importCharacter(file))
      setSavedChars(prev => [...prev, created])
    } catch (e) {
      if (e instanceof CharacterMigrationError) setImportError(e.message)
      else if (e instanceof SyntaxError) setImportError(t('select.importNotJson'))
      else setImportError(t('select.importFailed', { error: String(e) }))
    }
  }

  function handleSaved(updated: Character) {
    setSavedChars(prev => prev.map(c => (c.id === updated.id ? updated : c)))
    setEditingChar(null)
  }

  function handleDeleted(id: string) {
    setSavedChars(prev => prev.filter(c => c.id !== id))
    setEditingChar(null)
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-[clamp(20px,3vh,48px)] bg-dungeon animate-fade-up">
      {/* ── Header ── */}
      <header className="text-center">
        <div className="font-cinzel text-[#4a3818] text-deco tracking-[0.9em] mb-[clamp(8px,1vh,16px)]">✦ · ⚔ · ✦</div>
        <h1
          className="font-cinzel-deco text-hero text-gold tracking-[0.1em] leading-[1.1]"
          style={{ textShadow: '0 0 40px rgba(200,168,75,0.35), 0 2px 6px rgba(0,0,0,0.8)' }}
        >
          Fablesheet
        </h1>
        <p className="font-fell-sc text-[#7a6035] text-caption tracking-[0.35em] uppercase mt-[clamp(6px,1vh,14px)]">
          {t('select.subtitle')}
        </p>
      </header>

      {/* ── Cards ── */}
      <div className="flex gap-[clamp(14px,1.8vw,36px)] flex-wrap justify-center max-w-[90vw]">
        {loading ? (
          <div className="font-fell text-[#4a3818] text-body animate-pulse">{t('select.loading')}</div>
        ) : (
          <>
            {savedChars.map(char => (
              <CharacterCard key={char.id} char={char} onSelect={onSelect} onEdit={c => setEditingChar(c)} />
            ))}

            {/* New character button */}
            <button
              onClick={onCreateNew}
              className="group relative w-[clamp(160px,14vw,240px)] px-[clamp(12px,1.2vw,20px)] py-[clamp(16px,2vh,28px)] border-2 border-dashed border-[rgba(100,70,20,0.3)] rounded-sm cursor-pointer text-center transition-all duration-200 hover:border-[rgba(200,168,75,0.5)] hover:bg-[rgba(100,70,20,0.06)] hover:-translate-y-1"
            >
              <div className="text-[clamp(1.6rem,2.4vw,3rem)] text-[#4a3818] group-hover:text-gold transition-colors mb-2 leading-none">
                +
              </div>
              <div className="font-cinzel text-caption tracking-widest text-[#5a3818] group-hover:text-gold transition-colors uppercase">
                {t('select.newCharacter')}
              </div>
            </button>

            {/* Import character button */}
            <button
              onClick={handleImport}
              className="group relative w-[clamp(160px,14vw,240px)] px-[clamp(12px,1.2vw,20px)] py-[clamp(16px,2vh,28px)] border-2 border-dashed border-[rgba(100,70,20,0.3)] rounded-sm cursor-pointer text-center transition-all duration-200 hover:border-[rgba(200,168,75,0.5)] hover:bg-[rgba(100,70,20,0.06)] hover:-translate-y-1"
            >
              <div className="text-[clamp(1.6rem,2.4vw,3rem)] text-[#4a3818] group-hover:text-gold transition-colors mb-2 leading-none">
                ↑
              </div>
              <div className="font-cinzel text-caption tracking-widest text-[#5a3818] group-hover:text-gold transition-colors uppercase">
                {t('select.importCharacter')}
              </div>
            </button>
          </>
        )}
      </div>

      {importError && <p className="font-fell text-caption text-red-ink italic">{importError}</p>}

      {/* ── Footer ── */}
      <footer className="flex items-center gap-3 text-[#3a2810] font-fell-sc text-caption">
        <span>✦</span>
        <span
          className="w-[72px] h-px"
          style={{ background: 'linear-gradient(to right, transparent, #4a3018, transparent)' }}
        />
        <div className="flex gap-2" role="group" aria-label={t('common.language')}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={i18n.resolvedLanguage === lang.code}
              className={[
                'font-cinzel text-deco tracking-[0.15em] uppercase bg-transparent border-none cursor-pointer transition-colors',
                i18n.resolvedLanguage === lang.code ? 'text-gold-dim' : 'text-[#4a3818] hover:text-[#8a7040]',
              ].join(' ')}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <span
          className="w-[72px] h-px"
          style={{ background: 'linear-gradient(to right, transparent, #4a3018, transparent)' }}
        />
        <span>✦</span>
      </footer>

      {/* ── Edit modal ── */}
      {editingChar && (
        <CharacterEditModal
          character={editingChar}
          onSaved={handleSaved}
          onDeleted={() => handleDeleted(editingChar.id)}
          onClose={() => setEditingChar(null)}
        />
      )}
    </div>
  )
}

// ── Character card sub-component ─────────────────────────────────────────────

interface CardProps {
  char: Character
  onSelect: (c: Character) => void
  onEdit: (c: Character) => void
}

function CharacterCard({ char, onSelect, onEdit }: CardProps) {
  const { t } = useTranslation()
  return (
    <div className="group relative w-[clamp(160px,14vw,240px)]">
      {/* Main card — click to open sheet */}
      <button
        onClick={() => onSelect(char)}
        className="w-full px-[clamp(12px,1.2vw,20px)] py-[clamp(14px,1.8vh,24px)] bg-parchment-card shadow-card hover:shadow-card-hover rounded-sm cursor-pointer text-center font-fell-sc transition-[transform,box-shadow] duration-200 hover:-translate-y-2 hover:scale-[1.02] active:-translate-y-1 active:scale-[1.01]"
      >
        {/* Corner ornaments */}
        {(['tl', 'bl', 'br'] as const).map(pos => (
          <span
            key={pos}
            className={[
              'absolute text-gold-dim text-deco opacity-60 leading-none pointer-events-none',
              pos === 'tl' ? 'top-1.5 left-2' : pos === 'bl' ? 'bottom-1.5 left-2' : 'bottom-1.5 right-2',
            ].join(' ')}
          >
            ✦
          </span>
        ))}

        <div
          className="text-[clamp(1.6rem,2.4vw,3.2rem)] mb-[clamp(5px,0.8vh,12px)] leading-none text-[#5a3010]"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
        >
          {CLASS_SYMBOL[char.className] ?? '◈'}
        </div>

        <div className="font-fell-sc text-subhead font-semibold text-ink leading-[1.2] mb-1">{char.name}</div>
        <div className="font-fell-sc text-caption text-[#6b4a20] tracking-[0.06em]">
          {gameLabel(t, 'race', char.race)}
        </div>

        <div
          className="h-px my-[clamp(5px,0.8vh,12px)] mx-1"
          style={{ background: 'linear-gradient(to right, transparent, rgba(100,70,20,0.4), transparent)' }}
        />

        <div className="font-fell-sc text-caption text-red-ink italic leading-[1.3]">
          {gameLabel(t, 'class', char.className)}
          {char.subclass ? ` · ${char.subclass}` : ''}
        </div>
        <div className="font-cinzel text-badge text-[#7a5820] tracking-[0.15em] uppercase mt-1">
          {t('common.level', { level: char.level })}
        </div>

        <div
          className="h-px my-[clamp(5px,0.8vh,12px)] mx-1"
          style={{ background: 'linear-gradient(to right, transparent, rgba(100,70,20,0.4), transparent)' }}
        />

        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-cinzel text-deco tracking-[0.1em] text-[#8a6838] uppercase">{t('select.hp')}</span>
            <span className="font-fell-sc text-caption text-red-ink">
              {char.hp.current}/{char.hp.max}
            </span>
          </div>
          <span className="font-fell-sc text-caption text-[#9a8050] mt-1.5">·</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-cinzel text-deco tracking-[0.1em] text-[#8a6838] uppercase">{t('select.ac')}</span>
            <span className="font-fell-sc text-caption text-[#2a4a28]">{armorClass(char)}</span>
          </div>
          <span className="font-fell-sc text-caption text-[#9a8050] mt-1.5">·</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-cinzel text-deco tracking-[0.1em] text-[#8a6838] uppercase">
              {t('select.alignmentShort')}
            </span>
            <span className="font-fell-sc text-caption text-ink-light">
              {char.alignment ? gameLabel(t, 'alignmentShort', char.alignment) : '—'}
            </span>
          </div>
        </div>

        {char.spellcastingAbility && (
          <div className="mt-[clamp(5px,0.8vh,10px)] font-cinzel text-deco tracking-[0.1em] text-gold-dim uppercase">
            {t('select.caster', { ability: gameLabel(t, 'abilityShort', char.spellcastingAbility) })}
          </div>
        )}
      </button>

      {/* Edit button — top-right corner, visible on hover */}
      <button
        onClick={e => {
          e.stopPropagation()
          onEdit(char)
        }}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-sm text-deco text-[#8a7040] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer border border-transparent hover:border-[rgba(100,70,20,0.35)] hover:text-gold hover:bg-[rgba(90,60,10,0.12)]"
        title={t('select.editCharacter')}
        aria-label={t('select.editCharacter')}
      >
        ✎
      </button>
    </div>
  )
}
