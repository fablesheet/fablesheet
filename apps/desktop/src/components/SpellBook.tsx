import { useState, useMemo } from 'react'
import type { Character, Spell, SpellSchool } from '@fablesheet/core'
import { SPELL_CATALOG } from '@fablesheet/srd-data'

interface Props {
  character: Character
  onBack: () => void
  onUpdate: (c: Character) => void
}

const SCHOOL_COLOR: Record<string, string> = {
  Abjuration: '#4a6fa5',
  Conjuration: '#7a5c8a',
  Divination: '#3a7a5a',
  Enchantment: '#8a4a6a',
  Evocation: '#8a3020',
  Illusion: '#4a6a8a',
  Necromancy: '#4a5a38',
  Transmutation: '#7a6a1a',
}

const SCHOOL_SYMBOL: Record<string, string> = {
  Abjuration: '◎',
  Conjuration: '◈',
  Divination: '◉',
  Enchantment: '◐',
  Evocation: '◆',
  Illusion: '◌',
  Necromancy: '◑',
  Transmutation: '◒',
}

const ALL_SCHOOLS: SpellSchool[] = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
]

function ordinalSuffix(n: number) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

function componentString(spell: Spell) {
  const parts: string[] = []
  if (spell.components.verbal) parts.push('V')
  if (spell.components.somatic) parts.push('S')
  if (spell.components.material) parts.push('M')
  return parts.join(', ')
}

