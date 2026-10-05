import type { Dnd5eCharacter, Item, ItemBonuses } from './types'
import { parseDice, rollExpression, secureRandom, type RandomSource } from '@fablesheet/core'

/** A creature can be attuned to at most three magic items at a time. */
export const ATTUNEMENT_LIMIT = 3

export const NO_BONUSES: ItemBonuses = { ac: 0, attack: 0, damage: 0, savingThrows: 0 }

/** An item works if it doesn't need attunement or the character is attuned to it. */
export function isItemUsable(item: Item): boolean {
  return !item.requiresAttunement || item.isAttuned
}

/** Bonuses of worn items apply while equipped and usable. */
export function isItemActive(item: Item): boolean {
  return item.equipped && isItemUsable(item)
}

export function attunedCount(items: Item[]): number {
  return items.filter(i => i.requiresAttunement && i.isAttuned).length
}

/** Whether the character can attune to one more item. */
export function canAttune(items: Item[], item: Item): boolean {
  return item.isAttuned || attunedCount(items) < ATTUNEMENT_LIMIT
}

/** Sum of a bonus over all active items, e.g. armor class or saving throws. */
export function itemBonus(character: Pick<Dnd5eCharacter, 'items'>, key: 'ac' | 'savingThrows'): number {
  return (character.items ?? []).filter(isItemActive).reduce((sum, item) => sum + (item.bonuses?.[key] ?? 0), 0)
}

/** Spends one charge of an item. */
export function spendCharge(character: Dnd5eCharacter, itemId: string): Dnd5eCharacter {
  return {
    ...character,
    items: character.items.map(i =>
      i.id === itemId && i.charges && i.charges.current > 0
        ? { ...i, charges: { ...i.charges, current: i.charges.current - 1 } }
        : i,
    ),
  }
}

/**
 * Charges regained on a rest: items recharging on a short rest also recharge on a
 * long one. A regain expression like "1d6+1" is rolled, otherwise all come back.
 */
export function rechargeItems(items: Item[], rest: 'short' | 'long', random: RandomSource = secureRandom): Item[] {
  return items.map(item => {
    const charges = item.charges
    if (!charges || charges.recharge === null) return item
    if (rest === 'short' && charges.recharge !== 'short') return item
    const expr = charges.regain ? parseDice(charges.regain) : null
    const regained = expr ? rollExpression(expr, item.name, random).total : charges.max
    return { ...item, charges: { ...charges, current: Math.min(charges.max, charges.current + Math.max(0, regained)) } }
  })
}
