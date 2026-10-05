// Checks of different game families. They only use generic mechanics; the names
// of the outcomes are translated in the app ('dice.outcome.*').
import {
  parseDice,
  rollD20,
  rollDie,
  rollExpression,
  secureRandom,
  type DieResult,
  type OutcomeKind,
  type RandomSource,
  type RollMode,
  type RollResult,
} from './dice'

// ── Percentile roll-under ─────────────────────────────────────────────────────

/**
 * d100 against a target value: rolls at or below it succeed. Results at or below
 * half or a fifth of the target are better successes, 01 is a critical, 100 (or
 * 96+ against targets below 50) a fumble. Advantage and disadvantage roll an
 * extra tens die and keep the better or worse one (bonus and penalty dice).
 */
export function rollUnder(
  target: number,
  mode: RollMode,
  label: string,
  random: RandomSource = secureRandom,
): RollResult {
  const units = rollDie(10, random) - 1
  const tensRolls = [rollDie(10, random) - 1]
  if (mode !== 'normal') tensRolls.push(rollDie(10, random) - 1)
  const value = (tens: number) => tens * 10 + units || 100
  const values = tensRolls.map(value)
  const kept = mode === 'advantage' ? Math.min(...values) : mode === 'disadvantage' ? Math.max(...values) : values[0]
  const keptIndex = values.indexOf(kept)
  const dice: DieResult[] = values.map((v, i) => ({
    sides: 100,
    value: v,
    ...(i !== keptIndex ? { dropped: true } : {}),
  }))

  let kind: OutcomeKind
  let detail: string
  if (kept === 1) [kind, detail] = ['critical', 'dice.outcome.critical']
  else if (kept === 100 || (target < 50 && kept >= 96)) [kind, detail] = ['fumble', 'dice.outcome.fumble']
  else if (kept <= Math.floor(target / 5)) [kind, detail] = ['success', 'dice.outcome.extreme']
  else if (kept <= Math.floor(target / 2)) [kind, detail] = ['success', 'dice.outcome.hard']
  else if (kept <= target) [kind, detail] = ['success', 'dice.outcome.success']
  else [kind, detail] = ['failure', 'dice.outcome.failure']

  return {
    label,
    dice,
    modifier: 0,
    total: kept,
    critical: null,
    outcome: { kind, detail, values: { target } },
  }
}

// ── Three d20 against three attributes ────────────────────────────────────────

/** Points of the skill that are left decide the quality: 0–3 → 1, 4–6 → 2, … up to 6 */
export function qualityLevel(pointsLeft: number): number {
  return Math.min(6, Math.max(1, Math.ceil(pointsLeft / 3)))
}

/**
 * Three d20, each against one attribute (plus a modifier). Every point a die
 * rolls above its attribute is paid with skill points; the check succeeds if
 * the skill points cover it, and the points left give the quality level. Two
 * or more 1s are a critical success, two or more 20s a fumble.
 */
export function rollThreeD20(
  attributes: readonly [number, number, number],
  skill: number,
  modifier: number,
  label: string,
  random: RandomSource = secureRandom,
): RollResult {
  const rolls = attributes.map(() => rollDie(20, random))
  const over = rolls.reduce((sum, r, i) => sum + Math.max(0, r - (attributes[i] + modifier)), 0)
  const pointsLeft = skill - over
  const ones = rolls.filter(r => r === 1).length
  const twenties = rolls.filter(r => r === 20).length
  const dice: DieResult[] = rolls.map((r, i) => ({ sides: 20, value: r, success: r <= attributes[i] + modifier }))

  let outcome: RollResult['outcome']
  if (twenties >= 2) outcome = { kind: 'fumble', detail: 'dice.outcome.fumble' }
  else if (ones >= 2)
    outcome = {
      kind: 'critical',
      detail: 'dice.outcome.qualityCritical',
      values: { quality: qualityLevel(Math.max(0, pointsLeft)) },
    }
  else if (pointsLeft >= 0)
    outcome = { kind: 'success', detail: 'dice.outcome.quality', values: { quality: qualityLevel(pointsLeft) } }
  else outcome = { kind: 'failure', detail: 'dice.outcome.pointsMissing', values: { points: -pointsLeft } }

  return { label, dice, modifier, total: Math.max(pointsLeft, -99), critical: null, outcome }
}

// ── Hope and Fear ─────────────────────────────────────────────────────────────

/**
 * Two d12, one for Hope and one for Fear, added up with a modifier. The higher
 * die decides whether the result comes with Hope or with Fear; doubles are a
 * critical success. Advantage adds a d6, disadvantage subtracts one. With a
 * difficulty, the total decides success or failure.
 */
