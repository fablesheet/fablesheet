import { useTranslation } from 'react-i18next'
import { TWO_D6_BANDS } from '@fablesheet/core'
import type { NumberField, RollTemplate } from '@fablesheet/templates'
import { isValidFormula, localize } from '@fablesheet/templates'
import { inputCls, labelCls } from './styles'

/** Kinds offered in the editor; "moves" is a dice roll with 2d6 outcome bands */
type Choice = 'none' | 'd20' | 'dice' | 'moves' | 'under100' | 'under20' | '3d20' | 'duality' | 'highest'
const CHOICES: Choice[] = ['none', 'd20', 'dice', 'moves', 'under100', 'under20', '3d20', 'duality', 'highest']

function choiceOf(roll: RollTemplate | undefined): Choice {
  if (!roll) return 'none'
  if (roll.kind === 'dice') return roll.bands ? 'moves' : 'dice'
  if (roll.kind === 'under') return roll.sides === 20 ? 'under20' : 'under100'
  return roll.kind
}

function initial(choice: Choice): RollTemplate | undefined {
  switch (choice) {
    case 'none':
      return undefined
    case 'd20':
      return { kind: 'd20', modifier: '@value' }
    case 'dice':
      return { kind: 'dice', expression: '1d6 + @value' }
    case 'moves':
      return { kind: 'dice', expression: '2d6 + @value', bands: TWO_D6_BANDS }
    case 'under100':
      return { kind: 'under', target: '@value' }
    case 'under20':
      return { kind: 'under', target: '@value', sides: 20 }
    case '3d20':
      return { kind: '3d20', skill: '@value' }
    case 'duality':
      return { kind: 'duality', modifier: '@value' }
    case 'highest':
      return { kind: 'highest', pool: '@value' }
  }
}

interface Props {
  roll: RollTemplate | undefined
  onChange: (roll: RollTemplate | undefined) => void
  /** Number fields that 3d20 checks can use as attributes */
  numberFields: NumberField[]
  /** For list fields whose entries choose their own attributes */
  attributesFromEntry?: boolean
}

function FormulaInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
}) {
  const { t } = useTranslation()
  const valid = isValidFormula(value)
  return (
    <label className="flex-1 min-w-32">
      <span className={labelCls}>{label}</span>
      <input
        className={`${inputCls} font-mono`}
        value={String(value)}
        onChange={e => onChange(e.target.value)}
        aria-invalid={!valid}
      />
      {!valid && <span className="text-xs text-fs-danger">{t('builderTemplate.invalidFormula')}</span>}
    </label>
  )
}

/** Chooses how a field is rolled and with which formula. */
export function RollEditor({ roll, onChange, numberFields, attributesFromEntry = false }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const choice = choiceOf(roll)

  return (
    <div className="flex flex-col gap-2">
      <label>
        <span className={labelCls}>{t('builderTemplate.roll')}</span>
        <select className={inputCls} value={choice} onChange={e => onChange(initial(e.target.value as Choice))}>
          {CHOICES.map(c => (
            <option key={c} value={c}>
              {t(`builderTemplate.rollKind.${c}`)}
            </option>
          ))}
        </select>
      </label>
      {roll && (
        <div className="flex flex-wrap gap-2">
          {roll.kind === 'd20' && (
            <FormulaInput
              label={t('builderTemplate.modifier')}
              value={roll.modifier}
              onChange={modifier => onChange({ ...roll, modifier })}
            />
          )}
          {roll.kind === 'dice' && (
            <label className="flex-1 min-w-40">
              <span className={labelCls}>{t('builderTemplate.expression')}</span>
              <input
                className={`${inputCls} font-mono`}
                value={roll.expression}
                onChange={e => onChange({ ...roll, expression: e.target.value })}
              />
            </label>
          )}
          {roll.kind === 'under' && (
            <FormulaInput
              label={t('builderTemplate.target')}
              value={roll.target}
              onChange={target => onChange({ ...roll, target })}
            />
          )}
          {roll.kind === 'duality' && (
            <FormulaInput
              label={t('builderTemplate.modifier')}
              value={roll.modifier}
              onChange={modifier => onChange({ ...roll, modifier })}
            />
          )}
          {roll.kind === 'highest' && (
            <FormulaInput
              label={t('builderTemplate.pool')}
              value={roll.pool}
              onChange={pool => onChange({ ...roll, pool })}
            />
          )}
          {roll.kind === '3d20' && (
            <>
              {!attributesFromEntry &&
                [0, 1, 2].map(i => (
                  <label key={i} className="min-w-28">
                    <span className={labelCls}>{t('builderTemplate.attribute', { n: i + 1 })}</span>
                    <select
                      className={inputCls}
                      value={roll.attributes?.[i] ?? ''}
                      onChange={e => {
                        const attributes = [...(roll.attributes ?? ['', '', ''])] as [string, string, string]
                        attributes[i] = e.target.value
                        onChange({ ...roll, attributes })
                      }}
                    >
                      <option value="">—</option>
                      {numberFields.map(f => (
                        <option key={f.id} value={f.id}>
                          {localize(f.label, lang)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              <FormulaInput
                label={t('builderTemplate.skill')}
                value={roll.skill}
                onChange={skill => onChange({ ...roll, skill })}
              />
            </>
          )}
        </div>
      )}
      {roll && <p className="m-0 text-xs text-fs-ink-muted">{t('builderTemplate.formulaHint')}</p>}
    </div>
  )
}
