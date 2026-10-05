import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RollMode, RollResult, RollSpec, Sides } from '@fablesheet/core'
import { DIE_SIZES, FUDGE, formatModifier, parseDice, performRoll, rollD20, rollExpression } from '@fablesheet/core'
import type { QuickRollGroup } from '../../systems/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Segmented } from '../ui/Segmented'
import { ChecksCard } from './ChecksCard'
import { DieShape } from './DieShape'
import { describeRoll, dieTone, displayTotal, OUTCOME_COLOR, outcomeText } from './rollText'

const MAX_HISTORY = 30
const ROLL_MS = 650
const POOL_DICE: Sides[] = [...DIE_SIZES, FUDGE]
/** Examples shown in the syntax help */
const EXAMPLES = ['2d6+3', '4d6kh3', '2d20kl1', '3d6!', '8d6>=5', '4dF+2']

/** Roll history survives switching between table objects during a session */
let sessionHistory: RollResult[] = []
function rememberHistory(history: RollResult[]) {
  sessionHistory = history
}

interface Props {
  /** Rolls for the character, e.g. saving throws and skills */
  quickRolls: QuickRollGroup[]
}

/** The dice tray: works for every game system; quick rolls come from the system. */
export function DiceView({ quickRolls: allQuickRolls }: Props) {
  const { t } = useTranslation()
  const quickRolls = allQuickRolls.filter(group => group.rolls.length > 0)
  const [pool, setPool] = useState<Record<string, number>>({})
  const [modifier, setModifier] = useState(0)
  const [mode, setMode] = useState<RollMode>('normal')
  const [explode, setExplode] = useState(false)
  const [successAt, setSuccessAt] = useState('')
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState(false)
  const [history, setHistory] = useState<RollResult[]>(sessionHistory)
  const [rolling, setRolling] = useState(false)
  const [flicker, setFlicker] = useState(0)
  const timers = useRef<number[]>([])

  const latest = history[0] ?? null
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function show(result: RollResult | null) {
    if (!result) return
    const next = [result, ...history].slice(0, MAX_HISTORY)
    rememberHistory(next)
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

  const target = Number(successAt)
  const countsSuccesses = successAt.trim() !== '' && Number.isFinite(target) && target > 0

  function rollPool() {
    const terms = POOL_DICE.filter(sides => (pool[sides] ?? 0) > 0).map(sides => {
      const numeric = sides !== FUDGE
      return `${pool[sides]}d${sides}${explode && numeric ? '!' : ''}${countsSuccesses && numeric ? `>=${target}` : ''}`
    })
    if (terms.length === 0) return
    const expression = `${terms.join('+')}${modifier ? formatModifier(modifier) : ''}`
    const label = expression.replace(/d/g, t('dice.die')).replace(/\+/g, ' + ')
    const single20 = terms.length === 1 && terms[0] === '1d20'
    const expr = parseDice(expression)
    show(single20 ? rollD20(modifier, mode, label) : expr && rollExpression(expr, label))
  }

  function rollCustom() {
    const expr = parseDice(custom)
    setCustomError(!expr)
    if (expr) show(rollExpression(expr, custom.trim()))
  }

  const roll = (spec: RollSpec, label: string) => {
    const suffix = spec.kind === 'd20' ? ` (${formatModifier(spec.modifier)})` : ''
    show(performRoll(spec, `${label}${suffix}`, mode))
  }

  const poolEmpty = Object.values(pool).every(c => !c)
  const outcome = latest && outcomeText(latest, t)

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
                    {latest.dice.slice(0, 24).map((d, i) => (
                      <DieShape
                        key={`${history.length}-${i}`}
                        sides={d.sides}
                        value={
                          rolling
                            ? d.sides === FUDGE
                              ? ((flicker + i) % 3) - 1
                              : ((d.value + flicker * (i + 3)) % d.sides) + 1
                            : d.value
                        }
                        rolling={rolling}
                        dropped={!rolling && d.dropped}
                        highlight={rolling ? null : dieTone(latest, i)}
                      />
                    ))}
                  </div>
                  <div className={rolling ? 'opacity-0' : 'animate-fade-in'}>
                    <div className="font-display text-6xl leading-none text-[#efe4cc]">{displayTotal(latest)}</div>
                    {latest.successes !== undefined && (
                      <div className="text-sm text-[#efe4cc] mt-1">
                        {t('dice.successes', { count: latest.successes })}
                      </div>
                    )}
                    <div className="text-sm text-[#a9b8a8] mt-2">{latest.label}</div>
                    {outcome && (
                      <div
                        className={`text-base mt-1 font-display ${latest.outcome?.kind ? OUTCOME_COLOR[latest.outcome.kind] : 'text-[#efe4cc]'}`}
                      >
                        {outcome}
                      </div>
                    )}
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
              {POOL_DICE.map(sides => (
                <button
                  key={sides}
                  onClick={() => setPool(p => ({ ...p, [sides]: Math.min(30, (p[sides] ?? 0) + 1) }))}
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
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
              <label className="flex items-center gap-2 min-h-9">
                <input type="checkbox" checked={explode} onChange={e => setExplode(e.target.checked)} />
                {t('dice.explode')}
              </label>
              <label className="flex items-center gap-2 min-h-9">
                {t('dice.countSuccesses')}
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={successAt}
                  onChange={e => setSuccessAt(e.target.value)}
                  placeholder="—"
                  aria-label={t('dice.countSuccesses')}
                  className="fs-focus w-16 min-h-9 text-sm text-center text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-1"
                />
              </label>
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
            <details className="mt-2 text-xs text-fs-ink-muted">
              <summary className="cursor-pointer select-none">{t('dice.syntax')}</summary>
              <ul className="m-0 mt-2 pl-0 list-none grid gap-1 sm:grid-cols-2">
                {EXAMPLES.map(example => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustom(example)
                        setCustomError(false)
                      }}
                      className="fs-focus font-mono text-fs-ink bg-transparent border-none p-0 cursor-pointer underline decoration-fs-card-line underline-offset-2"
                    >
                      {example}
                    </button>{' '}
                    — {t(`dice.example.${EXAMPLES.indexOf(example)}`)}
                  </li>
                ))}
              </ul>
            </details>
          </Card>

          <ChecksCard onRoll={(spec, label) => show(performRoll(spec, label, mode))} />
        </div>

        <div className="flex flex-col gap-3">
          {/* Quick rolls from the character, provided by the game system */}
          {quickRolls.length > 0 && (
            <Card label={t('dice.fromCharacter')}>
              {quickRolls.map((group, gi) => (
                <div key={group.title}>
                  <div className={`text-xs text-fs-ink-muted mb-1.5 ${gi > 0 ? 'mt-3' : ''}`}>{group.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.rolls.map(quick => (
                      <button key={quick.label} onClick={() => roll(quick.roll, quick.label)} className={quickCls}>
                        {quick.short ?? quick.label} <span className="font-display">{describeRoll(quick.roll, t)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          )}

          <Card
            label={t('dice.history')}
            action={
              history.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    rememberHistory([])
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
                {history.map((r, i) => {
                  const kind = r.outcome?.kind
                  const good = kind === 'success' || kind === 'critical' || r.critical === 'success'
                  const bad = kind === 'failure' || kind === 'fumble' || r.critical === 'failure'
                  return (
                    <li
                      key={history.length - i}
                      className="flex items-baseline gap-3 py-1.5 border-b border-fs-card-line last:border-b-0 text-sm"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{r.label}</span>
                        {r.outcome?.detail && (
                          <span className="block text-xs text-fs-ink-muted truncate">{outcomeText(r, t)}</span>
                        )}
                      </span>
                      <span className="text-xs text-fs-ink-muted">
                        [{r.dice.map(d => (d.dropped ? `(${d.value})` : d.value)).join(', ')}]
                      </span>
                      <span
                        className={`font-display text-base w-10 text-right ${good ? 'text-fs-good' : bad ? 'text-fs-danger' : kind === 'partial' ? 'text-fs-brass' : ''}`}
                      >
                        {displayTotal(r)}
                      </span>
                    </li>
                  )
                })}
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