export function rollDuality(
  modifier: number,
  mode: RollMode,
  label: string,
  difficulty: number | null = null,
  random: RandomSource = secureRandom,
): RollResult {
  const hope = rollDie(12, random)
  const fear = rollDie(12, random)
  const dice: DieResult[] = [
    { sides: 12, value: hope, role: 'hope' },
    { sides: 12, value: fear, role: 'fear' },
  ]
  let extra = 0
  if (mode !== 'normal') {
    const d6 = rollDie(6, random)
    extra = mode === 'advantage' ? d6 : -d6
    dice.push({ sides: 6, value: d6, role: mode })
  }
  const total = hope + fear + extra + modifier
  const critical = hope === fear
  const withHope = hope > fear

  let kind: OutcomeKind | undefined
  if (critical) kind = 'critical'
  else if (difficulty !== null) kind = total >= difficulty ? 'success' : 'failure'
  const detail = critical
    ? 'dice.outcome.dualityCritical'
    : withHope
      ? 'dice.outcome.withHope'
      : 'dice.outcome.withFear'

  return {
    label,
    dice,
    modifier,
    total,
    critical: null,
    outcome: { kind, detail, ...(difficulty !== null ? { values: { difficulty } } : {}) },
  }
}

// ── Highest die of a d6 pool ──────────────────────────────────────────────────

/**
 * A pool of d6 where the highest die counts: 6 is a success, 4–5 a partial
 * success, 1–3 a failure, and two or more 6s a critical. With no dice, roll two
 * and take the lower one (that can't be a critical).
 */
export function rollHighest(pool: number, label: string, random: RandomSource = secureRandom): RollResult {
  const zero = pool <= 0
  const values = Array.from({ length: zero ? 2 : Math.min(pool, 20) }, () => rollDie(6, random))
  const best = zero ? Math.min(...values) : Math.max(...values)
  const keptIndex = values.indexOf(best)
  const dice: DieResult[] = values.map((value, i) => ({
    sides: 6,
    value,
    ...(i !== keptIndex ? { dropped: true } : {}),
  }))
  const sixes = values.filter(v => v === 6).length

  const kind: OutcomeKind =
    !zero && sixes >= 2 ? 'critical' : best === 6 ? 'success' : best >= 4 ? 'partial' : 'failure'
  return {
    label,
    dice,
    modifier: 0,
    total: best,
    critical: null,
    outcome: { kind, detail: `dice.outcome.${kind}` },
  }
}

// ── Outcome bands on a total ──────────────────────────────────────────────────

/** Total from which an outcome applies, e.g. 10+ success, 7–9 partial */
export interface OutcomeBand {
  min: number
  kind: OutcomeKind
}

/** Two d6 plus a stat: 10+ success, 7–9 partial success, 6 or less failure */
export const TWO_D6_BANDS: OutcomeBand[] = [
  { min: 10, kind: 'success' },
  { min: 7, kind: 'partial' },
]

/** Gives a result the outcome of the highest band its total reaches (failure below all bands). */
export function applyBands(result: RollResult, bands: readonly OutcomeBand[]): RollResult {
  const band = [...bands].sort((a, b) => b.min - a.min).find(b => result.total >= b.min)
  const kind = band?.kind ?? 'failure'
  return { ...result, outcome: { kind, detail: `dice.outcome.${kind}` } }
}

// ── Roll specifications ───────────────────────────────────────────────────────

/** A roll a game system (or a template) offers, independent of how it is shown */
export type RollSpec =
  | { kind: 'd20'; modifier: number }
  | { kind: 'dice'; expression: string; bands?: OutcomeBand[] }
  | { kind: 'under'; target: number }
  | { kind: '3d20'; attributes: [number, number, number]; skill: number; modifier?: number }
  | { kind: 'duality'; modifier: number; difficulty?: number | null }
  | { kind: 'highest'; pool: number }

/**
 * Performs a roll. The mode means advantage/disadvantage for d20 rolls, bonus/penalty
 * dice for percentile rolls and ±d6 for Hope and Fear; other rolls ignore it.
 * Returns null if a dice expression is invalid.
 */
export function performRoll(
  spec: RollSpec,
  label: string,
  mode: RollMode = 'normal',
  random: RandomSource = secureRandom,
): RollResult | null {
  switch (spec.kind) {
    case 'd20':
      return rollD20(spec.modifier, mode, label, random)
    case 'dice': {
      const expr = parseDice(spec.expression)
      if (!expr) return null
      const result = rollExpression(expr, label, random)
      return spec.bands ? applyBands(result, spec.bands) : result
    }
    case 'under':
      return rollUnder(spec.target, mode, label, random)
    case '3d20':
      return rollThreeD20(spec.attributes, spec.skill, spec.modifier ?? 0, label, random)
    case 'duality':
      return rollDuality(spec.modifier, mode, label, spec.difficulty ?? null, random)
    case 'highest':
      return rollHighest(spec.pool, label, random)
  }
}
