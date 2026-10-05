import { TWO_D6_BANDS } from '@fablesheet/core'
import type { NumberField, SheetTemplate } from '../types'

const stat = (id: string, en: string, de: string): NumberField => ({
  id,
  kind: 'number',
  label: { en, de },
  default: 0,
  min: -3,
  max: 4,
  roll: { kind: 'dice', expression: '2d6 + @value', bands: TWO_D6_BANDS },
})

/** Five stats rolled as 2d6 moves (10+, 7–9, 6−), harm, experience, moves and bonds. */
export const moves2d6Template: SheetTemplate = {
  id: 'builtin:moves-2d6',
  version: 1,
  name: { en: '2d6 moves (PbtA style)', de: '2W6-Spielzüge (PbtA-Stil)' },
  description: {
    en: 'Five stats from −3 to +4 rolled as 2d6 moves, health, experience, moves and bonds. Rename the stats to fit your game.',
    de: 'Fünf Werte von −3 bis +4 als 2W6-Spielzüge, Lebenspunkte, Erfahrung, Spielzüge und Bande. Benenne die Werte passend zu deinem Spiel um.',
  },
  sections: [
    {
      id: 'look',
      title: { en: 'Who you are', de: 'Wer du bist' },
      fields: [
        { id: 'playbook', kind: 'text', label: { en: 'Playbook', de: 'Spielbuch' } },
        { id: 'look', kind: 'text', label: { en: 'Look', de: 'Aussehen' }, multiline: true },
      ],
    },
    {
      id: 'stats',
      title: { en: 'Stats', de: 'Werte' },
      fields: [
        stat('force', 'Force', 'Kraft'),
        stat('grace', 'Grace', 'Anmut'),
        stat('wits', 'Wits', 'Verstand'),
        stat('charm', 'Charm', 'Charme'),
        stat('spirit', 'Spirit', 'Geist'),
      ],
    },
    {
      id: 'health',
      title: { en: 'Health & experience', de: 'Gesundheit & Erfahrung' },
      fields: [
        {
          id: 'maxHp',
          kind: 'number',
          label: { en: 'Maximum health', de: 'Maximale Lebenspunkte' },
          default: 10,
          min: 1,
        },
        { id: 'hp', kind: 'resource', label: { en: 'Health', de: 'Lebenspunkte' }, max: '@maxHp' },
        { id: 'harm', kind: 'track', label: { en: 'Harm', de: 'Schaden' }, boxes: 6 },
        { id: 'xp', kind: 'track', label: { en: 'Experience', de: 'Erfahrung' }, boxes: 8 },
      ],
    },
    {
      id: 'moves',
      title: { en: 'Moves & bonds', de: 'Spielzüge & Bande' },
      fields: [
        { id: 'moves', kind: 'list', label: { en: 'Moves', de: 'Spielzüge' } },
        { id: 'bonds', kind: 'list', label: { en: 'Bonds', de: 'Bande' } },
      ],
    },
  ],
  headerFields: ['force', 'grace', 'wits'],
  healthField: 'hp',
}
