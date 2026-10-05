import type { SheetTemplate } from '../types'

/** Starting point for your own sheet in the sheet builder */
export const blankTemplate: SheetTemplate = {
  id: 'builtin:blank',
  version: 1,
  name: { en: 'Empty sheet', de: 'Leerer Bogen' },
  description: {
    en: 'Build your own sheet: attributes, skills, resources and rolls for any game.',
    de: 'Bau deinen eigenen Bogen: Werte, Fertigkeiten, Ressourcen und Würfe für jedes Spiel.',
  },
  sections: [
    {
      id: 'basics',
      title: { en: 'Basics', de: 'Grundlagen' },
      fields: [{ id: 'concept', kind: 'text', label: { en: 'Concept', de: 'Konzept' } }],
    },
  ],
}
