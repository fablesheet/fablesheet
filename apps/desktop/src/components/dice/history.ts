import type { RollResult } from '@fablesheet/core'

const MAX_HISTORY = 30

/** Rolls of this session, newest first; shared by the dice tray and rolls made on sheets */
let history: RollResult[] = []

export function getHistory(): RollResult[] {
  return history
}

export function addToHistory(result: RollResult): RollResult[] {
  history = [result, ...history].slice(0, MAX_HISTORY)
  return history
}

export function clearHistory(): void {
  history = []
}
