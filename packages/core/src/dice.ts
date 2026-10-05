// Dice rolling. The random source is injectable so rolls can be tested.

/** Signed display string for a modifier, e.g. 2 → "+2", -1 → "-1". */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export type DieSize = 4 | 6 | 8 | 10 | 12 | 20 | 100
export const DIE_SIZES: DieSize[] = [4, 6, 8, 10, 12, 20, 100]

/** Fudge/Fate dice show −1, 0 or +1 */
export const FUDGE = 'F'
export type Sides = number | typeof FUDGE

/** Returns an integer in [0, 1). Defaults to a cryptographically secure source. */
export type RandomSource = () => number

export const secureRandom: RandomSource = () => {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

export function rollDie(sides: number, random: RandomSource = secureRandom): number {
  return Math.floor(random() * sides) + 1
}

/** One die roll: −1, 0 or +1 for Fudge dice, 1…sides otherwise. */
function rollFace(sides: Sides, random: RandomSource): number {
  return sides === FUDGE ? rollDie(3, random) - 2 : rollDie(sides, random)
}

// ── Expressions ───────────────────────────────────────────────────────────────

export interface DiceTerm {
  count: number
  sides: Sides
  /** Keep only the highest or lowest dice, e.g. 4d6kh3 */
  keep?: { which: 'highest' | 'lowest'; count: number }
  /** Roll again and add when a die shows its highest face, e.g. 3d6! */
  explode?: boolean
  /** Count the dice that reach a target instead of adding them up, e.g. 8d6>=5 */
  successes?: { compare: '>=' | '<='; target: number }
}

export interface DiceExpression {
  terms: DiceTerm[]
  modifier: number
}

const MAX_DICE = 100
const MAX_SIDES = 1000
/** Explosions per die, so a roll always ends */
const MAX_EXPLOSIONS = 20

const TERM = /^(\d*)d(\d+|f)(k[hl]?\d*)?(!)?((?:>=|<=|>|<)\d+)?$/

function parseTerm(body: string): DiceTerm | null {
  const m = TERM.exec(body)
  if (!m) return null
  const [, countText, sidesText, keepText, explodeText, successText] = m
  const count = Number(countText || 1)
  const sides: Sides = sidesText === 'f' ? FUDGE : Number(sidesText)
  if (count < 1 || count > MAX_DICE) return null
  if (sides !== FUDGE && (sides < 2 || sides > MAX_SIDES)) return null

  const term: DiceTerm = { count, sides }
  if (keepText) {
    const which = keepText[1] === 'l' ? 'lowest' : 'highest'
    const keepCount = Number(keepText.replace(/^k[hl]?/, '') || 1)
    if (keepCount < 1 || keepCount > count) return null
    term.keep = { which, count: keepCount }
  }
  if (explodeText) {
    if (sides === FUDGE) return null
    term.explode = true
  }
  if (successText) {
    if (sides === FUDGE) return null
    const [, op, value] = /^(>=|<=|>|<)(\d+)$/.exec(successText)!
    const n = Number(value)
    term.successes =
      op === '>'
        ? { compare: '>=', target: n + 1 }
        : op === '<'
          ? { compare: '<=', target: n - 1 }
          : { compare: op as '>=' | '<=', target: n }
  }
  return term
}

/**
 * Parses dice expressions. Returns null if invalid. Examples:
 * "d20", "2d6 + 3", "1d8+1d6-1", "4d6kh3" (keep the highest 3), "2d20kl1" (keep the lowest),
 * "3d6!" (exploding), "8d6>=5" (count successes), "4dF+2" (Fudge dice).
 * "W" is accepted for "d" (German notation).
 */
export function parseDice(input: string): DiceExpression | null {
  const text = input.replace(/\s+/g, '').toLowerCase().replace(/w/g, 'd')
  if (!text) return null
  const parts = text.match(/[+-]?[^+-]+/g)
  if (!parts || parts.join('') !== text) return null

  const expr: DiceExpression = { terms: [], modifier: 0 }
  for (const part of parts) {
    const negative = part.startsWith('-')
    const body = part.replace(/^[+-]/, '')
    if (/^\d+$/.test(body)) {
      expr.modifier += negative ? -Number(body) : Number(body)
      continue
    }
    const term = parseTerm(body)
    if (!term || negative) return null
    expr.terms.push(term)
  }
  return expr
}

function formatTerm(term: DiceTerm): string {
  let text = `${term.count}d${term.sides}`
  if (term.keep) text += `${term.keep.which === 'highest' ? 'kh' : 'kl'}${term.keep.count}`
  if (term.explode) text += '!'
  if (term.successes) text += `${term.successes.compare}${term.successes.target}`
  return text
}

export function formatDice(expr: DiceExpression): string {
  const dice = expr.terms.map(formatTerm).join(' + ')
  if (expr.modifier === 0) return dice || '0'
  const mod = `${expr.modifier > 0 ? '+' : '−'} ${Math.abs(expr.modifier)}`
  return dice ? `${dice} ${mod}` : String(expr.modifier)
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface DieResult {
  sides: Sides
  value: number
  /** Not counted (e.g. the lower d20 with advantage, or dice not kept) */
  dropped?: boolean
  /** Rolled because the die before it exploded */
  exploded?: boolean
  /** Counted as a success in a dice pool */
  success?: boolean
  /** What the die stands for in a check, e.g. Hope and Fear */
  role?: 'hope' | 'fear' | 'advantage' | 'disadvantage'
}

export type OutcomeKind = 'critical' | 'success' | 'partial' | 'failure' | 'fumble'

/** The meaning of a check, e.g. a success with Hope or quality level 2 */
export interface RollOutcome {
  kind?: OutcomeKind
  /** Translation key of the description, e.g. 'dice.outcome.withHope' */
  detail?: string
  /** Values for the description */
  values?: Record<string, number | string>
}

export interface RollResult {
  label: string
  dice: DieResult[]
  modifier: number
  total: number
  /** Natural 20 / natural 1 on a single counted d20 */
  critical: 'success' | 'failure' | null
  /** Number of successes, if dice were counted instead of added up */
  successes?: number
  outcome?: RollOutcome
}

function rollTerm(term: DiceTerm, random: RandomSource): { dice: DieResult[]; value: number } {
  // Each die with the dice it exploded into
  const chains: DieResult[][] = []
  for (let i = 0; i < term.count; i++) {
    let value = rollFace(term.sides, random)
    const chain: DieResult[] = [{ sides: term.sides, value }]
    for (let n = 0; term.explode && value === term.sides && n < MAX_EXPLOSIONS; n++) {
      value = rollFace(term.sides, random)
      chain.push({ sides: term.sides, value, exploded: true })
    }
    chains.push(chain)
  }

  if (term.keep) {
    const { which, count } = term.keep
    const sum = (chain: DieResult[]) => chain.reduce((s, d) => s + d.value, 0)
    const order = chains.map((c, i) => ({ i, v: sum(c) })).sort((a, b) => (which === 'highest' ? b.v - a.v : a.v - b.v))
    const kept = new Set(order.slice(0, count).map(o => o.i))
    chains.forEach((chain, i) => {
      if (!kept.has(i)) chain.forEach(d => (d.dropped = true))
    })
  }

  const dice = chains.flat()
  const counted = dice.filter(d => !d.dropped)
  if (term.successes) {
    const { compare, target } = term.successes
    for (const d of counted) d.success = compare === '>=' ? d.value >= target : d.value <= target
    return { dice, value: counted.filter(d => d.success).length }
  }
  return { dice, value: counted.reduce((s, d) => s + d.value, 0) }
}

export function rollExpression(expr: DiceExpression, label: string, random: RandomSource = secureRandom): RollResult {
  const rolled = expr.terms.map(t => rollTerm(t, random))
  const total = rolled.reduce((s, r) => s + r.value, 0) + expr.modifier
  return {
    label,
    dice: rolled.flatMap(r => r.dice),
    modifier: expr.modifier,
    total,
    critical: null,
    ...(expr.terms.some(t => t.successes) ? { successes: total } : {}),
  }
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

/** A d20 check with a modifier; with advantage/disadvantage two d20 are rolled and one is dropped. */
export function rollD20(
  modifier: number,
  mode: RollMode,
  label: string,
  random: RandomSource = secureRandom,
): RollResult {
  const first = rollDie(20, random)
  const dice: DieResult[] = [{ sides: 20, value: first }]
  let kept = first
  if (mode !== 'normal') {
    const second = rollDie(20, random)
    const keepSecond = mode === 'advantage' ? second > first : second < first
    kept = keepSecond ? second : first
    dice[0].dropped = keepSecond
    dice.push({ sides: 20, value: second, dropped: !keepSecond })
  }
  return {
    label,
    dice,
    modifier,
    total: kept + modifier,
    critical: kept === 20 ? 'success' : kept === 1 ? 'failure' : null,
  }
}
