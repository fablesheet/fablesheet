import type { SheetTemplate } from '../types'

const skills: [string, string][] = [
  ['Athletics', 'Athletik'],
  ['Burglary', 'Einbruch'],
  ['Contacts', 'Kontakte'],
  ['Crafts', 'Handwerk'],
  ['Deceive', 'Täuschen'],
  ['Drive', 'Fahren'],
  ['Empathy', 'Empathie'],
  ['Fight', 'Kämpfen'],
  ['Investigate', 'Nachforschen'],
  ['Lore', 'Wissen'],
  ['Notice', 'Wahrnehmen'],
  ['Physique', 'Physis'],
  ['Provoke', 'Provozieren'],
  ['Rapport', 'Umgang'],
  ['Resources', 'Ressourcen'],
  ['Shoot', 'Schießen'],
  ['Stealth', 'Heimlichkeit'],
  ['Will', 'Wille'],
]

/** Aspects, a skill ladder rolled with four Fudge dice, stress and consequences. */
export const fateTemplate: SheetTemplate = {
  id: 'builtin:fate',
  version: 1,
  name: { en: 'Aspects & skills (Fate)', de: 'Aspekte & Fertigkeiten (Fate)' },
  description: {
    en: 'Narrative play with aspects, a skill ladder rolled with 4dF, stress boxes and consequences.',
    de: 'Erzählspiel mit Aspekten, Fertigkeitsleiter mit 4dF, Stresskästchen und Konsequenzen.',
  },
  attribution:
    'This work is based on Fate Core System and Fate Accelerated Edition (found at http://www.faterpg.com/), products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).',
  sections: [
    {
      id: 'aspects',
      title: { en: 'Aspects', de: 'Aspekte' },
      fields: [
        { id: 'highConcept', kind: 'text', label: { en: 'High concept', de: 'Konzept' } },
        { id: 'trouble', kind: 'text', label: { en: 'Trouble', de: 'Dilemma' } },
        { id: 'aspects', kind: 'list', label: { en: 'Other aspects', de: 'Weitere Aspekte' } },
      ],
    },
    {
      id: 'skills',
      title: { en: 'Skills', de: 'Fertigkeiten' },
      fields: [
        {
          id: 'skills',
          kind: 'list',
          label: { en: 'Skills', de: 'Fertigkeiten' },
          hint: { en: '+0 Mediocre … +4 Great', de: '+0 Mäßig … +4 Großartig' },
          withValue: true,
          roll: { kind: 'dice', expression: '4dF + @value' },
          defaultEntries: skills.map(([en, de]) => ({ name: { en, de }, value: 0 })),
        },
      ],
    },
    {
      id: 'stunts',
      title: { en: 'Stunts & refresh', de: 'Stunts & Erholung' },
      fields: [
        { id: 'stunts', kind: 'list', label: { en: 'Stunts', de: 'Stunts' } },
        { id: 'refresh', kind: 'number', label: { en: 'Refresh', de: 'Erholungsrate' }, default: 3, min: 0 },
        {
          id: 'fatePoints',
          kind: 'resource',
          label: { en: 'Fate points', de: 'Fate-Punkte' },
          max: '@refresh',
          onTable: true,
        },
      ],
    },
    {
      id: 'stress',
      title: { en: 'Stress & consequences', de: 'Stress & Konsequenzen' },
      fields: [
        { id: 'physicalStress', kind: 'track', label: { en: 'Physical stress', de: 'Körperlicher Stress' }, boxes: 3 },
        { id: 'mentalStress', kind: 'track', label: { en: 'Mental stress', de: 'Geistiger Stress' }, boxes: 3 },
        { id: 'mild', kind: 'text', label: { en: 'Mild consequence (2)', de: 'Leichte Konsequenz (2)' } },
        { id: 'moderate', kind: 'text', label: { en: 'Moderate consequence (4)', de: 'Mittlere Konsequenz (4)' } },
        { id: 'severe', kind: 'text', label: { en: 'Severe consequence (6)', de: 'Schwere Konsequenz (6)' } },
      ],
    },
  ],
  headerFields: ['fatePoints', 'refresh'],
}
