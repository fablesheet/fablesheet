import { describe, expect, it } from 'vitest'
import { performRoll } from '@fablesheet/core'
import {
  allFields,
  applyTemplate,
  BUILTIN_TEMPLATES,
  completeValues,
  createTemplateCharacter,
  exportTemplate,
  importTemplate,
  localize,
  migrateTemplateCharacter,
  references,
  resolveRoll,
  resourceMax,
  TemplateError,
  validateTemplate,
  type ListEntry,
  type RollTemplate,
  type SheetTemplate,
} from './index'

const template: SheetTemplate = {
  id: 'custom:test',
  version: 1,
  name: 'Test',
  sections: [
    {
      id: 'main',
      title: 'Main',
      fields: [
        { id: 'might', kind: 'number', label: 'Might', default: 3, roll: { kind: 'dice', expression: '2d6 + @value' } },
        { id: 'wits', kind: 'number', label: 'Wits', default: -1 },
        { id: 'maxHp', kind: 'number', label: 'Max HP', default: 8 },
        { id: 'hp', kind: 'resource', label: 'HP', max: '@maxHp + @might' },
        { id: 'stress', kind: 'track', label: 'Stress', boxes: 3 },
        { id: 'name2', kind: 'text', label: 'Epithet', default: 'the Bold' },
        {
          id: 'skills',
          kind: 'list',
          label: 'Skills',
          withValue: true,
          entryAttributes: true,
          roll: { kind: '3d20', skill: '@value' },
          defaultEntries: [{ name: { en: 'Climb', de: 'Klettern' }, value: 4, attributes: ['might', 'wits', 'might'] }],
        },
      ],
    },
  ],
  healthField: 'hp',
}

describe('values', () => {
  it('fills defaults, starts resources full and localizes entries', () => {
    const values = completeValues(template, {}, 'de')
    expect(values).toMatchObject({ might: 3, wits: -1, hp: 11, stress: [false, false, false], name2: 'the Bold' })
    expect((values.skills as ListEntry[])[0]).toMatchObject({ name: 'Klettern', value: 4 })
  })

  it('keeps existing values, resizes tracks and keeps values of removed fields', () => {
    const smaller: SheetTemplate = {
      ...template,
      sections: [{ ...template.sections[0], fields: [{ id: 'stress', kind: 'track', label: 'Stress', boxes: 2 }] }],
    }
    const values = completeValues(smaller, { stress: [true, true, true], old: 5 }, 'en')
    expect(values).toEqual({ stress: [true, true], old: 5 })
  })

  it('computes resource maximums from other fields', () => {
    expect(resourceMax(template, { maxHp: 10, might: 2 }, 'hp')).toBe(12)
    expect(resourceMax(template, {}, 'unknown')).toBe(0)
  })
})

describe('resolveRoll', () => {
  const values = completeValues(template, {}, 'en')

  it('substitutes the field value and other fields', () => {
    expect(resolveRoll({ kind: 'dice', expression: '2d6 + @value' }, template, values, -2)).toEqual({
      kind: 'dice',
      expression: '2d6 -2',
      bands: undefined,
    })
    expect(resolveRoll({ kind: 'd20', modifier: '@might + @wits' }, template, values, 0)).toEqual({
      kind: 'd20',
      modifier: 2,
    })
    expect(resolveRoll({ kind: 'under', target: '@value', sides: 20 }, template, values, 14)).toEqual({
      kind: 'under',
      target: 14,
      sides: 20,
    })
  })

  it('takes 3d20 attributes from the list entry', () => {
    const entry = (values.skills as ListEntry[])[0]
    expect(
      resolveRoll(
        template.sections[0].fields[6].kind === 'list' ? template.sections[0].fields[6].roll! : ({} as RollTemplate),
        template,
        values,
        entry.value,
        entry,
      ),
    ).toEqual({
      kind: '3d20',
      attributes: [3, -1, 3],
      skill: 4,
      modifier: 0,
    })
    expect(resolveRoll({ kind: '3d20', skill: 1 }, template, values, 1)).toBeNull()
  })
})

