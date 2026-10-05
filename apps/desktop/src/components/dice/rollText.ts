import type { TFunction } from 'i18next'
import type { OutcomeKind, RollResult, RollSpec } from '@fablesheet/core'
import { formatModifier } from '@fablesheet/core'
import type { DieTone } from './DieShape'

/** Short text for a roll on a button, e.g. "+5", "45 %", "2W6+1" */
export function describeRoll(spec: RollSpec, t: TFunction): string {
  switch (spec.kind) {
    case 'd20':
      return formatModifier(spec.modifier)
    case 'dice':
      return spec.expression.replace(/d/gi, t('dice.die'))
    case 'under':
      return `${spec.target} %`
    case '3d20':
      return `${spec.attributes.join('/')} · ${spec.skill}`
    case 'duality':
      return formatModifier(spec.modifier)
    case 'highest':
      return `${spec.pool}${t('dice.die')}6`
  }
}

export const OUTCOME_COLOR: Record<OutcomeKind, string> = {
  critical: 'text-[#9fd08a]',
  success: 'text-[#9fd08a]',
  partial: 'text-[#e6c27a]',
  failure: 'text-[#e8a090]',
  fumble: 'text-[#e8a090]',
}

/** Description of a check result, e.g. "Success with Hope" */
export function outcomeText(result: RollResult, t: TFunction): string | null {
  const o = result.outcome
  if (!o?.detail) return null
  const detail = t(o.detail, o.values ?? {})
  // Hope/Fear against a difficulty: say whether it succeeded, too
  if (o.kind && (o.detail === 'dice.outcome.withHope' || o.detail === 'dice.outcome.withFear')) {
    return `${t(`dice.outcome.${o.kind}`)} · ${detail}`
  }
  return detail
}

/** The number shown big: successes of a pool, a signed total for Fudge dice, or the total */
export function displayTotal(result: RollResult): string {
  if (result.dice.some(d => d.sides === 'F')) return formatModifier(result.total)
  return String(result.total)
}

/** Colour of a die in the tray */
export function dieTone(result: RollResult, index: number): DieTone {
  const d = result.dice[index]
  if (d.role === 'hope' || d.role === 'fear') return d.role
  if (d.success !== undefined) return d.success ? 'success' : null
  if (d.sides === 20 && !d.dropped && result.critical) return result.critical === 'success' ? 'success' : 'failure'
  return null
}
