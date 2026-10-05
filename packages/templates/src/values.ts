import type { FieldValue, ListEntry, SheetTemplate, TemplateField } from './types'
import { evaluate, type FormulaScope } from './formula'
import { localize } from './localize'

export function allFields(template: SheetTemplate): TemplateField[] {
  return template.sections.flatMap(s => s.fields)
}

export function findField(template: SheetTemplate, id: string): TemplateField | undefined {
  return allFields(template).find(f => f.id === id)
}

/** Numbers formulas can refer to: number fields and the current value of resources */
export function formulaScope(template: SheetTemplate, values: Record<string, FieldValue>): FormulaScope {
  const scope: Record<string, number> = {}
  for (const field of allFields(template)) {
    const value = values[field.id]
    if ((field.kind === 'number' || field.kind === 'resource') && typeof value === 'number') scope[field.id] = value
  }
  return scope
}

/** Maximum of a resource; a formula can depend on other fields (resources can't refer to themselves) */
export function resourceMax(template: SheetTemplate, values: Record<string, FieldValue>, fieldId: string): number {
  const field = findField(template, fieldId)
  if (field?.kind !== 'resource') return 0
  try {
    const { [fieldId]: _self, ...scope } = formulaScope(template, values)
    return Math.max(0, evaluate(field.max, scope))
  } catch {
    return 0
  }
}

let entryCounter = 0
/** Id for a new list entry */
export function newEntryId(): string {
  entryCounter += 1
  return `e${Date.now().toString(36)}${entryCounter.toString(36)}`
}

function defaultValue(field: TemplateField, language: string): FieldValue {
  switch (field.kind) {
    case 'number':
      return field.default ?? 0
    case 'text':
      return field.default ?? ''
    case 'track':
      return new Array<boolean>(field.boxes).fill(false)
    case 'resource':
      return field.default ?? -1 // filled with the maximum below
    case 'list':
      return (field.defaultEntries ?? []).map((e): ListEntry => ({
        id: newEntryId(),
        name: localize(e.name, language),
        ...(e.value !== undefined ? { value: e.value } : {}),
        ...(e.attributes ? { attributes: e.attributes } : {}),
      }))
  }
}

function fits(field: TemplateField, value: FieldValue | undefined): boolean {
  switch (field.kind) {
    case 'number':
    case 'resource':
      return typeof value === 'number'
    case 'text':
      return typeof value === 'string'
    case 'track':
      return Array.isArray(value) && value.every(v => typeof v === 'boolean')
    case 'list':
      return Array.isArray(value) && value.every(v => typeof v === 'object' && v !== null && 'name' in v)
  }
}

/**
 * Values for every field of a template: existing values are kept (tracks are resized),
 * missing ones get their default. Values of fields that no longer exist are kept too,
 * so editing a template never loses data.
 */
export function completeValues(
  template: SheetTemplate,
  values: Record<string, FieldValue>,
  language: string,
): Record<string, FieldValue> {
  const result: Record<string, FieldValue> = { ...values }
  for (const field of allFields(template)) {
    const value = values[field.id]
    if (!fits(field, value)) result[field.id] = defaultValue(field, language)
    else if (field.kind === 'track') {
      const boxes = value as boolean[]
      result[field.id] = Array.from({ length: field.boxes }, (_, i) => boxes[i] ?? false)
    }
  }
  // Resources without a value start full
  for (const field of allFields(template)) {
    if (field.kind === 'resource' && result[field.id] === -1) result[field.id] = resourceMax(template, result, field.id)
  }
  return result
}