describe('validateTemplate', () => {
  it('accepts a valid template and drops unknown properties', () => {
    const clean = validateTemplate({ ...template, extra: 'x', sections: [{ ...template.sections[0], junk: 1 }] })
    expect(clean).toEqual(template)
  })

  it('rejects broken or hostile templates with a message', () => {
    const bad = (patch: Record<string, unknown>) => () => validateTemplate({ ...template, ...patch })
    expect(bad({ sections: 'x' })).toThrow(TemplateError)
    expect(bad({ name: 42 })).toThrow(/text/)
    const withField = (field: unknown) => bad({ sections: [{ id: 's', title: 'S', fields: [field] }] })
    expect(withField({ id: 'a', kind: 'number', label: 'A', roll: { kind: 'd20', modifier: 'alert(1)' } })).toThrow(
      /formula/,
    )
    expect(withField({ id: '1a', kind: 'text', label: 'A' })).toThrow(/id/)
    expect(withField({ id: 'a', kind: 'track', label: 'A', boxes: 9999 })).toThrow(TemplateError)
    expect(withField({ id: 'a', kind: 'script', label: 'A' })).toThrow(/unknown kind/)
    expect(
      bad({
        sections: [
          {
            id: 's',
            title: 'S',
            fields: [
              { id: 'a', kind: 'text', label: 'A' },
              { id: 'a', kind: 'text', label: 'B' },
            ],
          },
        ],
      }),
    ).toThrow(/twice/)
  })

  it('round-trips template files and turns built-ins into own templates', () => {
    const builtin = BUILTIN_TEMPLATES[0]
    const imported = importTemplate(JSON.parse(JSON.stringify(exportTemplate(builtin))))
    expect(imported.id).toBe(`custom:${builtin.id.slice(8)}`)
    expect(imported.sections).toEqual(builtin.sections)
    expect(() => importTemplate({ format: 'other' })).toThrow(TemplateError)
  })
})

describe('built-in templates', () => {
  it.each(BUILTIN_TEMPLATES.map(t => [t.id, t] as const))('%s is valid and consistent', (_, t) => {
    expect(validateTemplate(t)).toEqual(t)
    const ids = new Set(allFields(t).map(f => f.id))
    for (const f of allFields(t)) {
      const roll = 'roll' in f ? f.roll : undefined
      const formulas = [
        ...(roll ? Object.values(roll).filter((v): v is string => typeof v === 'string') : []),
        ...(f.kind === 'resource' && typeof f.max === 'string' ? [f.max] : []),
      ]
      for (const ref of formulas.flatMap(references))
        expect(ref === 'value' || ids.has(ref), `${f.id} → @${ref}`).toBe(true)
      for (const a of roll?.kind === '3d20' ? (roll.attributes ?? []) : []) expect(ids.has(a)).toBe(true)
    }
    for (const h of [...(t.headerFields ?? []), ...(t.healthField ? [t.healthField] : [])])
      expect(ids.has(h)).toBe(true)
    expect(localize(t.name, 'de')).not.toBe('')
  })

  it('can be played: every roll of a new character resolves and rolls', () => {
    for (const t of BUILTIN_TEMPLATES) {
      const c = createTemplateCharacter(t, 'Hero', 'en')
      for (const f of allFields(t)) {
        if (f.kind === 'number' && f.roll) {
          const spec = resolveRoll(f.roll, t, c.values, c.values[f.id] as number)
          expect(spec && performRoll(spec, f.id), `${t.id}/${f.id}`).not.toBeNull()
        }
      }
    }
  })
})

describe('template characters', () => {
  it('are created with defaults and keep values when the template changes', () => {
    const c = { ...createTemplateCharacter(template, 'Hero', 'en'), id: 'x' }
    expect(c).toMatchObject({ system: 'template', schemaVersion: 1, values: { might: 3 } })
    const changed = applyTemplate({ ...c, values: { ...c.values, might: 5 } }, { ...template, version: 2 }, 'en')
    expect(changed.values.might).toBe(5)
    expect(changed.template.version).toBe(2)
  })

  it('are read by the migration', () => {
    const c = migrateTemplateCharacter({ id: 'x', name: 'Hero', system: 'template', template })
    expect(c).toMatchObject({ schemaVersion: 1, values: {}, conditions: [], combat: null })
  })
})
