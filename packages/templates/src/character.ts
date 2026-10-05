import { migrateCharacter, type GameSystemDefinition } from '@fablesheet/core'
import type { SheetTemplate, TemplateCharacter } from './types'
import { completeValues } from './values'

export const TEMPLATE_SYSTEM = 'template'
export const TEMPLATE_SCHEMA_VERSION = 1

/** How the core reads and upgrades template characters. */
export const templateDefinition: GameSystemDefinition<TemplateCharacter> = {
  id: TEMPLATE_SYSTEM,
  schemaVersion: TEMPLATE_SCHEMA_VERSION,
  migrations: [
    // 0 → 1: first version; fill in the base fields
    doc => ({ conditions: [], features: [], combat: null, notes: '', values: {}, ...doc }),
  ],
}

/** A new character for a template, with every field at its default. */
export function createTemplateCharacter(
  template: SheetTemplate,
  name: string,
  language: string,
): Omit<TemplateCharacter, 'id'> {
  return {
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    system: TEMPLATE_SYSTEM,
    name,
    template,
    values: completeValues(template, {}, language),
    conditions: [],
    features: [],
    combat: null,
    notes: '',
  }
}

/** Puts a new or edited template on a character; values of the fields are kept. */
export function applyTemplate(
  character: TemplateCharacter,
  template: SheetTemplate,
  language: string,
): TemplateCharacter {
  return { ...character, template, values: completeValues(template, character.values, language) }
}

/** Reads a stored template character document (for tests and tools). */
export function migrateTemplateCharacter(raw: unknown): TemplateCharacter {
  return migrateCharacter<TemplateCharacter>(raw, [templateDefinition])
}
