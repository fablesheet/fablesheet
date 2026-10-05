import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { Character, Spell, SpellSchool } from '@fablesheet/core'
import { availableSlotLevels, expendSlot, spellSlotMaximums, startConcentration } from '@fablesheet/core'
import { SPELL_CATALOG } from '@fablesheet/srd-data'
import { gameLabel } from '../../i18n/game'
import { Button } from '../ui/Button'

type Chapter = number | 'library'

const SCHOOLS: SpellSchool[] = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
]
const SCHOOL_COLOR: Record<SpellSchool, string> = {
  Abjuration: '#3f5f8a',
  Conjuration: '#6a4a7a',
  Divination: '#3a6a52',
  Enchantment: '#8a4a6a',
  Evocation: '#8e2b2b',
  Illusion: '#4a5a8a',
  Necromancy: '#4a5a38',
  Transmutation: '#7a6a1a',
}
/** Ribbon colors per chapter: cantrips, levels 1–9 */
const RIBBON_COLORS = [
  '#5a4a38',
  '#7a3a2a',
  '#3f5f7a',
  '#8e2b2b',
  '#4f7a3a',
  '#6a4a7a',
  '#7a6a1a',
  '#3a5a5a',
  '#5a3a5a',
  '#8a5a2a',
]

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

export function SpellbookView({ character, onUpdate }: Props) {
  const { t, i18n } = useTranslation()
  const known = useMemo(() => new Set([...character.knownSpells, ...character.preparedSpells]), [character])
  const bookSpells = useMemo(() => SPELL_CATALOG.filter(s => known.has(s.id)), [known])
  const chapters = useMemo(() => [...new Set(bookSpells.map(s => s.level))].sort((a, b) => a - b), [bookSpells])

  const [chapter, setChapter] = useState<Chapter>(() => chapters[0] ?? 'library')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [narrowPage, setNarrowPage] = useState<'list' | 'detail'>('list')
  const [flip, setFlip] = useState<{ key: number; dir: 'next' | 'prev' }>({ key: 0, dir: 'next' })
  const [castMessage, setCastMessage] = useState<string | null>(null)

  // Library filters
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [schoolFilter, setSchoolFilter] = useState<SpellSchool | 'all'>('all')

  const order: Chapter[] = [...chapters, 'library']
  const current: Chapter = chapter === 'library' || chapters.includes(chapter) ? chapter : (chapters[0] ?? 'library')

  const pageSpells = useMemo(() => {
    if (current !== 'library') return bookSpells.filter(s => s.level === current)
    const q = search.trim().toLowerCase()
    return SPELL_CATALOG.filter(
      s =>
        (levelFilter === 'all' || s.level === levelFilter) &&
        (schoolFilter === 'all' || s.school === schoolFilter) &&
        (!q || s.name.toLowerCase().includes(q)),
    )
  }, [current, bookSpells, search, levelFilter, schoolFilter])

  const selected = pageSpells.find(s => s.id === selectedId) ?? pageSpells[0] ?? null

  function goTo(next: Chapter) {
    if (next === current) return
    setFlip(f => ({ key: f.key + 1, dir: order.indexOf(next) > order.indexOf(current) ? 'next' : 'prev' }))
    setChapter(next)
    setSelectedId(null)
    setNarrowPage('list')
    setCastMessage(null)
  }

  // Swipe left/right turns to the next/previous chapter
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
    const i = order.indexOf(current) + (dx < 0 ? 1 : -1)
    if (i >= 0 && i < order.length) goTo(order[i])
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  const update = (patch: Partial<Character>) => onUpdate({ ...character, ...patch })
  const isPrepared = (id: string) => character.preparedSpells.includes(id)

  function togglePrepared(spell: Spell) {
    update({
      preparedSpells: isPrepared(spell.id)
        ? character.preparedSpells.filter(id => id !== spell.id)
        : [...character.preparedSpells, spell.id],
    })
  }
  function learn(spell: Spell) {
    if (!known.has(spell.id)) update({ knownSpells: [...character.knownSpells, spell.id] })
  }
  function forget(spell: Spell) {
    update({
      knownSpells: character.knownSpells.filter(id => id !== spell.id),
      preparedSpells: character.preparedSpells.filter(id => id !== spell.id),
    })
    setSelectedId(null)
  }
  /** Casting uses a slot (not for cantrips); concentration spells replace the current concentration. */
  function cast(spell: Spell, slotLevel: number | null) {
    let updated = slotLevel !== null ? expendSlot(character, slotLevel) : character
    const messages = slotLevel !== null ? [t('spellbook.castDone', { level: slotLevel })] : []
    if (spell.concentration) {
      if (character.concentration && character.concentration !== spell.name) {
        messages.push(t('spellbook.concentrationReplaced', { spell: character.concentration }))
      }
      updated = startConcentration(updated, spell.name)
      messages.push(t('spellbook.concentratingOn', { spell: spell.name }))
    }
    onUpdate(updated)
    setCastMessage(messages.join(' '))
  }

  // ── Pages ────────────────────────────────────────────────────────────────────
  const listPage = (
    <Page side="left" number={order.indexOf(current) * 2 + 1}>
      {current === 'library' ? (
        <LibraryFilters
          search={search}
          setSearch={setSearch}
          level={levelFilter}
          setLevel={setLevelFilter}
          school={schoolFilter}
          setSchool={setSchoolFilter}
        />
      ) : (
        <ChapterHeading character={character} level={current} />
      )}
      <ul className="m-0 p-0 list-none flex-1 min-h-0 overflow-y-auto parchment-scroll -mx-1">
        {pageSpells.length === 0 && (
          <li className="text-sm italic text-fs-ink-muted text-center py-8">
            {current === 'library' ? t('spellbook.noMatches') : t('spellbook.noSpellsHint')}
          </li>
        )}
        {pageSpells.map(spell => (
          <li key={spell.id}>
            <button
              onClick={() => {
                setSelectedId(spell.id)
                setNarrowPage('detail')
                setCastMessage(null)
              }}
              className={[
                'fs-focus w-full flex items-center gap-2.5 px-2 py-2 min-h-10 rounded-md text-left bg-transparent border-none cursor-pointer text-sm text-fs-ink',
                selected?.id === spell.id ? 'bg-fs-hover' : 'hover:bg-fs-hover',
              ].join(' ')}
            >
              <span className="size-2 rotate-45 shrink-0" style={{ background: SCHOOL_COLOR[spell.school] }} />
              <span className={`flex-1 min-w-0 truncate ${isPrepared(spell.id) ? 'font-medium' : ''}`}>
                {spell.name}
              </span>
              {spell.concentration && <Badge>{t('spellbook.concentrationShort')}</Badge>}
              {spell.ritual && <Badge>{t('spellbook.ritualShort')}</Badge>}
              {current === 'library'
                ? known.has(spell.id) && <span className="text-fs-good text-xs">✓</span>
                : spell.level > 0 && (
                    <span className={isPrepared(spell.id) ? 'text-fs-brass' : 'text-fs-card-line'} aria-hidden="true">
                      ◆
                    </span>
                  )}
            </button>
          </li>
        ))}
      </ul>
    </Page>
  )

  const detailPage = (
    <Page side="right" number={order.indexOf(current) * 2 + 2}>
      <button
        onClick={() => setNarrowPage('list')}
        className="lg:hidden fs-focus self-start text-sm text-fs-ink-muted bg-transparent border-none cursor-pointer p-0 mb-2"
      >
        ← {current === 'library' ? t('spellbook.library') : chapterName(t, current)}
      </button>
      {selected ? (
        <SpellDetail
          spell={selected}
          showContentNote={i18n.resolvedLanguage !== 'en'}
          actions={
            current === 'library' ? (
              known.has(selected.id) ? (
                <span className="text-sm text-fs-good">{t('spellbook.knownBadge')}</span>
              ) : (
                <Button variant="primary" onClick={() => learn(selected)}>
                  {t('spellbook.learn')}
                </Button>
              )
            ) : (
              <CastActions
                character={character}
                spell={selected}
                prepared={isPrepared(selected.id)}
                onCast={slotLevel => cast(selected, slotLevel)}
                onTogglePrepared={() => togglePrepared(selected)}
                onForget={() => forget(selected)}
                message={castMessage}
              />
            )
          }
        />
      ) : (
        <p className="m-auto text-sm italic text-fs-ink-muted text-center">{t('spellbook.selectSpell')}</p>
      )}
    </Page>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center px-1">
      {/* Ribbon bookmarks */}
      <nav aria-label={t('table.spellbook')} className="relative z-10 flex gap-1 self-end mr-[8%] -mb-1.5">
        {order.map(ch => (
          <Ribbon
            key={ch}
            active={ch === current}
            color={ch === 'library' ? '#9a6a2e' : RIBBON_COLORS[ch]}
            label={ch === 'library' ? '✦' : ch === 0 ? t('spellbook.cantripShort') : String(ch)}
            title={ch === 'library' ? t('spellbook.library') : chapterName(t, ch)}
            onClick={() => goTo(ch)}
          />
        ))}
      </nav>

      {/* The book */}
      <div
        className="flex-1 min-h-0 w-full max-w-6xl flex bg-fs-leather border-fs-leather-dark rounded-xl p-2 lg:p-3 shadow-2xl"
        onTouchStart={e => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={flip.key}
          className={`flex-1 min-h-0 flex ${flip.key > 0 ? (flip.dir === 'next' ? 'animate-page-next' : 'animate-page-prev') : ''}`}
        >
          <div className={`${narrowPage === 'list' ? 'flex' : 'hidden'} lg:flex flex-1 min-w-0`}>{listPage}</div>
          <div className="hidden lg:block w-px bg-fs-card-line" />
          <div className={`${narrowPage === 'detail' ? 'flex' : 'hidden'} lg:flex flex-1 min-w-0`}>{detailPage}</div>
        </div>
      </div>
    </div>
  )
}

// ── Building blocks ───────────────────────────────────────────────────────────

function chapterName(t: TFunction, level: number) {
  return level === 0 ? t('spellbook.cantrips') : t('spellbook.levelHeading', { level })
}

function Page({ side, number, children }: { side: 'left' | 'right'; number: number; children: ReactNode }) {
  return (
    <section
      className={[
        'flex-1 min-w-0 min-h-0 flex flex-col bg-fs-card text-fs-ink font-ui px-5 pt-5 pb-2 lg:px-7',
        side === 'left' ? 'rounded-lg lg:rounded-r-none' : 'rounded-lg lg:rounded-l-none',
      ].join(' ')}
      style={{
        // Faint shading towards the spine
        backgroundImage:
          side === 'left'
            ? 'linear-gradient(to left, rgba(42,29,18,0.08), transparent 6%)'
            : 'linear-gradient(to right, rgba(42,29,18,0.08), transparent 6%)',
      }}
    >
      {children}
      <div className="text-center text-xs text-fs-ink-muted pt-2 font-display">— {number} —</div>
    </section>
  )
}

function Ribbon({
  active,
  color,
  label,
  title,
  onClick,
}: {
  active: boolean
  color: string
  label: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-current={active ? 'page' : undefined}
      className={`fs-focus w-8 flex items-end justify-center pb-2 border-none cursor-pointer font-display text-xs text-[#f1e6cf] transition-[height] duration-200 ${active ? 'h-14' : 'h-10 hover:h-12'}`}
      style={{ background: color, clipPath: 'polygon(0 0,100% 0,100% 100%,50% 84%,0 100%)' }}
    >
      {label}
    </button>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="text-[0.65rem] font-medium text-fs-brass border border-fs-card-line rounded px-1">{children}</span>
  )
}

function ChapterHeading({ character, level }: { character: Character; level: number }) {
  const { t } = useTranslation()
  const max = level > 0 ? spellSlotMaximums(character.className, character.level)[level - 1] : 0
  const used = level > 0 ? (character.spellSlotsUsed[level - 1] ?? 0) : 0
  return (
    <div className="mb-3">
      <h2 className="font-display text-2xl font-medium m-0">{chapterName(t, level)}</h2>
      <div className="text-xs text-fs-ink-muted mt-1 flex items-center gap-2">
        {level === 0 ? (
          t('spellbook.cantripHint')
        ) : max > 0 ? (
          <>
            {t('sheet.spellSlots')}
            <span className="flex gap-1.5" aria-label={`${max - used} / ${max}`}>
              {Array.from({ length: max }, (_, i) => (
                <span
                  key={i}
                  className={`size-2.5 rotate-45 border-[1.5px] border-fs-brass ${i < max - used ? 'bg-fs-brass' : ''}`}
                />
              ))}
            </span>
          </>
        ) : (
          t('spellbook.noSlotsAtLevel')
        )}
      </div>
    </div>
  )
}

function LibraryFilters({
  search,
  setSearch,
  level,
  setLevel,
  school,
  setSchool,
}: {
  search: string
  setSearch: (v: string) => void
  level: number | 'all'
  setLevel: (v: number | 'all') => void
  school: SpellSchool | 'all'
  setSchool: (v: SpellSchool | 'all') => void
}) {
  const { t } = useTranslation()
  const chip = (active: boolean) =>
    `fs-focus min-w-8 h-8 px-2 rounded-md text-xs border cursor-pointer ${active ? 'bg-fs-accent text-fs-on-accent border-transparent' : 'bg-transparent text-fs-ink-muted border-fs-card-line hover:text-fs-ink'}`
  return (
    <div className="mb-3 flex flex-col gap-2">
      <h2 className="font-display text-2xl font-medium m-0">{t('spellbook.library')}</h2>
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('spellbook.search')}
        aria-label={t('spellbook.search')}
        className="fs-focus w-full min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted"
      />
      <div className="flex flex-wrap gap-1">
        <button className={chip(level === 'all')} onClick={() => setLevel('all')}>
          {t('common.all')}
        </button>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
          <button key={l} className={chip(level === l)} onClick={() => setLevel(l)}>
            {l === 0 ? t('spellbook.cantripShort') : l}
          </button>
        ))}
      </div>
      <select
        value={school}
        onChange={e => setSchool(e.target.value as SpellSchool | 'all')}
        aria-label={t('spellbook.school')}
        className="fs-focus min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3"
      >
        <option value="all">{t('spellbook.allSchools')}</option>
        {SCHOOLS.map(s => (
          <option key={s} value={s}>
            {gameLabel(t, 'school', s)}
          </option>
        ))}
      </select>
    </div>
  )
}

