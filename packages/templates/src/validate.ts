// Templates can come from files other people made, so they are checked field by
// field before use. Only known properties are copied; everything else is dropped.
import type { OutcomeBand, OutcomeKind } from '@fablesheet/core'
import { isValidFormula } from './formula'
import type { Formula, Localized, RollTemplate, SheetTemplate, TemplateField, TemplateSection } from './types'

export class TemplateError extends Error {}

/** Identifies Fablesheet template files */
export const TEMPLATE_FILE_FORMAT = 'fablesheet-template'

const MAX_SECTIONS = 50
const MAX_FIELDS = 300
const MAX_TEXT = 2000
const MAX_BOXES = 50
const OUTCOMES: OutcomeKind[] = ['critical', 'success', 'partial', 'failure', 'fumble']

type Raw = Record<string, unknown>
const isRecord = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)

function fail(message: string): never {
  throw new TemplateError(message)
}

function text(v: unknown, what: string, max = MAX_TEXT): string {
  if (typeof v !== 'string') fail(`${what} must be text`)
  if (v.length > max) fail(`${what} is too long`)
  return v
}

function localized(v: unknown, what: string): Localized {
  if (typeof v === 'string') return text(v, what)
  if (isRecord(v)) {
    const entries = Object.entries(v)
    if (entries.length === 0 || entries.length > 20) fail(`${what} has no usable text`)
    return Object.fromEntries(entries.map(([lang, t]) => [text(lang, `${what} language`, 10), text(t, what)]))
  }
  return fail(`${what} must be text`)
}

function int(v: unknown, what: string, min = -10000, max = 10000): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) fail(`${what} must be a whole number`)
  return v
}

function id(v: unknown, what: string): string {
  const s = text(v, what, 64)
  if (!/^[a-zA-Z][\w-]*$/.test(s)) fail(`${what} "${s}" is not a valid id (letters, digits, - and _)`)
  return s
}

function formula(v: unknown, what: string): Formula {
  if (typeof v === 'number') return int(v, what)
  const s = text(v, what, 500)
  if (!isValidFormula(s)) fail(`${what} "${s}" is not a valid formula`)
  return s
}

function triple(v: unknown, what: string): [string, string, string] {
  if (!Array.isArray(v) || v.length !== 3) fail(`${what} must name three fields`)
  return v.map((x, i) => id(x, `${what} ${i + 1}`)) as [string, string, string]
}

function bands(v: unknown): OutcomeBand[] {
  if (!Array.isArray(v) || v.length > 10) fail('Outcome bands must be a short list')
  return v.map(b => {
    if (!isRecord(b) || !OUTCOMES.includes(b.kind as OutcomeKind)) fail('Unknown outcome in bands')
    return { min: int(b.min, 'Band minimum'), kind: b.kind as OutcomeKind }
  })
}

function roll(v: unknown, what: string): RollTemplate {
  if (!isRecord(v)) fail(`${what} must be a roll`)
  switch (v.kind) {
    case 'd20':
      return { kind: 'd20', modifier: formula(v.modifier ?? 0, `${what} modifier`) }
    case 'dice': {
      const expression = text(v.expression, `${what} expression`, 200)
      if (!/^[\w\s@+\-!<>=]*$/.test(expression)) fail(`${what} expression contains unsupported characters`)
      return { kind: 'dice', expression, ...(v.bands !== undefined ? { bands: bands(v.bands) } : {}) }
    }
    case 'under':
      if (v.sides !== undefined && v.sides !== 20 && v.sides !== 100) fail(`${what} can only use d20 or d100`)
      return {
        kind: 'under',
        target: formula(v.target, `${what} target`),
        ...(v.sides !== undefined ? { sides: v.sides as 20 | 100 } : {}),
      }
    case '3d20':
      return {
        kind: '3d20',
        ...(v.attributes !== undefined ? { attributes: triple(v.attributes, `${what} attributes`) } : {}),
        skill: formula(v.skill ?? 0, `${what} skill`),
        ...(v.modifier !== undefined ? { modifier: formula(v.modifier, `${what} modifier`) } : {}),
      }
    case 'duality':
      return { kind: 'duality', modifier: formula(v.modifier ?? 0, `${what} modifier`) }
    case 'highest':
      return { kind: 'highest', pool: formula(v.pool, `${what} pool`) }
    default:
      return fail(`${what} has an unknown kind`)
  }
}

