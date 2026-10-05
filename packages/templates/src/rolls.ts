import type { RollSpec } from '@fablesheet/core'
import { evaluate, substitute, type FormulaScope } from './formula'
import type { FieldValue, ListEntry, RollTemplate, SheetTemplate } from './types'
import { formulaScope } from './values'

/** Cleans up a dice expression after substituting negative numbers, e.g. "2d6+-1" → "2d6-1" */
function tidy(expression: string): string {
  return expression
    .replace(/\+\s*-/g, '-')
    .replace(/-\s*-/g, '+')
    .replace(/\+\s*\+/g, '+')
}

/**
 * Turns a template roll into a concrete roll: formulas are evaluated against the
 * sheet, "@value" is the field's (or list entry's) number. Returns null if the roll
 * can't be made, e.g. a 3d20 check without attributes.
 */
export function resolveRoll(
  roll: RollTemplate,
  template: SheetTemplate,
  values: Record<string, FieldValue>,
  self: number | undefined,
  entry?: ListEntry,
): RollSpec | null {
  const scope: FormulaScope = { ...formulaScope(template, values), value: self }
  const num = (f: Parameters<typeof evaluate>[0]) => evaluate(f, scope)
  try {
    switch (roll.kind) {
      case 'd20':
        return { kind: 'd20', modifier: num(roll.modifier) }
      case 'dice':
        return { kind: 'dice', expression: tidy(substitute(roll.expression, scope)), bands: roll.bands }
      case 'under':
        return { kind: 'under', target: num(roll.target), ...(roll.sides ? { sides: roll.sides } : {}) }
      case '3d20': {
        const ids = entry?.attributes ?? roll.attributes
        if (!ids) return null
        const attributes = ids.map(id => scope[id] ?? 0) as [number, number, number]
        return { kind: '3d20', attributes, skill: num(roll.skill), modifier: num(roll.modifier ?? 0) }
      }
      case 'duality':
        return { kind: 'duality', modifier: num(roll.modifier) }
      case 'highest':
        return { kind: 'highest', pool: num(roll.pool) }
    }
  } catch {
    return null
  }
}
