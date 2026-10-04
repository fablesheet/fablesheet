import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AbilityName, Character, RollMode, RollResult } from '@fablesheet/core'
import {
  DIE_SIZES,
  equippedAttacks,
  parseDice,
  rollD20,
  rollExpression,
  savingThrowBonus,
  skillBonus,
  formatModifier,
} from '@fablesheet/core'
import { gameLabel } from '../../i18n/game'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Segmented } from '../ui/Segmented'
import { DieShape } from './DieShape'

const ABILITIES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const MAX_HISTORY = 30
const ROLL_MS = 650

/** Roll history survives switching between table objects during a session */
let sessionHistory: RollResult[] = []

interface Props {
  character: Character
}

export function DiceView({ character }: Props) {
  const { t } = useTranslation()
  const [pool, setPool] = useState<Record<number, number>>({})
  const [modifier, setModifier] = useState(0)
  const [mode, setMode] = useState<RollMode>('normal')
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState(false)
  const [history, setHistory] = useState<RollResult[]>(sessionHistory)
  const [rolling, setRolling] = useState(false)
  const [flicker, setFlicker] = useState(0)
  const timers = useRef<number[]>([])

  const latest = history[0] ?? null
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function show(result: RollResult) {
    const next = [result, ...history].slice(0, MAX_HISTORY)
    sessionHistory = next
    setHistory(next)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setRolling(true)
    const interval = window.setInterval(() => setFlicker(f => f + 1), 60)
    timers.current.push(
      window.setTimeout(() => {
        clearInterval(interval)
        setRolling(false)
      }, ROLL_MS),
    )
  }

  function rollPool() {
    const terms = Object.entries(pool)
      .filter(([, count]) => count > 0)
      .map(([sides, count]) => ({ sides: Number(sides), count }))
    if (terms.length === 0) return
    const onlyOneD20 = terms.length === 1 && terms[0].sides === 20 && terms[0].count === 1
    const label =
      terms.map(term => `${term.count}${t('dice.die')}${term.sides}`).join(' + ') +
      (modifier ? ` ${formatModifier(modifier)}` : '')
    show(onlyOneD20 ? rollD20(modifier, mode, label) : rollExpression({ terms, modifier }, label))
  }

  function rollCustom() {
    const expr = parseDice(custom)
    setCustomError(!expr)
    if (expr) show(rollExpression(expr, custom.trim()))
  }

  const check = (label: string, mod: number) => show(rollD20(mod, mode, `${label} (${formatModifier(mod)})`))

  const poolEmpty = Object.values(pool).every(c => !c)
  const attacks = equippedAttacks(character)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr] pb-4">
        <div className="flex flex-col gap-3">
          {/* The tray */}
          <div className="bg-fs-leather rounded-[2rem] p-3 shadow-2xl">
            <div
              className="rounded-[1.6rem] min-h-64 flex flex-col items-center justify-center gap-4 p-6 text-center"
              style={{ background: '#1f2d24', boxShadow: 'inset 0 6px 24px rgba(0,0,0,0.45)' }}
              aria-live="polite"
            >
              {latest ? (
                <>
                  <div className="flex flex-wrap justify-center gap-3">
                    {latest.dice.slice(0, 20).map((d, i) => (
                      <DieShape
                        key={`${history.length}-${i}`}
                        sides={d.sides}
                        value={rolling ? ((d.value + flicker * (i + 3)) % d.sides) + 1 : d.value}
                        rolling={rolling}
                        dropped={!rolling && d.dropped}
                        highlight={
                          !rolling && !d.dropped && d.sides === 20
                            ? d.value === 20
                              ? 'success'
                              : d.value === 1
                                ? 'failure'
                                : null
                            : null
                        }
                      />
                    ))}
                  </div>
                  <div className={rolling ? 'opacity-0' : 'animate-fade-in'}>
                    <div className="font-display text-6xl leading-none text-[#efe4cc]">{latest.total}</div>
                    <div className="text-sm text-[#a9b8a8] mt-2">{latest.label}</div>
                    {latest.critical && (
                      <div
                        className={`text-sm mt-1 ${latest.critical === 'success' ? 'text-[#9fd08a]' : 'text-[#e8a090]'}`}
                      >
                        {latest.critical === 'success' ? t('dice.natural20') : t('dice.natural1')}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[#a9b8a8] m-0">{t('dice.empty')}</p>
              )}
            </div>
          </div>

          {/* Building a roll */}
          <Card label={t('dice.roll')}>
            <div className="flex flex-wrap gap-2">
              {DIE_SIZES.map(sides => (
                <button
                  key={sides}
                  onClick={() => setPool(p => ({ ...p, [sides]: Math.min(20, (p[sides] ?? 0) + 1) }))}
                  aria-label={t('dice.addDie', { sides })}
                  className="fs-focus relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-transparent border border-transparent cursor-pointer hover:bg-fs-hover"
                >
                  <DieShape sides={sides} size="sm" />
                  <span className="text-xs text-fs-ink-muted">
                    {t('dice.die')}
                    {sides}
                  </span>
                  {(pool[sides] ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-fs-ink text-fs-card text-xs flex items-center justify-center">
                      {pool[sides]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1" aria-label={t('dice.modifier')}>
                <Button size="sm" onClick={() => setModifier(m => m - 1)} aria-label={t('dice.minus')}>
                  −
                </Button>
                <span className="font-display w-10 text-center">{formatModifier(modifier)}</span>
                <Button size="sm" onClick={() => setModifier(m => m + 1)} aria-label={t('dice.plus')}>
                  +
                </Button>
              </div>
              <Segmented<RollMode>
                label={t('dice.mode')}
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'normal', label: t('dice.normal') },
                  { value: 'advantage', label: t('dice.advantage') },
                  { value: 'disadvantage', label: t('dice.disadvantage') },
                ]}
              />
              <span className="flex-1" />
              {!poolEmpty && (
                <Button variant="ghost" onClick={() => setPool({})}>
                  {t('dice.clear')}
                </Button>
              )}
              <Button variant="primary" onClick={rollPool} disabled={poolEmpty}>
                {t('dice.rollButton')}
              </Button>
            </div>
            <p className="text-xs text-fs-ink-muted m-0 mt-2">{t('dice.modeHint')}</p>

            <form
              className="flex gap-2 mt-3"
              onSubmit={e => {
                e.preventDefault()
                rollCustom()
              }}
            >
              <input
                value={custom}
                onChange={e => {
                  setCustom(e.target.value)
                  setCustomError(false)
                }}
                placeholder="2d6 + 3"
                aria-label={t('dice.custom')}
                aria-invalid={customError}
                className="fs-focus flex-1 min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted"
              />
              <Button type="submit">{t('dice.rollButton')}</Button>
            </form>
            {customError && <p className="text-sm text-fs-danger m-0 mt-1">{t('dice.invalid')}</p>}
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          {/* Quick rolls from the character */}
          <Card label={t('dice.fromCharacter')}>
            <div className="flex flex-wrap gap-1.5">
              <QuickRoll label={t('sheet.initiative')} value={character.initiativeBonus} onRoll={check} />
              {attacks.map(a => (
                <QuickRoll key={a.itemId} label={a.name} value={a.attackBonus} onRoll={check} />
              ))}
              {attacks
                .filter(a => a.damage)
                .map(a => (
                  <button
                    key={`dmg-${a.itemId}`}
                    onClick={() => {
                      const expr = parseDice(a.damage!.replace('−', '-'))
                      if (expr) show(rollExpression(expr, `${a.name}: ${t('table.damage')}`))
                    }}
                    className={quickCls}
                  >
                    {a.name} · {a.damage}
                  </button>
                ))}
            </div>
            <div className="text-xs text-fs-ink-muted mt-3 mb-1.5">{t('sheet.savingThrows')}</div>
            <div className="flex flex-wrap gap-1.5">
              {ABILITIES.map(ab => (
                <QuickRoll
                  key={ab}
                  label={gameLabel(t, 'abilityShort', ab)}
                  value={savingThrowBonus(
                    character.scores[ab],
                    character.savingThrowProficiencies.includes(ab),
                    character.proficiencyBonus,
                  )}
                  onRoll={(_, mod) => check(`${t('table.save')} ${gameLabel(t, 'abilityShort', ab)}`, mod)}
                />
              ))}
            </div>
            <div className="text-xs text-fs-ink-muted mt-3 mb-1.5">{t('sheet.skills')}</div>
            <div className="flex flex-wrap gap-1.5">
              {character.skills.map(skill => (
                <QuickRoll
                  key={skill.name}
                  label={gameLabel(t, 'skill', skill.name)}
                  value={skillBonus(character.scores[skill.ability], skill.proficiency, character.proficiencyBonus)}
                  onRoll={check}
                />
              ))}
            </div>
          </Card>

          <Card
            label={t('dice.history')}
            action={
              history.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    sessionHistory = []
                    setHistory([])
                  }}
                >
                  {t('dice.clear')}
                </Button>
              )
            }
          >
            {history.length === 0 ? (
              <p className="m-0 text-sm italic text-fs-ink-muted">{t('dice.noHistory')}</p>
            ) : (
              <ol className="m-0 p-0 list-none">
                {history.map((r, i) => (
                  <li
                    key={history.length - i}
                    className="flex items-baseline gap-3 py-1.5 border-b border-fs-card-line last:border-b-0 text-sm"
                  >
                    <span className="flex-1 min-w-0 truncate">{r.label}</span>
                    <span className="text-xs text-fs-ink-muted">
                      [{r.dice.map(d => (d.dropped ? `(${d.value})` : d.value)).join(', ')}]
                    </span>
                    <span
                      className={`font-display text-base w-10 text-right ${r.critical === 'success' ? 'text-fs-good' : r.critical === 'failure' ? 'text-fs-danger' : ''}`}
                    >
                      {r.total}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

const quickCls =
  'fs-focus min-h-9 px-2.5 text-sm rounded-md border border-fs-card-line bg-fs-tile text-fs-ink cursor-pointer hover:border-fs-brass'

function QuickRoll({
  label,
  value,
  onRoll,
}: {
  label: string
  value: number
  onRoll: (label: string, mod: number) => void
}) {
  return (
    <button onClick={() => onRoll(label, value)} className={quickCls}>
      {label} <span className="font-display">{formatModifier(value)}</span>
    </button>
  )
}
