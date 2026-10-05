import { describe, expect, it } from 'vitest'
import {
  applyBands,
  performRoll,
  qualityLevel,
  rollDuality,
  rollHighest,
  rollThreeD20,
  rollUnder,
  TWO_D6_BANDS,
} from './checks'
import { rollExpression, parseDice } from './dice'

/** Random values so that rollDie(sides[i]) returns values[i] */
function faces(sides: number[], values: number[]) {
  let i = 0
  return () => {
    const v = (values[i] - 1) / sides[i] + 1e-9
    i++
    return v
  }
}
/** A d10 used as a 0–9 digit for percentile dice */
const digit = (n: number) => n + 1

describe('rollUnder', () => {
  const roll = (target: number, units: number, ...tens: number[]) =>
    rollUnder(
      target,
      tens.length > 1 ? 'advantage' : 'normal',
      'Spot',
      faces([10, ...tens.map(() => 10)], [digit(units), ...tens.map(digit)]),
    )

  it('grades successes by half and a fifth of the target', () => {
    expect(roll(60, 5, 4).outcome).toMatchObject({ kind: 'success', detail: 'dice.outcome.success' }) // 45
    expect(roll(60, 0, 3).outcome?.detail).toBe('dice.outcome.hard') // 30
    expect(roll(60, 2, 1).outcome?.detail).toBe('dice.outcome.extreme') // 12
    expect(roll(60, 1, 6).outcome?.kind).toBe('failure') // 61
  })

  it('treats 01 as a critical and 00 as 100, a fumble', () => {
    expect(roll(60, 1, 0)).toMatchObject({ total: 1, outcome: { kind: 'critical' } })
    expect(roll(60, 0, 0)).toMatchObject({ total: 100, outcome: { kind: 'fumble' } })
    expect(roll(40, 7, 9).outcome?.kind).toBe('fumble') // 97 against a target below 50
    expect(roll(70, 7, 9).outcome?.kind).toBe('failure')
  })

  it('keeps the lower tens die with a bonus die', () => {
    const result = roll(50, 5, 7, 2) // 75 or 25
    expect(result.total).toBe(25)
    expect(result.dice.map(d => [d.value, !!d.dropped])).toEqual([
      [75, true],
      [25, false],
    ])
  })
})

describe('rollUnder with a d20', () => {
  const roll = (target: number, ...values: number[]) =>
    rollUnder(
      target,
      values.length > 1 ? 'advantage' : 'normal',
      'Courage',
      faces(
        values.map(() => 20),
        values,
      ),
      20,
    )

  it('succeeds at or under the target, 1 is critical and 20 a fumble', () => {
    expect(roll(12, 12).outcome?.kind).toBe('success')
    expect(roll(12, 13).outcome?.kind).toBe('failure')
    expect(roll(12, 1).outcome?.kind).toBe('critical')
    expect(roll(25, 20).outcome?.kind).toBe('fumble')
    expect(roll(10, 15, 4).total).toBe(4)
  })
})

describe('rollThreeD20', () => {
  const roll = (rolls: number[], skill = 6, modifier = 0) =>
    rollThreeD20([12, 13, 14], skill, modifier, 'Climb', faces([20, 20, 20], rolls))

  it('pays points above the attributes with skill points', () => {
    expect(roll([10, 13, 9]).outcome).toEqual({
      kind: 'success',
      detail: 'dice.outcome.quality',
      values: { quality: 2 },
    })
    expect(roll([15, 13, 9]).outcome?.values).toEqual({ quality: 1 }) // 3 over, 3 left
    expect(roll([19, 18, 9]).outcome).toEqual({
      kind: 'failure',
      detail: 'dice.outcome.pointsMissing',
      values: { points: 6 },
    })
  })

  it('applies the modifier to every attribute', () => {
    expect(roll([13, 14, 15], 0, 1).outcome?.kind).toBe('success')
    expect(roll([13, 14, 15], 0, 0).outcome?.kind).toBe('failure')
  })

  it('knows criticals and fumbles', () => {
    expect(roll([1, 1, 20]).outcome?.kind).toBe('critical')
    expect(roll([20, 20, 1]).outcome?.kind).toBe('fumble')
  })

  it('caps the quality level at 6', () => {
    expect(qualityLevel(0)).toBe(1)
    expect(qualityLevel(4)).toBe(2)
    expect(qualityLevel(30)).toBe(6)
  })
})

