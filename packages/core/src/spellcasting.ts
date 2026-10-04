// Spell slot progression from the SRD 5.1 class tables.

/** Slots per spell level (index 0 = 1st level) for full casters, by character level. */
const FULL_CASTER: number[][] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

/** Paladin and Ranger: no slots at level 1. */
const HALF_CASTER: number[][] = [
  [],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
]

/** Warlock Pact Magic: [number of slots, slot level] by warlock level. */
const PACT_MAGIC: Array<[number, number]> = [
  [1, 1],
  [2, 1],
  [2, 2],
  [2, 2],
  [2, 3],
  [2, 3],
  [2, 4],
  [2, 4],
  [2, 5],
  [2, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [4, 5],
  [4, 5],
  [4, 5],
  [4, 5],
]

const FULL_CASTERS = new Set(['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'])
const HALF_CASTERS = new Set(['Paladin', 'Ranger'])

export const SPELL_LEVELS = 9

/** Whether a class's slots come back on a short rest (Warlock Pact Magic). */
export function slotsRecoverOnShortRest(className: string): boolean {
  return className === 'Warlock'
}

/**
 * Maximum spell slots per spell level (always 9 entries, index 0 = 1st level)
 * for a single-class character. Unknown classes have no slots.
 */
export function spellSlotMaximums(className: string, level: number): number[] {
  const index = Math.min(20, Math.max(1, Math.floor(level))) - 1
  const slots = new Array<number>(SPELL_LEVELS).fill(0)

  const table = FULL_CASTERS.has(className) ? FULL_CASTER : HALF_CASTERS.has(className) ? HALF_CASTER : null
  if (table) {
    table[index].forEach((count, i) => (slots[i] = count))
  } else if (className === 'Warlock') {
    const [count, slotLevel] = PACT_MAGIC[index]
    slots[slotLevel - 1] = count
  }
  return slots
}

/** Clamps stored used-slot counts to the current maximums (e.g. after levelling down). */
export function clampUsedSlots(used: readonly number[], maximums: readonly number[]): number[] {
  return maximums.map((max, i) => Math.min(max, Math.max(0, used[i] ?? 0)))
}
