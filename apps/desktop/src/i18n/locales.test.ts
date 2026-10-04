import { describe, expect, it } from 'vitest'
import de from './locales/de.json'
import en from './locales/en.json'

function keys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
}

describe('locales', () => {
  it('German has exactly the same keys as English', () => {
    expect(keys(de).sort()).toEqual(keys(en).sort())
  })

  it('has no empty translations', () => {
    for (const [lang, data] of Object.entries({ en, de })) {
      const flat = JSON.stringify(data)
      expect(flat, lang).not.toMatch(/:""/)
    }
  })

  it('keeps interpolation placeholders consistent', () => {
    const placeholders = (s: string) => (s.match(/{{\s*\w+\s*}}/g) ?? []).sort()
    const lookup = (data: unknown, path: string) =>
      path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], data)
    for (const key of keys(en)) {
      const a = lookup(en, key)
      const b = lookup(de, key)
      if (typeof a === 'string' && typeof b === 'string') expect(placeholders(b), key).toEqual(placeholders(a))
    }
  })
})