describe('rollDuality', () => {
  it('adds both dice and tells Hope from Fear', () => {
    const hope = rollDuality(2, 'normal', 'Act', null, faces([12, 12], [9, 4]))
    expect(hope.total).toBe(15)
    expect(hope.outcome).toEqual({ kind: undefined, detail: 'dice.outcome.withHope' })
    expect(rollDuality(0, 'normal', 'Act', 12, faces([12, 12], [3, 8])).outcome).toMatchObject({
      kind: 'failure',
      detail: 'dice.outcome.withFear',
    })
  })

  it('makes doubles a critical success and adds a d6 with advantage', () => {
    expect(rollDuality(0, 'normal', 'Act', 30, faces([12, 12], [5, 5])).outcome?.kind).toBe('critical')
    const adv = rollDuality(1, 'advantage', 'Act', null, faces([12, 12, 6], [6, 2, 4]))
    expect(adv.total).toBe(13)
    expect(adv.dice.map(d => d.role)).toEqual(['hope', 'fear', 'advantage'])
    expect(rollDuality(0, 'disadvantage', 'Act', null, faces([12, 12, 6], [6, 2, 4])).total).toBe(4)
  })
})

describe('rollHighest', () => {
  const roll = (pool: number, values: number[]) =>
    rollHighest(
      pool,
      'Act',
      faces(
        values.map(() => 6),
        values,
      ),
    )

  it('reads the highest die', () => {
    expect(roll(3, [2, 6, 3]).outcome?.kind).toBe('success')
    expect(roll(2, [4, 5]).outcome?.kind).toBe('partial')
    expect(roll(2, [1, 3]).outcome?.kind).toBe('failure')
    expect(roll(3, [6, 6, 1]).outcome?.kind).toBe('critical')
  })

  it('takes the lower of two dice with an empty pool', () => {
    const result = roll(0, [6, 6])
    expect(result.outcome?.kind).toBe('success')
    expect(roll(0, [6, 2]).outcome?.kind).toBe('failure')
  })
})

describe('bands and roll specs', () => {
  it('applies outcome bands to a total', () => {
    const roll = (a: number, b: number) =>
      applyBands(rollExpression(parseDice('2d6+1')!, 'Move', faces([6, 6], [a, b])), TWO_D6_BANDS).outcome?.kind
    expect(roll(5, 4)).toBe('success')
    expect(roll(3, 3)).toBe('partial')
    expect(roll(1, 2)).toBe('failure')
  })

  it('performs every kind of roll', () => {
    const random = () => 0.5
    expect(performRoll({ kind: 'd20', modifier: 3 }, 'x', 'normal', random)?.total).toBe(14)
    expect(performRoll({ kind: 'dice', expression: '2d6' }, 'x', 'normal', random)?.total).toBe(8)
    expect(performRoll({ kind: 'dice', expression: 'nope' }, 'x')).toBeNull()
    expect(performRoll({ kind: 'under', target: 50 }, 'x', 'normal', random)?.outcome?.kind).toBe('failure')
    expect(
      performRoll({ kind: '3d20', attributes: [12, 12, 12], skill: 4 }, 'x', 'normal', random)?.outcome?.kind,
    ).toBe('success')
    expect(performRoll({ kind: 'duality', modifier: 0 }, 'x', 'normal', random)?.outcome?.kind).toBe('critical')
    expect(performRoll({ kind: 'highest', pool: 2 }, 'x', 'normal', random)?.outcome?.kind).toBe('partial')
  })
})
