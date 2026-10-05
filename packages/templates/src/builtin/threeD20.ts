import type { NumberField, SheetTemplate } from '../types'

const attribute = (id: string, en: string, de: string): NumberField => ({
  id,
  kind: 'number',
  label: { en, de },
  default: 12,
  min: 1,
  max: 25,
  roll: { kind: 'under', target: '@value', sides: 20 },
})

/** Eight attributes and talents checked with 3d20, life points and fate points. */
export const threeD20Template: SheetTemplate = {
  id: 'builtin:3d20',
  version: 1,
  name: { en: '3d20 attributes & talents', de: '3W20-Eigenschaften & Talente' },
  description: {
    en: 'Eight attributes; every talent rolls 3d20 against three of them and pays with its talent points. Add your talents with the attributes your game uses.',
    de: 'Acht Eigenschaften; jedes Talent würfelt 3W20 gegen drei davon und bezahlt mit seinen Talentpunkten. Trag deine Talente mit den Eigenschaften deines Spiels ein.',
  },
  sections: [
    {
      id: 'attributes',
      title: { en: 'Attributes', de: 'Eigenschaften' },
      fields: [
        attribute('courage', 'Courage', 'Mut'),
        attribute('sagacity', 'Sagacity', 'Klugheit'),
        attribute('intuition', 'Intuition', 'Intuition'),
        attribute('charisma', 'Charisma', 'Charisma'),
        attribute('dexterity', 'Dexterity', 'Fingerfertigkeit'),
        attribute('agility', 'Agility', 'Gewandtheit'),
        attribute('constitution', 'Constitution', 'Konstitution'),
        attribute('strength', 'Strength', 'Körperkraft'),
      ],
    },
    {
      id: 'talents',
      title: { en: 'Talents', de: 'Talente' },
      fields: [
        {
          id: 'talents',
          kind: 'list',
          label: { en: 'Talents', de: 'Talente' },
          hint: {
            en: 'Each talent: three attributes and its talent points.',
            de: 'Jedes Talent: drei Eigenschaften und seine Talentpunkte.',
          },
          withValue: true,
          entryAttributes: true,
          roll: { kind: '3d20', skill: '@value' },
        },
      ],
    },
    {
      id: 'condition',
      title: { en: 'Life & fate', de: 'Leben & Schicksal' },
      fields: [
        {
          id: 'maxLife',
          kind: 'number',
          label: { en: 'Maximum life points', de: 'Maximale Lebenspunkte' },
          default: 30,
          min: 1,
        },
        { id: 'life', kind: 'resource', label: { en: 'Life points', de: 'Lebenspunkte' }, max: '@maxLife' },
        { id: 'fate', kind: 'resource', label: { en: 'Fate points', de: 'Schicksalspunkte' }, max: 3, onTable: true },
      ],
    },
  ],
  headerFields: ['fate'],
  healthField: 'life',
  initiative: '(@courage + @agility) / 2',
}