export function SpellBook({ character, onBack, onUpdate }: Props) {
  const [tab, setTab] = useState<'mine' | 'browse'>('mine')
  const [preparedSpells, setPreparedSpells] = useState<string[]>(character.preparedSpells)
  const [knownSpells, setKnownSpells] = useState<string[]>(character.knownSpells)

  // Browse filters
  const [browseLevel, setBrowseLevel] = useState<number | 'all'>('all')
  const [browseSchool, setBrowseSchool] = useState<SpellSchool | 'all'>('all')
  const [browseSearch, setBrowseSearch] = useState('')

  const characterSpells = useMemo(() => {
    if (tab === 'mine') {
      const ids = new Set([...knownSpells, ...preparedSpells])
      return SPELL_CATALOG.filter(s => ids.has(s.id))
    }
    // browse tab: filter the full catalog
    return SPELL_CATALOG.filter(s => {
      if (browseLevel !== 'all' && s.level !== browseLevel) return false
      if (browseSchool !== 'all' && s.school !== browseSchool) return false
      if (browseSearch.trim()) {
        const q = browseSearch.toLowerCase()
        if (!s.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tab, knownSpells, preparedSpells, browseLevel, browseSchool, browseSearch])

  const [selected, setSelected] = useState<Spell | null>(() => {
    const ids = new Set([...character.knownSpells, ...character.preparedSpells])
    return SPELL_CATALOG.find(s => ids.has(s.id)) ?? null
  })

  const grouped = useMemo(() => {
    const g: Record<number, Spell[]> = {}
    for (const spell of characterSpells) {
      ;(g[spell.level] ??= []).push(spell)
    }
    return g
  }, [characterSpells])

  const isPrepared = (id: string) => preparedSpells.includes(id)
  const isKnown = (id: string) => knownSpells.includes(id)

  function togglePrepared(spell: Spell) {
    if (spell.level === 0) return
    const updated = isPrepared(spell.id) ? preparedSpells.filter(id => id !== spell.id) : [...preparedSpells, spell.id]
    setPreparedSpells(updated)
    onUpdate({ ...character, knownSpells, preparedSpells: updated })
  }

  function learnSpell(spell: Spell) {
    if (isKnown(spell.id)) return
    const updatedKnown = [...knownSpells, spell.id]
    setKnownSpells(updatedKnown)
    onUpdate({ ...character, knownSpells: updatedKnown, preparedSpells })
  }

  function forgetSpell(spell: Spell) {
    if (!isKnown(spell.id)) return
    const updatedKnown = knownSpells.filter(id => id !== spell.id)
    const updatedPrepared = preparedSpells.filter(id => id !== spell.id)
    setKnownSpells(updatedKnown)
    setPreparedSpells(updatedPrepared)
    onUpdate({ ...character, knownSpells: updatedKnown, preparedSpells: updatedPrepared })
  }

  // Tab button style helper
  const tabBtnCls = (active: boolean) =>
    [
      'font-cinzel text-deco tracking-[0.15em] px-[clamp(10px,1.2vw,18px)] py-[clamp(3px,0.4vh,6px)]',
      'rounded-sm border cursor-pointer transition-colors',
      active
        ? 'text-[#3e2208] border-[rgba(100,70,20,0.45)] bg-[rgba(90,60,10,0.22)]'
        : 'text-[rgba(100,70,20,0.55)] border-[rgba(100,70,20,0.18)] bg-transparent hover:text-[#6a4820] hover:border-[rgba(100,70,20,0.32)]',
    ].join(' ')

  const filterBtnCls = (active: boolean) =>
    [
      'font-cinzel text-deco px-1.5 py-0.5 rounded-sm border cursor-pointer transition-colors',
      active
        ? 'text-[#3e2208] border-[rgba(100,70,20,0.5)] bg-[rgba(90,60,10,0.2)]'
        : 'text-[rgba(100,70,20,0.45)] border-[rgba(100,70,20,0.18)] bg-transparent hover:text-[#6a4820] hover:border-[rgba(100,70,20,0.35)]',
    ].join(' ')

  return (
    <div className="w-screen h-screen flex flex-col bg-dungeon-dark animate-fade-in">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-[clamp(16px,2vw,32px)] py-[clamp(8px,1.2vh,16px)] border-b border-[#1e1608] shrink-0">
        <button
          onClick={onBack}
          className="font-cinzel text-caption tracking-[0.12em] text-[#8a7040] bg-transparent border border-[#2e2010] px-[clamp(12px,1.4vw,22px)] py-[clamp(5px,0.6vh,10px)] cursor-pointer rounded-sm transition-colors hover:text-gold hover:border-[#5a4020]"
        >
          ← Return
        </button>
        <div className="text-center">
          <span className="block font-cinzel text-heading text-gold tracking-[0.05em]">
            Spellbook of <em className="not-italic text-[#e8ca60]">{character.name}</em>
          </span>
          <span className="block font-fell-sc text-badge text-[#5a4a28] tracking-[0.12em] mt-0.5">
            {character.race} {character.className} · Level {character.level}
            &ensp;·&ensp;{preparedSpells.length} prepared
          </span>
        </div>
        <div className="w-[clamp(100px,10vw,160px)]" /> {/* spacer */}
      </div>

      {/* ── Book ── */}
      <div className="flex-1 flex items-center justify-center px-[clamp(20px,3vw,48px)] py-[clamp(12px,2vh,28px)] min-h-0">
        <div className="flex h-full max-h-[min(88vh,820px)] rounded-[2px_6px_6px_2px] shadow-book">
          {/* ── Left page — spell index ── */}
          <div className="bg-parchment-page-left flex flex-col w-[clamp(340px,32vw,620px)] h-full px-[clamp(16px,1.8vw,28px)] py-[clamp(16px,2.2vh,30px)] overflow-hidden">
            {/* Tab toggle */}
            <div className="flex items-center gap-2 mb-[clamp(4px,0.6vh,8px)]">
              <button className={tabBtnCls(tab === 'mine')} onClick={() => setTab('mine')}>
                My Spells
              </button>
              <button className={tabBtnCls(tab === 'browse')} onClick={() => setTab('browse')}>
                Browse All
              </button>
            </div>

            <div className="deco-rule my-[clamp(4px,0.7vh,9px)]" />

            {/* Browse filters (only in browse tab) */}
            {tab === 'browse' && (
              <div className="shrink-0 mb-[clamp(4px,0.6vh,8px)] flex flex-col gap-[clamp(4px,0.5vh,7px)]">
                {/* Search input */}
                <input
                  type="text"
                  placeholder="Search spells…"
                  value={browseSearch}
                  onChange={e => setBrowseSearch(e.target.value)}
                  className="w-full font-fell-sc text-body text-ink rounded-sm px-2 py-[clamp(2px,0.3vh,5px)] bg-[rgba(255,240,180,0.35)] border border-[rgba(100,70,20,0.28)] outline-none focus:border-[rgba(100,70,20,0.55)] focus:bg-[rgba(255,240,180,0.55)] placeholder:text-[rgba(100,70,20,0.35)]"
                />
                {/* Level filter */}
                <div className="flex flex-wrap gap-1">
                  <button className={filterBtnCls(browseLevel === 'all')} onClick={() => setBrowseLevel('all')}>
                    All
                  </button>
                  <button className={filterBtnCls(browseLevel === 0)} onClick={() => setBrowseLevel(0)}>
                    C
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                    <button key={l} className={filterBtnCls(browseLevel === l)} onClick={() => setBrowseLevel(l)}>
                      {l}
                    </button>
                  ))}
                </div>
                {/* School filter */}
                <div className="flex flex-wrap gap-1">
                  <button className={filterBtnCls(browseSchool === 'all')} onClick={() => setBrowseSchool('all')}>
                    All
                  </button>
                  {ALL_SCHOOLS.map(sc => (
                    <button
                      key={sc}
                      className={filterBtnCls(browseSchool === sc)}
                      style={
                        browseSchool === sc
                          ? { color: SCHOOL_COLOR[sc], borderColor: `${SCHOOL_COLOR[sc]}88` }
                          : undefined
                      }
                      onClick={() => setBrowseSchool(sc)}
                      title={sc}
                    >
                      {SCHOOL_SYMBOL[sc]}
                    </button>
                  ))}
                </div>
                <div className="deco-rule-subtle" />
              </div>
            )}

            {/* Spell list */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 parchment-scroll min-h-0">
              {tab === 'mine' && characterSpells.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9a8050] py-10">
                  <div className="text-[2rem] opacity-30">✦</div>
                  <p className="font-fell italic text-body text-center leading-[1.5] px-4">
                    No spells learned yet.
                    <br />
                    Switch to Browse All to learn spells.
                  </p>
                </div>
              )}
              {tab === 'browse' && characterSpells.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9a8050] py-10">
                  <div className="text-[2rem] opacity-30">◌</div>
                  <p className="font-fell italic text-body text-center leading-[1.5] px-4">
                    No spells match your filters.
                  </p>
                </div>
              )}
              {Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([lvl, spells]) => (
                  <div key={lvl} className="mb-[clamp(8px,1.2vh,16px)]">
                    <div className="font-cinzel text-badge text-red-ink uppercase tracking-[0.28em] pb-1 mb-0.5 border-b border-[rgba(139,26,26,0.25)]">
                      {Number(lvl) === 0 ? 'Cantrips' : `${lvl}${ordinalSuffix(Number(lvl))} Level`}
                    </div>
                    {spells.map(spell => (
                      <div
                        key={spell.id}
                        className={[
                          'flex items-center gap-[clamp(5px,0.6vw,10px)] w-full',
                          'px-[clamp(5px,0.6vw,10px)] py-[clamp(3px,0.5vh,8px)]',
                          'rounded-sm transition-colors',
                          selected?.id === spell.id ? 'bg-[rgba(90,60,10,0.18)]' : 'hover:bg-[rgba(90,60,10,0.10)]',
                        ].join(' ')}
                      >
                        {/* School symbol */}
                        <span
                          className="text-caption w-[clamp(14px,1.2vw,20px)] text-center shrink-0"
                          style={{ color: SCHOOL_COLOR[spell.school] }}
                        >
                          {SCHOOL_SYMBOL[spell.school]}
                        </span>

                        {/* Spell name — click to view detail */}
                        <button
                          onClick={() => setSelected(spell)}
                          className={`font-fell-sc text-body text-ink flex-1 leading-[1.3] text-left bg-transparent border-none cursor-pointer p-0 ${tab === 'mine' && isPrepared(spell.id) ? 'font-bold' : ''}`}
                        >
                          {spell.name}
                        </button>

                        {spell.concentration && (
                          <span className="font-cinzel text-deco text-gold-dim bg-[rgba(100,70,20,0.14)] px-1 py-0.5 rounded-sm shrink-0">
                            C
                          </span>
                        )}
                        {spell.ritual && (
                          <span className="font-cinzel text-deco text-gold-dim bg-[rgba(100,70,20,0.14)] px-1 py-0.5 rounded-sm shrink-0">
                            R
                          </span>
                        )}

                        {tab === 'mine' && spell.level > 0 && (
                          /* Prepare toggle — only for levelled spells in "mine" tab */
                          <button
                            onClick={() => togglePrepared(spell)}
                            className={[
                              'shrink-0 font-cinzel text-deco px-1.5 py-0.5 rounded-sm border cursor-pointer transition-colors',
                              isPrepared(spell.id)
                                ? 'text-[#4a7028] border-[rgba(74,112,40,0.4)] bg-[rgba(74,112,40,0.12)] hover:bg-[rgba(74,112,40,0.2)]'
                                : 'text-[rgba(100,70,20,0.35)] border-[rgba(100,70,20,0.2)] bg-transparent hover:text-[#8a7040] hover:border-[rgba(100,70,20,0.4)]',
                            ].join(' ')}
                            title={isPrepared(spell.id) ? 'Unprepare' : 'Prepare'}
                          >
                            ✦
                          </button>
                        )}

                        {tab === 'browse' &&
                          (isKnown(spell.id) ? (
                            <span
                              className="shrink-0 font-cinzel text-deco text-[#4a7028] px-1 py-0.5"
                              title="Already known"
                            >
                              ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                learnSpell(spell)
                                setSelected(spell)
                              }}
                              className="shrink-0 font-cinzel text-deco text-[#8a7040] border border-[rgba(100,70,20,0.28)] px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors hover:text-gold hover:border-[rgba(200,168,75,0.5)] bg-[rgba(90,60,10,0.06)]"
                              title="Learn this spell"
                            >
                              +
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className="font-cinzel text-deco text-[#9a8050] text-center mt-[clamp(6px,1vh,14px)] tracking-[0.2em] shrink-0">
              I
            </div>
          </div>

          {/* ── Spine ── */}
          <div className="bg-leather-spine flex flex-col items-center justify-evenly w-[clamp(24px,2.2vw,40px)] h-full shrink-0 py-[clamp(20px,3vh,40px)]">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-[55%] h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(140,90,40,0.6), transparent)' }}
              />
            ))}
          </div>

          {/* ── Right page — spell detail ── */}
          <div className="bg-parchment-page-right flex flex-col w-[clamp(340px,32vw,620px)] h-full px-[clamp(16px,1.8vw,28px)] py-[clamp(16px,2.2vh,30px)] overflow-hidden">
            {selected ? (
              <>
                <div className="mb-[clamp(4px,0.7vh,8px)]">
                  <div
                    className="font-cinzel text-badge tracking-[0.22em] uppercase mb-1"
                    style={{ color: SCHOOL_COLOR[selected.school] }}
                  >
                    {SCHOOL_SYMBOL[selected.school]}&nbsp;{selected.school}
                  </div>
                  <h2
                    className="font-cinzel-deco text-display text-ink leading-[1.2] mb-1"
                    style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.2)' }}
                  >
                    {selected.name}
                  </h2>
                  <div className="font-fell-sc text-caption text-[#6b4020] italic">
                    {selected.level === 0 ? 'Cantrip' : `${selected.level}${ordinalSuffix(selected.level)}-Level Spell`}
                    {selected.ritual ? ' · Ritual' : ''}
                    {selected.concentration ? ' · Concentration' : ''}
                  </div>
                </div>

                <div className="deco-rule my-[clamp(4px,0.7vh,9px)]" />

                <div className="grid grid-cols-2 gap-[clamp(4px,0.6vh,10px)_clamp(10px,1.4vw,22px)] my-[clamp(5px,0.8vh,10px)]">
                  {[
                    { label: 'Casting Time', val: selected.castingTime },
                    { label: 'Range', val: selected.range },
                    { label: 'Components', val: null },
                    { label: 'Duration', val: selected.duration },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="font-cinzel text-deco text-red-ink uppercase tracking-[0.15em]">{label}</span>
                      <span className="font-fell-sc text-body text-ink leading-[1.3]">
                        {val ?? (
                          <>
                            {componentString(selected)}
                            {selected.components.material && (
                              <span className="text-badge text-[#6a4820] italic">
                                &nbsp;({selected.components.material})
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="deco-rule my-[clamp(4px,0.7vh,9px)]" />

                <div className="flex-1 overflow-y-auto pr-1 min-h-0 parchment-scroll">
                  <p className="font-fell text-body text-ink leading-[1.7] text-justify mb-[clamp(6px,1vh,12px)]">
                    {selected.description}
                  </p>
                  {selected.higherLevels && (
                    <div className="font-fell text-caption text-ink-light leading-[1.6] p-[clamp(6px,1vh,12px)_clamp(8px,1vw,14px)] border border-[rgba(100,70,20,0.22)] rounded-sm bg-[rgba(100,70,20,0.05)] mt-2">
                      <span className="font-bold text-red-ink">At Higher Levels. </span>
                      {selected.higherLevels}
                    </div>
                  )}
                </div>

                {/* Action buttons at the bottom */}
                <div className="shrink-0 mt-[clamp(6px,1vh,12px)] flex flex-col gap-2">
                  {tab === 'mine' && selected.level > 0 && (
                    <button
                      onClick={() => togglePrepared(selected)}
                      className={[
                        'font-cinzel text-badge tracking-[0.2em] border px-[clamp(8px,1vw,14px)] py-[clamp(3px,0.4vh,6px)] rounded-sm cursor-pointer transition-colors',
                        isPrepared(selected.id)
                          ? 'text-[#4a7028] border-[rgba(74,112,40,0.4)] bg-[rgba(74,112,40,0.09)] hover:bg-[rgba(74,112,40,0.18)]'
                          : 'text-[#8a7040] border-[rgba(100,70,20,0.3)] bg-[rgba(90,60,10,0.06)] hover:text-gold hover:border-[rgba(100,70,20,0.5)]',
                      ].join(' ')}
                    >
                      {isPrepared(selected.id) ? '✦ Prepared — click to unprepare' : '○ Unprepared — click to prepare'}
                    </button>
                  )}

                  {tab === 'browse' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isKnown(selected.id) ? (
                        <button
                          onClick={() => learnSpell(selected)}
                          className="font-cinzel text-badge tracking-[0.18em] border border-[rgba(100,70,20,0.5)] px-[clamp(10px,1.2vw,18px)] py-[clamp(4px,0.5vh,8px)] rounded-sm cursor-pointer transition-colors text-[#e8d090] hover:border-[rgba(200,168,75,0.6)] hover:text-gold"
                          style={{ background: 'linear-gradient(160deg, #3a2208 0%, #2a1606 100%)' }}
                        >
                          + Learn Spell
                        </button>
                      ) : (
                        <>
                          <span className="font-cinzel text-badge tracking-[0.18em] text-[#4a7028] border border-[rgba(74,112,40,0.35)] px-3 py-[clamp(4px,0.5vh,8px)] rounded-sm bg-[rgba(74,112,40,0.08)]">
                            ✓ Known
                          </span>
                          <button
                            onClick={() => forgetSpell(selected)}
                            className="font-cinzel text-deco text-red-ink border border-[rgba(139,26,26,0.28)] px-3 py-[clamp(4px,0.5vh,8px)] rounded-sm cursor-pointer transition-colors hover:border-[rgba(139,26,26,0.5)] hover:bg-[rgba(139,26,26,0.06)]"
                          >
                            Forget Spell
                          </button>
                        </>
                      )}
                      {isKnown(selected.id) && selected.level > 0 && (
                        <button
                          onClick={() => togglePrepared(selected)}
                          className={[
                            'font-cinzel text-badge tracking-[0.15em] border px-3 py-[clamp(4px,0.5vh,8px)] rounded-sm cursor-pointer transition-colors',
                            isPrepared(selected.id)
                              ? 'text-[#4a7028] border-[rgba(74,112,40,0.4)] bg-[rgba(74,112,40,0.09)] hover:bg-[rgba(74,112,40,0.18)]'
                              : 'text-[#8a7040] border-[rgba(100,70,20,0.3)] bg-[rgba(90,60,10,0.06)] hover:text-gold hover:border-[rgba(100,70,20,0.5)]',
                          ].join(' ')}
                        >
                          {isPrepared(selected.id) ? '✦ Prepared' : '○ Prepare'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#9a8050]">
                <div className="text-[clamp(2rem,3vw,3.5rem)] text-gold opacity-30">✦</div>
                <p className="font-fell italic text-body text-center leading-[1.5]">
                  Select a spell to read its incantation.
                </p>
              </div>
            )}

            <div className="font-cinzel text-deco text-[#9a8050] text-center mt-[clamp(6px,1vh,14px)] tracking-[0.2em] shrink-0">
              II
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
