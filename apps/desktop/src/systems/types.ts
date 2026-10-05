import type { ComponentType, ReactNode } from 'react'
import type { TFunction } from 'i18next'
import type { CharacterBase, GameSystemDefinition, RollSpec } from '@fablesheet/core'

/** Props of views that show and change a character */
export interface CharacterViewProps<C extends CharacterBase = CharacterBase> {
  character: C
  onUpdate: (character: C) => void
}

/** An object on the character's table (sheet, spellbook, backpack, …) */
export interface TableObjectDef<C extends CharacterBase = CharacterBase> {
  id: string
  title: string
  subtitle: string
  art: ReactNode
  View: ComponentType<CharacterViewProps<C>>
}

export interface Stat {
  label: string
  value: string
}

export interface HitPoints {
  current: number
  max: number
  temp: number
}

/** A token on the table for something with limited uses; tapping it spends one */
export interface TableToken<C extends CharacterBase = CharacterBase> {
  key: string
  name: string
  current: number
  max: number
  shape: 'diamond' | 'round'
  spend: () => C
}

/** A roll for the character in the dice tray */
export interface QuickRoll {
  /** Name in the roll history, e.g. "Saving throw STR" */
  label: string
  /** Shorter name on the button, if different */
  short?: string
  roll: RollSpec
}

export interface QuickRollGroup {
  title: string
  rolls: QuickRoll[]
}

/** An action of a turn that the combat bar tracks, e.g. the bonus action */
export interface CombatAction {
  id: string
  label: string
}

/**
 * Everything the app needs from a game system. The generic parts of the app
 * (table, header, combat bar, dice tray, character list) only use this.
 */
export interface GameSystemUI<C extends CharacterBase = CharacterBase> {
  definition: GameSystemDefinition<C>
  /** Name shown when choosing a system */
  name: (t: TFunction) => string
  description: (t: TFunction) => string

  /** Creates a new character */
  Builder: ComponentType<{ onCreated: (character: C) => void; onCancel: () => void }>
  /** Edits name and basics, exports or deletes the character */
  EditDialog: ComponentType<{
    character: C
    onSaved: (character: C) => void
    onDeleted: () => void
    onClose: () => void
  }>
  /** Extra buttons in the header (with their dialogs), e.g. level up and rest */
  HeaderActions?: ComponentType<CharacterViewProps<C>>

  /** Line under the name, e.g. "Elf Wizard · Level 5" */
  subtitle: (character: C, t: TFunction) => string
  /** Numbers next to the name in the header */
  headerStats: (character: C, t: TFunction) => Stat[]
  /** Numbers on the character's card in the list */
  cardStats: (character: C, t: TFunction) => Stat[]
  /** Hit points for the bar in the header and on the card; null if the system has none */
  hitPoints: (character: C) => HitPoints | null

  tableObjects: (character: C, t: TFunction) => TableObjectDef<C>[]
  tokens: (character: C) => TableToken<C>[]
  quickRolls: (character: C, t: TFunction) => QuickRollGroup[]

  combat: {
    initiativeModifier: (character: C) => number
    actions: (t: TFunction, character: C) => CombatAction[]
    /** Conditions offered as timed effects (stored names) */
    conditions: (character: C) => readonly string[]
    conditionLabel: (t: TFunction, condition: string) => string
    /** Extra content in the combat bar, e.g. concentration */
    BarExtras?: ComponentType<CharacterViewProps<C>>
    /** Show the combat bar outside of combat too, e.g. while concentrating */
    showBarOutsideCombat?: (character: C) => boolean
  }
}
