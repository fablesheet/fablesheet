import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RollSpec } from '@fablesheet/core'
import { TWO_D6_BANDS } from '@fablesheet/core'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

/** Checks of different game families that need more than a dice expression */
type CheckKind = 'under' | '3d20' | 'duality' | 'highest' | '2d6'
const KINDS: CheckKind[] = ['under', '3d20', 'duality', 'highest', '2d6']

interface Props {
  onRoll: (spec: RollSpec, label: string) => void
}

const inputCls =
  'fs-focus w-16 min-h-10 text-sm text-center text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-1'

function NumberField({
  label,
  value,
  onChange,
  min,
  allowEmpty = false,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  allowEmpty?: boolean
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-fs-ink-muted">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        value={value ?? ''}
        onChange={e => {
          const text = e.target.value
          if (text === '') return onChange(allowEmpty ? null : (min ?? 0))
          onChange(Math.floor(Number(text)))
        }}
        className={inputCls}
      />
    </label>
  )
}

/** Percentile, 3d20, Hope & Fear, d6 pools and 2d6 moves — for games beyond a single d20. */
export function ChecksCard({ onRoll }: Props) {
  const { t } = useTranslation()
  const [kind, setKind] = useState<CheckKind>('under')
  const [target, setTarget] = useState(50)
  const [attributes, setAttributes] = useState<[number, number, number]>([12, 12, 12])
  const [skill, setSkill] = useState(4)
  const [modifier, setModifier] = useState(0)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [pool, setPool] = useState(2)

  function roll() {
    const label = t(`dice.check.${kind}`)
    switch (kind) {
      case 'under':
        return onRoll({ kind: 'under', target }, `${label} (${target})`)
      case '3d20':
        return onRoll({ kind: '3d20', attributes, skill, modifier }, `${label} (${attributes.join('/')}, ${skill})`)
      case 'duality':
        return onRoll({ kind: 'duality', modifier, difficulty }, label)
      case 'highest':
        return onRoll({ kind: 'highest', pool }, `${label} (${pool}${t('dice.die')}6)`)
      case '2d6':
        return onRoll(
          { kind: 'dice', expression: `2d6${modifier >= 0 ? '+' : ''}${modifier}`, bands: TWO_D6_BANDS },
          label,
        )
    }
  }

  return (
    <Card label={t('dice.checks')}>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('dice.checks')}>
        {KINDS.map(k => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={[
              'fs-focus min-h-9 px-3 text-sm rounded-md border cursor-pointer transition-colors',
              kind === k
                ? 'bg-fs-accent/15 border-fs-brass text-fs-ink'
                : 'bg-fs-tile border-fs-card-line text-fs-ink-muted hover:text-fs-ink',
            ].join(' ')}
          >
            {t(`dice.check.${k}`)}
          </button>
        ))}
      </div>
      <p className="text-xs text-fs-ink-muted m-0 mt-2">{t(`dice.checkHint.${kind}`)}</p>

      <div className="flex flex-wrap items-end gap-3 mt-3">
        {kind === 'under' && (
          <NumberField label={t('dice.target')} value={target} min={1} onChange={v => setTarget(v ?? 1)} />
        )}
        {kind === '3d20' && (
          <>
            {attributes.map((value, i) => (
              <NumberField
                key={i}
                label={t('dice.attribute', { n: i + 1 })}
                value={value}
                min={1}
                onChange={v =>
                  setAttributes(prev => prev.map((a, j) => (j === i ? (v ?? 1) : a)) as [number, number, number])
                }
              />
            ))}
            <NumberField label={t('dice.skillPoints')} value={skill} min={0} onChange={v => setSkill(v ?? 0)} />
            <NumberField label={t('dice.modifier')} value={modifier} onChange={v => setModifier(v ?? 0)} />
          </>
        )}
        {kind === 'duality' && (
          <>
            <NumberField label={t('dice.modifier')} value={modifier} onChange={v => setModifier(v ?? 0)} />
            <NumberField label={t('dice.difficulty')} value={difficulty} min={1} allowEmpty onChange={setDifficulty} />
          </>
        )}
        {kind === 'highest' && (
          <NumberField label={t('dice.poolSize')} value={pool} min={0} onChange={v => setPool(Math.min(20, v ?? 0))} />
        )}
        {kind === '2d6' && (
          <NumberField label={t('dice.modifier')} value={modifier} onChange={v => setModifier(v ?? 0)} />
        )}
        <span className="flex-1" />
        <Button variant="primary" onClick={roll}>
          {t('dice.rollButton')}
        </Button>
      </div>
    </Card>
  )
}
