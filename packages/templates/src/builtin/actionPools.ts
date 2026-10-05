import type { NumberField, SheetTemplate } from '../types'

const action = (id: string, en: string, de: string): NumberField => ({
  id,
  kind: 'number',
  label: { en, de },
  default: 0,
  min: 0,
  max: 4,
  roll: { kind: 'highest', pool: '@value' },
})

/** Action ratings rolled as d6 pools (highest die), stress, trauma, harm and coin. */
export const actionPoolsTemplate: SheetTemplate = {
  id: 'builtin:action-pools',
  version: 1,
  name: { en: 'Action pools (Blades in the Dark)', de: 'Aktionspools (Blades in the Dark)' },
  description: {
    en: 'Twelve action ratings rolled as d6 pools, stress and trauma, harm, coin and experience.',
    de: 'Zwölf Aktionswerte als W6-Pools, Stress und Trauma, Schaden, Münzen und Erfahrung.',
  },
  attribution:
    'This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).',
  sections: [
    {
      id: 'identity',
      title: { en: 'Identity', de: 'Identität' },
      fields: [
        { id: 'playbook', kind: 'text', label: { en: 'Playbook', de: 'Spielbuch' } },
        { id: 'heritage', kind: 'text', label: { en: 'Heritage', de: 'Herkunft' } },
        { id: 'background', kind: 'text', label: { en: 'Background', de: 'Hintergrund' } },
        { id: 'vice', kind: 'text', label: { en: 'Vice', de: 'Laster' } },
      ],
    },
    {
      id: 'insight',
      title: { en: 'Insight', de: 'Einsicht' },
      fields: [
        action('hunt', 'Hunt', 'Jagen'),
        action('study', 'Study', 'Studieren'),
        action('survey', 'Survey', 'Erkunden'),
        action('tinker', 'Tinker', 'Tüfteln'),
        { id: 'insightXp', kind: 'track', label: { en: 'Insight XP', de: 'Einsicht-EP' }, boxes: 6 },
      ],
    },
    {
      id: 'prowess',
      title: { en: 'Prowess', de: 'Geschick' },
      fields: [
        action('finesse', 'Finesse', 'Finesse'),
        action('prowl', 'Prowl', 'Schleichen'),
        action('skirmish', 'Skirmish', 'Kämpfen'),
        action('wreck', 'Wreck', 'Zerstören'),
        { id: 'prowessXp', kind: 'track', label: { en: 'Prowess XP', de: 'Geschick-EP' }, boxes: 6 },
      ],
    },
    {
      id: 'resolve',
      title: { en: 'Resolve', de: 'Entschlossenheit' },
      fields: [
        action('attune', 'Attune', 'Einstimmen'),
        action('command', 'Command', 'Befehlen'),
        action('consort', 'Consort', 'Verkehren'),
        action('sway', 'Sway', 'Beeinflussen'),
        { id: 'resolveXp', kind: 'track', label: { en: 'Resolve XP', de: 'Entschlossenheit-EP' }, boxes: 6 },
      ],
    },
    {
      id: 'condition',
      title: { en: 'Stress & harm', de: 'Stress & Schaden' },
      fields: [
        { id: 'stress', kind: 'track', label: { en: 'Stress', de: 'Stress' }, boxes: 9 },
        { id: 'trauma', kind: 'track', label: { en: 'Trauma', de: 'Trauma' }, boxes: 4 },
        { id: 'harm3', kind: 'text', label: { en: 'Harm 3 (need help)', de: 'Schaden 3 (braucht Hilfe)' } },
        { id: 'harm2', kind: 'text', label: { en: 'Harm 2 (−1d)', de: 'Schaden 2 (−1W)' } },
        { id: 'harm1', kind: 'text', label: { en: 'Harm 1 (less effect)', de: 'Schaden 1 (weniger Wirkung)' } },
        { id: 'healing', kind: 'track', label: { en: 'Healing clock', de: 'Heilungsuhr' }, boxes: 4 },
      ],
    },
    {
      id: 'gear',
      title: { en: 'Abilities & gear', de: 'Fähigkeiten & Ausrüstung' },
      fields: [
        { id: 'abilities', kind: 'list', label: { en: 'Special abilities', de: 'Besondere Fähigkeiten' } },
        { id: 'coin', kind: 'resource', label: { en: 'Coin', de: 'Münzen' }, max: 4, default: 0 },
        { id: 'load', kind: 'text', label: { en: 'Load & items', de: 'Last & Gegenstände' }, multiline: true },
        { id: 'playbookXp', kind: 'track', label: { en: 'Playbook XP', de: 'Spielbuch-EP' }, boxes: 8 },
      ],
    },
  ],
  headerFields: ['coin'],
}
