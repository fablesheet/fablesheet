import { describe, expect, it } from 'vitest'
import { concentrationDC, startConcentration, takeDamage } from './concentration'
import { migrateDnd5e } from './migrations'

const hero = migrateDnd5e({ id: 'h', name: 'Hero', hp: { current: 40, max: 40, temp: 0 }, conditions: [] })

describe('concentration', () => {
  it('uses DC 10 or half the damage, whichever is higher', () => {
    expect(concentrationDC(7)).toBe(10)
    expect(concentrationDC(30)).toBe(15)
  })

  it('asks for a save after damage and ends at 0 HP', () => {
    const focused = startConcentration(hero, 'Bless')
    expect(takeDamage(focused, 25).concentrationCheck).toBe(12)
    expect(takeDamage(hero, 25).concentrationCheck).toBeNull()
    const down = takeDamage(focused, 50)
    expect(down.concentrationCheck).toBeNull()
    expect(down.character.concentration).toBeNull()
    expect(down.character.hp.current).toBe(0)
  })
})