function field(v: unknown): TemplateField {
  if (!isRecord(v)) fail('A field must be an object')
  const base = {
    id: id(v.id, 'Field id'),
    label: localized(v.label, 'Field label'),
    ...(v.hint !== undefined ? { hint: localized(v.hint, 'Field hint') } : {}),
  }
  const what = `Field "${base.id}"`
  switch (v.kind) {
    case 'number':
      return {
        ...base,
        kind: 'number',
        ...(v.default !== undefined ? { default: int(v.default, `${what} default`) } : {}),
        ...(v.min !== undefined ? { min: int(v.min, `${what} min`) } : {}),
        ...(v.max !== undefined ? { max: int(v.max, `${what} max`) } : {}),
        ...(v.roll !== undefined ? { roll: roll(v.roll, `${what} roll`) } : {}),
      }
    case 'text':
      return {
        ...base,
        kind: 'text',
        ...(v.multiline !== undefined ? { multiline: v.multiline === true } : {}),
        ...(v.default !== undefined ? { default: text(v.default, `${what} default`) } : {}),
        ...(v.placeholder !== undefined ? { placeholder: localized(v.placeholder, `${what} placeholder`) } : {}),
      }
    case 'track':
      return { ...base, kind: 'track', boxes: int(v.boxes, `${what} boxes`, 1, MAX_BOXES) }
    case 'resource':
      return {
        ...base,
        kind: 'resource',
        max: formula(v.max, `${what} maximum`),
        ...(v.default !== undefined ? { default: int(v.default, `${what} default`, 0) } : {}),
        ...(v.onTable !== undefined ? { onTable: v.onTable === true } : {}),
      }
    case 'list': {
      if (v.defaultEntries !== undefined && (!Array.isArray(v.defaultEntries) || v.defaultEntries.length > 100))
        fail(`${what} has too many entries`)
      return {
        ...base,
        kind: 'list',
        ...(v.withValue !== undefined ? { withValue: v.withValue === true } : {}),
        ...(v.entryAttributes !== undefined ? { entryAttributes: v.entryAttributes === true } : {}),
        ...(v.roll !== undefined ? { roll: roll(v.roll, `${what} roll`) } : {}),
        ...(v.defaultEntries !== undefined
          ? {
              defaultEntries: (v.defaultEntries as unknown[]).map(e => {
                if (!isRecord(e)) fail(`${what} entry must be an object`)
                return {
                  name: localized(e.name, `${what} entry`),
                  ...(e.value !== undefined ? { value: int(e.value, `${what} entry value`) } : {}),
                  ...(e.attributes !== undefined
                    ? { attributes: triple(e.attributes, `${what} entry attributes`) }
                    : {}),
                }
              }),
            }
          : {}),
      }
    }
    default:
      return fail(`${what} has an unknown kind`)
  }
}

function section(v: unknown): TemplateSection {
  if (!isRecord(v)) fail('A section must be an object')
  if (!Array.isArray(v.fields)) fail('A section needs a list of fields')
  return { id: id(v.id, 'Section id'), title: localized(v.title, 'Section title'), fields: v.fields.map(field) }
}

/** Checks a template (e.g. from a file) and returns a clean copy. Throws TemplateError. */
export function validateTemplate(raw: unknown): SheetTemplate {
  if (!isRecord(raw)) fail('This is not a template')
  if (!Array.isArray(raw.sections) || raw.sections.length > MAX_SECTIONS) fail('A template needs a list of sections')
  const template: SheetTemplate = {
    id: text(raw.id, 'Template id', 100),
    version: int(raw.version ?? 1, 'Template version', 1),
    name: localized(raw.name, 'Template name'),
    ...(raw.description !== undefined ? { description: localized(raw.description, 'Description') } : {}),
    ...(raw.attribution !== undefined ? { attribution: text(raw.attribution, 'Attribution') } : {}),
    sections: raw.sections.map(section),
  }
  const fields = template.sections.flatMap(s => s.fields)
  if (fields.length > MAX_FIELDS) fail('The template has too many fields')
  const ids = new Set<string>()
  for (const f of fields) {
    if (ids.has(f.id)) fail(`Field id "${f.id}" is used twice`)
    ids.add(f.id)
  }
  const kindOf = (fid: string) => fields.find(f => f.id === fid)?.kind
  if (raw.headerFields !== undefined) {
    if (!Array.isArray(raw.headerFields)) fail('Header fields must be a list')
    template.headerFields = raw.headerFields
      .slice(0, 3)
      .map(h => id(h, 'Header field'))
      .filter(h => kindOf(h) === 'number' || kindOf(h) === 'resource')
  }
  if (raw.healthField !== undefined) {
    const h = id(raw.healthField, 'Health field')
    if (kindOf(h) === 'resource') template.healthField = h
  }
  if (raw.initiative !== undefined) template.initiative = formula(raw.initiative, 'Initiative')
  for (const key of ['combatActions', 'conditions'] as const) {
    const list = raw[key]
    if (list === undefined) continue
    if (!Array.isArray(list) || list.length > 50) fail(`${key} must be a short list`)
    template[key] = list.map(l => localized(l, key))
  }
  return template
}

export interface TemplateFile {
  format: typeof TEMPLATE_FILE_FORMAT
  exportedAt: string
  template: SheetTemplate
}

export function exportTemplate(template: SheetTemplate, now: Date = new Date()): TemplateFile {
  return { format: TEMPLATE_FILE_FORMAT, exportedAt: now.toISOString(), template }
}

/** Reads a template file (parsed JSON). Throws TemplateError with a user-facing message. */
export function importTemplate(file: unknown): SheetTemplate {
  if (!isRecord(file) || file.format !== TEMPLATE_FILE_FORMAT) fail('This is not a Fablesheet template file.')
  const template = validateTemplate(file.template)
  // A copy from a file is the user's own template, even if it started as a built-in one
  return template.id.startsWith('builtin:') ? { ...template, id: `custom:${template.id.slice(8)}` } : template
}
