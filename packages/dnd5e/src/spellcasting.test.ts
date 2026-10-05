import { describe, expect, it } from 'vitest'
import { availableSlotLevels, clampUsedSlots, expendSlot, spellSlotMaximums } from './spellcasting'

describe('spellSlotMaximums', () => {
  it('follows the full caster table', () => {
    expect(spellSlotMaximums('Wizard', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(spellSlotMaximums('Cleric', 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
    expect(spellSlotMaximums('Bard', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1])
  })

  it('gives half casters slots from level 2', () => {
    expect(spellSlotMaximums('Paladin', 1)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(spellSlotMaximums('Ranger', 2)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(spellSlotMaximums('Paladin', 9)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
  })

  it('puts Warlock pact slots at a single level', () => {
    expect(spellSlotMaximums('Warlock', 1)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(spellSlotMaximums('Warlock', 5)).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0])
    expect(spellSlotMaximums('Warlock', 17)).toEqual([0, 0, 0, 0, 4, 0, 0, 0, 0])
  })

  it('gives non-casters and unknown classes no slots', () => {
    expect(spellSlotMaximums('Fighter', 10).every(n => n === 0)).toBe(true)
    expect(spellSlotMaximums('Homebrew', 3).every(n => n === 0)).toBe(true)
  })
})

describe('clampUsedSlots', () => {
  it('keeps used slots within the maximums', () => {
    expect(clampUsedSlots([3, 2, 1], [2, 0, 0, 0, 0, 0, 0, 0, 0])).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
  })
})

describe('casting', () => {
  const wizard = { className: 'Wizard', level: 5, spellSlotsUsed: [4, 1, 0, 0, 0, 0, 0, 0, 0] }

  it('lists slot levels that can cast a spell, lowest first', () => {
    expect(availableSlotLevels(wizard, 1)).toEqual([2, 3])
    expect(availableSlotLevels(wizard, 3)).toEqual([3])
    expect(availableSlotLevels(wizard, 4)).toEqual([])
    expect(availableSlotLevels(wizard, 0)).toEqual([])
  })

  it('expends a slot only if one is left', () => {
    expect(expendSlot(wizard, 2).spellSlotsUsed).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
    expect(expendSlot(wizard, 1)).toBe(wizard)
    expect(expendSlot(wizard, 9)).toBe(wizard)
  })
})
