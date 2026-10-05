// Sheet templates as a game system: any game, with a sheet defined as data.
import type { TFunction } from 'i18next'
import type { ListEntry, TemplateCharacter } from '@fablesheet/templates'
import {
  allFields,
  evaluate,
  findField,
  formulaScope,
  localize,
  resolveRoll,
  resourceMax,
  templateDefinition,
} from '@fablesheet/templates'
import i18n from '../../i18n'
import { NotesView } from '../../components/journal/NotesView'
import { JournalArt, SheetArt } from '../../components/table/TableObjects'
import type { GameSystemUI, QuickRollGroup, Stat } from '../types'
import { TemplateBuilder } from './TemplateBuilder'
import { TemplateEditDialog } from './TemplateEditDialog'
import { TemplateSheetView } from './TemplateSheetView'

const lang = () => i18n.resolvedLanguage ?? 'en'

function stat(c: TemplateCharacter, id: string): Stat | null {
  const field = findField(c.template, id)
  if (!field) return null
  const value = c.values[id]
  if (field.kind === 'resource') {
    return { label: localize(field.label, lang()), value: `${value}/${resourceMax(c.template, c.values, id)}` }
  }
  return typeof value === 'number' ? { label: localize(field.label, lang()), value: String(value) } : null
}

const stats = (c: TemplateCharacter): Stat[] =>
  (c.template.headerFields ?? []).flatMap(id => {
    const s = stat(c, id)
    return s ? [s] : []
  })

/** Ids of combat actions, from their (localized) names */
const actionId = (index: number) => `action${index}`

export const templateSystem: GameSystemUI<TemplateCharacter> = {
  definition: templateDefinition,
  name: t => t('systems.template.name'),
  description: t => t('systems.template.description'),

  Builder: TemplateBuilder,
  EditDialog: TemplateEditDialog,

  subtitle: c => localize(c.template.name, lang()),
  headerStats: stats,
  cardStats: stats,
  hitPoints: c => {
    const id = c.template.healthField
    if (!id || typeof c.values[id] !== 'number') return null
    const max = resourceMax(c.template, c.values, id)
    return max > 0 ? { current: c.values[id] as number, max, temp: 0 } : null
  },

  tableObjects: (c, t: TFunction) => [
    {
      id: 'sheet',
      title: t('table.sheet'),
      subtitle: localize(c.template.name, lang()),
      art: <SheetArt initial={c.name.toUpperCase()} />,
      View: TemplateSheetView,
    },
    {
      id: 'notes',
      title: t('table.journal'),
      subtitle: t('table.journalHint'),
      art: <JournalArt label={t('table.journal')} />,
      View: NotesView,
    },
  ],

  tokens: c =>
    allFields(c.template).flatMap(field => {
      if (field.kind !== 'resource' || !field.onTable) return []
      const current = typeof c.values[field.id] === 'number' ? (c.values[field.id] as number) : 0
      return [
        {
          key: `resource/${field.id}`,
          name: localize(field.label, lang()),
          current,
          max: resourceMax(c.template, c.values, field.id),
          shape: 'round' as const,
          spend: () => ({ ...c, values: { ...c.values, [field.id]: Math.max(0, current - 1) } }),
        },
      ]
    }),

  quickRolls: (c): QuickRollGroup[] =>
    c.template.sections.map(section => ({
      title: localize(section.title, lang()),
      rolls: section.fields.flatMap(field => {
        if (field.kind === 'number' && field.roll) {
          const value = typeof c.values[field.id] === 'number' ? (c.values[field.id] as number) : 0
          const roll = resolveRoll(field.roll, c.template, c.values, value)
          return roll ? [{ label: localize(field.label, lang()), roll }] : []
        }
        if (field.kind === 'list' && field.roll) {
          const entries = Array.isArray(c.values[field.id]) ? (c.values[field.id] as ListEntry[]) : []
          return entries.flatMap(entry => {
            const roll = resolveRoll(field.roll!, c.template, c.values, entry.value ?? 0, entry)
            return roll ? [{ label: entry.name || localize(field.label, lang()), roll }] : []
          })
        }
        return []
      }),
    })),

  combat: {
    initiativeModifier: c => {
      try {
        return evaluate(c.template.initiative ?? 0, formulaScope(c.template, c.values))
      } catch {
        return 0
      }
    },
    actions: (_, c) =>
      (c.template.combatActions ?? []).map((label, i) => ({ id: actionId(i), label: localize(label, lang()) })),
    conditions: c => (c.template.conditions ?? []).map(condition => localize(condition, lang())),
    conditionLabel: (_, condition) => condition,
  },
}
