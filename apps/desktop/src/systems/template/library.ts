// The user's own templates on this device. Characters carry a copy of their
// template, so the library is only for creating new characters.
import type { SheetTemplate } from '@fablesheet/templates'
import { validateTemplate } from '@fablesheet/templates'

const KEY = 'fablesheet-templates'

export function loadLibrary(): SheetTemplate[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[]
    return raw.flatMap(t => {
      try {
        return [validateTemplate(t)]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

function write(templates: SheetTemplate[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates))
  } catch (e) {
    console.error('Could not save templates', e)
  }
}

/** Adds a template to the library, replacing one with the same id. */
export function saveToLibrary(template: SheetTemplate): void {
  write([...loadLibrary().filter(t => t.id !== template.id), template])
}

export function removeFromLibrary(id: string): void {
  write(loadLibrary().filter(t => t.id !== id))
}

/** Id for a template the user made or changed */
export function newTemplateId(): string {
  return `custom:${crypto.randomUUID()}`
}
