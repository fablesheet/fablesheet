import type { CharacterBase, OutcomeBand } from '@fablesheet/core'

/** Text in one language, or translations by language code (used by built-in templates) */
export type Localized = string | Readonly<Record<string, string>>

/**
 * A number, or a formula over field values: "@strength + 2", "(@a + @b) / 2".
 * "@value" is the value of the field (or list entry) the roll belongs to.
 */
export type Formula = number | string

/** A roll of a template; numbers can be formulas over the sheet's fields */
export type RollTemplate =
  | { kind: 'd20'; modifier: Formula }
  /** Dice expression that may contain field references, e.g. "4dF + @value" */
  | { kind: 'dice'; expression: string; bands?: OutcomeBand[] }
  /** Roll-under: d100 by default, or a single d20 */
  | { kind: 'under'; target: Formula; sides?: 20 | 100 }
  /** Three attributes (ids of number fields); for list entries they can come from the entry */
  | { kind: '3d20'; attributes?: [string, string, string]; skill: Formula; modifier?: Formula }
  | { kind: 'duality'; modifier: Formula }
  | { kind: 'highest'; pool: Formula }

interface FieldBase {
  id: string
  label: Localized
  /** Short help shown under the field */
  hint?: Localized
}

/** A number such as an attribute or a skill rating, optionally with a roll */
export interface NumberField extends FieldBase {
  kind: 'number'
  default?: number
  min?: number
  max?: number
  roll?: RollTemplate
}

export interface TextField extends FieldBase {
  kind: 'text'
  multiline?: boolean
  default?: string
  placeholder?: Localized
}

/** A row of boxes to tick, e.g. stress or experience */
export interface TrackField extends FieldBase {
  kind: 'track'
  boxes: number
}

/** A pool with a current value and a maximum, e.g. hit points or fate points */
export interface ResourceField extends FieldBase {
  kind: 'resource'
  max: Formula
  /** Starts full if omitted */
  default?: number
  /** Show as a token on the table (tap to spend one) */
  onTable?: boolean
}

/** Entries the player adds, e.g. skills, aspects, moves */
export interface ListField extends FieldBase {
  kind: 'list'
  /** Entries have a number (skills) or are only text (aspects) */
  withValue?: boolean
  /** Each entry chooses three attributes (for 3d20 checks) */
  entryAttributes?: boolean
  /** Roll for each entry; "@value" is the entry's number */
  roll?: RollTemplate
  defaultEntries?: { name: Localized; value?: number; attributes?: [string, string, string] }[]
}

export type TemplateField = NumberField | TextField | TrackField | ResourceField | ListField
export type FieldKind = TemplateField['kind']

export interface TemplateSection {
  id: string
  title: Localized
  fields: TemplateField[]
}

/** A character sheet for any game, defined without code */
export interface SheetTemplate {
  /** Stable id; built-in templates start with "builtin:" */
  id: string
  version: number
  name: Localized
  description?: Localized
  /** Credits and license of the game the template follows */
  attribution?: string
  sections: TemplateSection[]
  /** Up to three number or resource fields shown in the header and on the card */
  headerFields?: string[]
  /** Resource field shown as the health bar */
  healthField?: string
  /** Initiative modifier for the combat bar */
  initiative?: Formula
  /** Actions of a turn the combat bar tracks */
  combatActions?: Localized[]
  /** Conditions offered as timed effects */
  conditions?: Localized[]
}

export interface ListEntry {
  id: string
  name: string
  value?: number
  attributes?: [string, string, string]
}

export type FieldValue = number | string | boolean[] | ListEntry[]

/** A character played with a sheet template */
export interface TemplateCharacter extends CharacterBase {
  system: 'template'
  template: SheetTemplate
  values: Record<string, FieldValue>
}
