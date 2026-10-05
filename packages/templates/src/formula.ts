// Formulas over field values: numbers, @references, + - * / and parentheses.
// Evaluated with a small parser — templates come from files, so nothing is ever run as code.
import type { Formula } from './types'

export class FormulaError extends Error {}

/** Values a formula can refer to: field ids, plus "value" for the field the roll belongs to */
export type FormulaScope = Readonly<Record<string, number | undefined>>

const REFERENCE = /@([a-zA-Z][\w-]*)/g

/** Ids of the fields a formula or dice expression refers to */
export function references(text: string): string[] {
  return [...text.matchAll(REFERENCE)].map(m => m[1])
}

/** Replaces @references with their numbers (unknown ones count as 0). */
export function substitute(text: string, scope: FormulaScope): string {
  return text.replace(REFERENCE, (_, id: string) => String(Math.trunc(scope[id] ?? 0)))
}

type Token = { type: 'num'; value: number } | { type: 'op'; value: string }

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (c === ' ') {
      i++
    } else if (/\d/.test(c)) {
      let j = i
      while (j < text.length && /\d/.test(text[j])) j++
      tokens.push({ type: 'num', value: Number(text.slice(i, j)) })
      i = j
    } else if ('+-*/()'.includes(c)) {
      tokens.push({ type: 'op', value: c })
      i++
    } else {
      throw new FormulaError(`Unexpected "${c}"`)
    }
  }
  return tokens
}

/** expression := term (("+" | "-") term)*; term := factor (("*" | "/") factor)*; factor := number | "-" factor | "(" expression ")" */
function parse(tokens: Token[]): number {
  let pos = 0
  const peek = () => tokens[pos]
  const take = (op: string) => {
    const t = peek()
    if (t?.type === 'op' && t.value === op) {
      pos++
      return true
    }
    return false
  }
  const factor = (): number => {
    const t = peek()
    if (!t) throw new FormulaError('Unexpected end')
    if (t.type === 'num') {
      pos++
      return t.value
    }
    if (take('-')) return -factor()
    if (take('+')) return factor()
    if (take('(')) {
      const v = expression()
      if (!take(')')) throw new FormulaError('Missing ")"')
      return v
    }
    throw new FormulaError(`Unexpected "${t.value}"`)
  }
  const term = (): number => {
    let v = factor()
    for (;;) {
      if (take('*')) v *= factor()
      else if (take('/')) {
        const d = factor()
        v = d === 0 ? 0 : Math.trunc(v / d)
      } else return v
    }
  }
  const expression = (): number => {
    let v = term()
    for (;;) {
      if (take('+')) v += term()
      else if (take('-')) v -= term()
      else return v
    }
  }
  const result = expression()
  if (pos < tokens.length) throw new FormulaError('Unexpected input')
  return result
}

/** Evaluates a formula; integer arithmetic, division rounds toward zero. */
export function evaluate(formula: Formula, scope: FormulaScope): number {
  if (typeof formula === 'number') return formula
  const text = substitute(formula, scope).trim()
  if (text === '') return 0
  if (text.length > 500) throw new FormulaError('Formula too long')
  return parse(tokenize(text))
}

/** Whether a formula can be evaluated (references are allowed). */
export function isValidFormula(formula: Formula): boolean {
  try {
    evaluate(formula, {})
    return true
  } catch {
    return false
  }
}
