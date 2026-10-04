import type { TFunction } from 'i18next'

type GameGroup =
  | 'ability'
  | 'abilityShort'
  | 'skill'
  | 'race'
  | 'class'
  | 'background'
  | 'alignment'
  | 'alignmentShort'
  | 'condition'
  | 'itemCategory'
  | 'rarity'
  | 'school'
  | 'currency'
  | 'currencyName'

/**
 * Display label for a game term. Characters store terms in English (e.g. "Lawful Good"),
 * so stored data stays language-independent; unknown or homebrew values are shown as-is.
 */
export function gameLabel(t: TFunction, group: GameGroup, value: string): string {
  return t(`game.${group}.${value}`, { defaultValue: value })
}
