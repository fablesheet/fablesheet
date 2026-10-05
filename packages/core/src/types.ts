// Types shared by all game systems. System-specific characters extend CharacterBase.

/** Fields every character has, whatever the game system */
export interface CharacterBase {
  /** Version of the stored document format of the character's game system */
  schemaVersion: number
  id: string
  name: string
  /** Game system id, e.g. 'dnd5e' */
  system: string
  /** Conditions and states, stored with the names the system uses */
  conditions: string[]
  /** Abilities and resources, some with limited uses */
  features: CharacterFeature[]
  /** Running combat, null outside of combat */
  combat: CombatState | null
  /** Free-form notes, Markdown */
  notes: string
}

export interface CharacterFeature {
  name: string
  /** Where it comes from, e.g. a class or race; 'Custom' for your own */
  source: string
  /** What the feature does, plain text */
  description: string
  /** Maximum uses; null if the feature is not limited */
  usesMax: number | null
  /** Uses left */
  usesCurrent: number | null
  /** When uses come back, e.g. 'short' or 'long' rest; the meaning depends on the system */
  recharge: string | null
}

export interface TimedEffect {
  id: string
  name: string
  /** Rounds left, counted down at the start of each new round */
  roundsLeft: number
  /** The effect is one of the standard conditions and is shown as such */
  condition: boolean
}

export interface CombatState {
  round: number
  initiative: number
  /** Ids of the actions spent this round; which actions exist depends on the game system */
  spentActions: string[]
  effects: TimedEffect[]
}
