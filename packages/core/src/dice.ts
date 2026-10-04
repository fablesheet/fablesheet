// Dice rolling. The random source is injectable so rolls can be tested.

export type DieSize = 4 | 6 | 8 | 10 | 12 | 20 | 100
export const DIE_SIZES: DieSize[] = [4, 6, 8, 10, 12, 20, 100]

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

export interface DiceTerm {
  count: number
  sides: number
}

export interface DiceExpression {
  terms: DiceTerm[]
  modifier: number
}

/** Parses expressions like "d20", "2d6 + 3", "1d8+1d6-1". Returns null if invalid. */
export function parseDice(input: string): DiceExpression | null {
  const text = input.replace(/\s+/g, '').toLowerCase().replace(/w/g, 'd')
  if (!text || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(text)) return null
  const expr: DiceExpression = { terms: [], modifier: 0 }
  for (const [, sign, body] of text.matchAll(/([+-]?)(\d*d\d+|\d+)/g)) {
    const negative = sign === '-'
    if (body.includes('d')) {
      const [count, sides] = body.split('d')
      const term = { count: Number(count || 1), sides: Number(sides) }
      if (negative || term.count < 1 || term.count > 100 || term.sides < 2 || term.sides > 1000) return null
      expr.terms.push(term)
    } else {
      expr.modifier += negative ? -Number(body) : Number(body)
    }
  }
  return expr
}

export function formatDice(expr: DiceExpression): string {
  const dice = expr.terms.map(t => `${t.count}d${t.sides}`).join(' + ')
  if (expr.modifier === 0) return dice || '0'
  const mod = `${expr.modifier > 0 ? '+' : '−'} ${Math.abs(expr.modifier)}`
  return dice ? `${dice} ${mod}` : String(expr.modifier)
}

export interface DieResult {
  sides: number
  value: number
  /** Not counted (the lower/higher d20 with advantage/disadvantage) */
  dropped?: boolean
}

export interface RollResult {
  label: string
  dice: DieResult[]
  modifier: number
  total: number
  /** Natural 20 / natural 1 on a single counted d20 */
  critical: 'success' | 'failure' | null
}

export function rollExpression(expr: DiceExpression, label: string, random: RandomSource = secureRandom): RollResult {
  const dice: DieResult[] = expr.terms.flatMap(t =>
    Array.from({ length: t.count }, () => ({ sides: t.sides, value: rollDie(t.sides, random) })),
  )
  return {
    label,
    dice,
    modifier: expr.modifier,
    total: dice.reduce((sum, d) => sum + d.value, 0) + expr.modifier,
    critical: null,
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
