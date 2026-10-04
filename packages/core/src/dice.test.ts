import { describe, expect, it } from 'vitest'
import { formatDice, parseDice, rollD20, rollDie, rollExpression } from './dice'

/** Returns values so that rollDie gives the listed faces in order */
function faces(sides: number[], values: number[]) {
  let i = 0
  return () => {
    const v = (values[i] - 1) / sides[i] + 1e-9
    i++
    return v
  }
}

describe('rollDie', () => {
  it('maps the random value to 1…sides', () => {
    expect(rollDie(20, () => 0)).toBe(1)
    expect(rollDie(20, () => 0.9999)).toBe(20)
    expect(rollDie(6, () => 0.5)).toBe(4)
  })
})

describe('parseDice', () => {
  it('parses common expressions', () => {
    expect(parseDice('d20')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: 0 })
    expect(parseDice('2d6 + 3')).toEqual({ terms: [{ count: 2, sides: 6 }], modifier: 3 })
    expect(parseDice('1d8+1d6-1')).toEqual({
      terms: [
        { count: 1, sides: 8 },
        { count: 1, sides: 6 },
      ],
      modifier: -1,
    })
    expect(parseDice('2W10')).toEqual({ terms: [{ count: 2, sides: 10 }], modifier: 0 })
  })

  it('rejects invalid input', () => {
    for (const bad of ['', 'abc', '2d', 'd1', '-d6', '1000d6', '2d6++1']) expect(parseDice(bad), bad).toBeNull()
  })

  it('formats expressions', () => {
    expect(formatDice(parseDice('2d6+3')!)).toBe('2d6 + 3')
    expect(formatDice(parseDice('1d20-1')!)).toBe('1d20 − 1')
  })
})

describe('rolling', () => {
  it('sums dice and modifier', () => {
    const result = rollExpression(parseDice('2d6+3')!, 'Damage', faces([6, 6], [4, 5]))
    expect(result.dice.map(d => d.value)).toEqual([4, 5])
    expect(result.total).toBe(12)
  })

  it('keeps the higher d20 with advantage and the lower with disadvantage', () => {
    const adv = rollD20(5, 'advantage', 'Attack', faces([20, 20], [7, 15]))
    expect(adv.total).toBe(20)
    expect(adv.dice).toEqual([
      { sides: 20, value: 7, dropped: true },
      { sides: 20, value: 15, dropped: false },
    ])
    expect(rollD20(5, 'disadvantage', 'Attack', faces([20, 20], [7, 15])).total).toBe(12)
  })

  it('flags natural 20 and natural 1', () => {
    expect(rollD20(0, 'normal', 'x', faces([20], [20])).critical).toBe('success')
    expect(rollD20(9, 'normal', 'x', faces([20], [1])).critical).toBe('failure')
    expect(rollD20(0, 'advantage', 'x', faces([20, 20], [1, 20])).critical).toBe('success')
  })
})
