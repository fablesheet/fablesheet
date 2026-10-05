import { describe, expect, it } from 'vitest'
import { evaluate, FormulaError, isValidFormula, references, substitute } from './formula'

describe('formulas', () => {
  it('evaluates numbers, references and arithmetic', () => {
    expect(evaluate(3, {})).toBe(3)
    expect(evaluate('@str + 2', { str: 4 })).toBe(6)
    expect(evaluate('(@a + @b) / 2', { a: 3, b: 4 })).toBe(3)
    expect(evaluate('-@value * 2', { value: 3 })).toBe(-6)
    expect(evaluate('10 - -3', {})).toBe(13)
    expect(evaluate('', {})).toBe(0)
  })

  it('treats unknown references as 0 and division by zero as 0', () => {
    expect(evaluate('@missing + 1', {})).toBe(1)
    expect(evaluate('5 / 0', {})).toBe(0)
  })

  it('rejects anything that is not arithmetic', () => {
    for (const bad of ['alert(1)', '2 +', '(1 + 2', '1 2', 'Math.max(1)', '1;2']) {
      expect(() => evaluate(bad, {}), bad).toThrow(FormulaError)
      expect(isValidFormula(bad)).toBe(false)
    }
    expect(isValidFormula('@a + 1')).toBe(true)
  })

  it('finds and substitutes references in dice expressions', () => {
    expect(references('4dF + @fight - @penalty')).toEqual(['fight', 'penalty'])
    expect(substitute('2d6+@cool', { cool: -1 })).toBe('2d6+-1')
  })
})