function SpellDetail({
  spell,
  actions,
  showContentNote,
}: {
  spell: Spell
  actions: ReactNode
  showContentNote: boolean
}) {
  const { t } = useTranslation()
  const components = [spell.components.verbal && 'V', spell.components.somatic && 'S', spell.components.material && 'M']
    .filter(Boolean)
    .join(', ')

  return (
    <article className="flex-1 min-h-0 flex flex-col">
      <div className="text-xs tracking-[0.14em] uppercase font-display" style={{ color: SCHOOL_COLOR[spell.school] }}>
        {gameLabel(t, 'school', spell.school)} ·{' '}
        {spell.level === 0 ? t('spellbook.cantrip') : t('spellbook.levelHeading', { level: spell.level })}
        {spell.ritual ? t('spellbook.ritual') : ''}
        {spell.concentration ? t('spellbook.concentration') : ''}
      </div>
      <h2 className="font-display text-3xl font-medium m-0 mt-1 mb-3">{spell.name}</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 m-0 text-sm">
        {[
          [t('spellbook.castingTime'), spell.castingTime],
          [t('spellbook.range'), spell.range],
          [
            t('spellbook.components'),
            components + (spell.components.material ? ` (${spell.components.material})` : ''),
          ],
          [t('spellbook.duration'), spell.duration],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-fs-ink-muted">{label}</dt>
            <dd className="m-0">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="h-px bg-fs-card-line my-3" />
      <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll pr-1 text-[0.95rem] leading-relaxed">
        <p className="m-0">{spell.description}</p>
        {spell.higherLevels && (
          <p className="mt-3 mb-0">
            <span className="font-medium text-fs-danger">{t('spellbook.atHigherLevels')}</span>
            {spell.higherLevels}
          </p>
        )}
        {showContentNote && <p className="mt-3 mb-0 text-xs italic text-fs-ink-muted">{t('spellbook.contentNote')}</p>}
      </div>
      <div className="pt-3 flex flex-wrap items-center gap-2">{actions}</div>
    </article>
  )
}

function CastActions({
  character,
  spell,
  prepared,
  onCast,
  onTogglePrepared,
  onForget,
  message,
}: {
  character: Character
  spell: Spell
  prepared: boolean
  onCast: (slotLevel: number | null) => void
  onTogglePrepared: () => void
  onForget: () => void
  message: string | null
}) {
  const { t } = useTranslation()
  const levels = availableSlotLevels(character, spell.level)
  const [slot, setSlot] = useState<number | null>(null)
  const chosen = slot !== null && levels.includes(slot) ? slot : levels[0]

  return (
    <>
      {spell.level === 0 ? (
        spell.concentration ? (
          <Button variant="primary" onClick={() => onCast(null)}>
            {t('spellbook.cast')}
          </Button>
        ) : (
          <span className="text-sm text-fs-ink-muted">{t('spellbook.cantripHint')}</span>
        )
      ) : levels.length > 0 ? (
        <span className="flex items-center gap-1.5">
          <Button variant="primary" onClick={() => onCast(chosen)}>
            {t('spellbook.cast')}
          </Button>
          <select
            value={chosen}
            onChange={e => setSlot(Number(e.target.value))}
            aria-label={t('spellbook.slotLevel')}
            className="fs-focus min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-2"
          >
            {levels.map(l => (
              <option key={l} value={l}>
                {t('spellbook.castAt', { level: l })}
              </option>
            ))}
          </select>
        </span>
      ) : (
        <span className="text-sm text-fs-danger">{t('spellbook.noSlotsLeft')}</span>
      )}
      {spell.level > 0 && (
        <Button variant={prepared ? 'secondary' : 'ghost'} aria-pressed={prepared} onClick={onTogglePrepared}>
          {prepared ? t('spellbook.preparedBadge') : t('spellbook.prepareButton')}
        </Button>
      )}
      <span className="flex-1" />
      <Button variant="ghost" size="sm" onClick={onForget}>
        {t('spellbook.forget')}
      </Button>
      {message && (
        <span role="status" className="basis-full text-sm text-fs-good">
          {message}
        </span>
      )}
    </>
  )
}
