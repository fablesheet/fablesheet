import { describe, expect, it } from 'vitest'
import { formatDice, parseDice, rollD20, rollDie, rollExpression, formatModifier } from './dice'

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
    for (const bad of ['', 'abc', '2d', 'd1', '-d6', '1000d6', '2d6++1', '2d6kh3', '4dF!', '4dF>=1', 'd6x'])
      expect(parseDice(bad), bad).toBeNull()
  })

  it('parses keep, explode, success and Fudge options', () => {
    expect(parseDice('4d6kh3')?.terms[0]).toEqual({ count: 4, sides: 6, keep: { which: 'highest', count: 3 } })
    expect(parseDice('2d20kl1')?.terms[0].keep).toEqual({ which: 'lowest', count: 1 })
    expect(parseDice('2d20k')?.terms[0].keep).toEqual({ which: 'highest', count: 1 })
    expect(parseDice('3d6!')?.terms[0].explode).toBe(true)
    expect(parseDice('8d6>=5')?.terms[0].successes).toEqual({ compare: '>=', target: 5 })
    expect(parseDice('5d10>7')?.terms[0].successes).toEqual({ compare: '>=', target: 8 })
    expect(parseDice('3d6<3')?.terms[0].successes).toEqual({ compare: '<=', target: 2 })
    expect(parseDice('4dF+2')).toEqual({ terms: [{ count: 4, sides: 'F' }], modifier: 2 })
    expect(parseDice('4WF')?.terms[0].sides).toBe('F')
  })

  it('formats expressions', () => {
    expect(formatDice(parseDice('2d6+3')!)).toBe('2d6 + 3')
    expect(formatDice(parseDice('1d20-1')!)).toBe('1d20 − 1')
    expect(formatDice(parseDice('4d6kh3 + 3d6! + 6d6>=5 + 4dF')!)).toBe('4d6kh3 + 3d6! + 6d6>=5 + 4dF')
  })
})

describe('rolling', () => {
  it('sums dice and modifier', () => {
    const result = rollExpression(parseDice('2d6+3')!, 'Damage', faces([6, 6], [4, 5]))
    expect(result.dice.map(d => d.value)).toEqual([4, 5])
    expect(result.total).toBe(12)
  })

  it('keeps the highest or lowest dice', () => {
    const result = rollExpression(parseDice('4d6kh3')!, 'Stats', faces([6, 6, 6, 6], [2, 6, 1, 5]))
    expect(result.total).toBe(13)
    expect(result.dice.map(d => !!d.dropped)).toEqual([false, false, true, false])
    expect(rollExpression(parseDice('2d20kl1')!, 'x', faces([20, 20], [12, 4])).total).toBe(4)
  })

  it('explodes dice on their highest face', () => {
    const result = rollExpression(parseDice('2d6!')!, 'Ace', faces([6, 6, 6, 6], [6, 6, 2, 3]))
    expect(result.dice.map(d => [d.value, !!d.exploded])).toEqual([
      [6, false],
      [6, true],
      [2, true],
      [3, false],
    ])
    expect(result.total).toBe(17)
  })

  it('counts successes in a dice pool', () => {
    const result = rollExpression(parseDice('5d6>=5+1')!, 'Pool', faces([6, 6, 6, 6, 6], [5, 2, 6, 4, 1]))
    expect(result.successes).toBe(3)
    expect(result.total).toBe(3)
    expect(result.dice.filter(d => d.success).map(d => d.value)).toEqual([5, 6])
  })

  it('rolls Fudge dice from −1 to +1', () => {
    const result = rollExpression(parseDice('4dF+1')!, 'Fate', faces([3, 3, 3, 3], [1, 2, 3, 3]))
    expect(result.dice.map(d => d.value)).toEqual([-1, 0, 1, 1])
    expect(result.total).toBe(2)
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

describe('formatModifier', () => {
  it('prefixes non-negative values with +', () => {
    expect(formatModifier(0)).toBe('+0')
    expect(formatModifier(3)).toBe('+3')
  })
  it('keeps the minus sign for negative values', () => {
    expect(formatModifier(-2)).toBe('-2')
  })
})
