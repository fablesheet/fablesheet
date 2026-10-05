import type { Localized } from './types'

/** Text of a localized value in a language, falling back to English and then any translation. */
export function localize(text: Localized | undefined, language: string): string {
  if (text === undefined) return ''
  if (typeof text === 'string') return text
  const base = language.split('-')[0]
  return text[language] ?? text[base] ?? text.en ?? Object.values(text)[0] ?? ''
}
