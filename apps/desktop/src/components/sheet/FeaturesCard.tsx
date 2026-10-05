import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Character, CharacterFeature } from '@fablesheet/core'
import { hasMissingClassFeatures, syncClassFeatures } from '@fablesheet/srd-data'
import { gameLabel } from '../../i18n/game'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Dialog } from '../ui/Dialog'
import { Segmented } from '../ui/Segmented'
import { Pips } from './Pips'

export const CUSTOM_SOURCE = 'Custom'
/** Up to this many uses are shown as pips, more as a counter */
const MAX_PIPS = 6

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

/** Features with limited uses: pips (or a counter for large pools like ki or Lay on Hands). */
export function FeatureUses({
  feature,
  onChange,
}: {
  feature: CharacterFeature
  onChange: (usesCurrent: number) => void
}) {
  const { t } = useTranslation()
  if (feature.usesMax === null || feature.usesCurrent === null) return null
  const max = feature.usesMax
  const current = feature.usesCurrent

  if (max <= MAX_PIPS) {
    return (
      <Pips
        total={max}
        filled={current}
        onChange={onChange}
        labelFilled={t('features.spend')}
        labelEmpty={t('features.regain')}
      />
    )
  }
  const step = (delta: number) => onChange(Math.min(max, Math.max(0, current + delta)))
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => step(-1)}
        disabled={current === 0}
        aria-label={t('features.spend')}
      >
        −
      </Button>
      <span className="font-display text-base min-w-14 text-center">
        {current}
        <span className="text-fs-ink-muted text-sm"> / {max}</span>
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => step(1)}
        disabled={current === max}
        aria-label={t('features.regain')}
      >
        +
      </Button>
    </div>
  )
}

export function FeaturesCard({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ index: number | null; feature: CharacterFeature } | null>(null)
  const missing = hasMissingClassFeatures(character)

  const setFeatures = (features: CharacterFeature[]) => onUpdate({ ...character, features })
  const patch = (index: number, change: Partial<CharacterFeature>) =>
    setFeatures(character.features.map((f, i) => (i === index ? { ...f, ...change } : f)))

  return (
    <Card
      label={t('sheet.features')}
      action={
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setEditing({
              index: null,
              feature: {
                name: '',
                source: CUSTOM_SOURCE,
                description: '',
                usesMax: null,
                usesCurrent: null,
                recharge: null,
              },
            })
          }
        >
          + {t('features.add')}
        </Button>
      }
    >
      {missing && (
        <div className="flex flex-wrap items-center gap-3 mb-3 rounded-lg border border-dashed border-fs-brass p-3 text-sm">
          <span className="flex-1 min-w-40">
            {t('features.missing', { className: gameLabel(t, 'class', character.className) })}
          </span>
          <Button size="sm" variant="primary" onClick={() => onUpdate(syncClassFeatures(character))}>
            {t('features.addFromClass')}
          </Button>
        </div>
      )}
      {character.features.length === 0 && !missing && (
        <p className="m-0 text-sm text-fs-ink-muted">{t('features.empty')}</p>
      )}
      <ul className="m-0 p-0 list-none flex flex-col">
        {character.features.map((f, i) => {
          const key = `${f.source}/${f.name}`
          const open = expanded === key
          return (
            <li key={key} className="border-b border-fs-card-line/60 last:border-b-0 py-1.5">
              <div className="flex items-center gap-2 min-h-10">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : key)}
                  className="fs-focus flex-1 min-w-0 text-left bg-transparent border-none p-1 -m-1 rounded-md cursor-pointer text-fs-ink"
                >
                  <span className="block font-display text-sm truncate">{f.name}</span>
                  <span className="block text-xs text-fs-ink-muted truncate">
                    {f.source === CUSTOM_SOURCE ? t('features.custom') : gameLabel(t, 'class', f.source)}
                    {f.recharge && ` · ${t(`features.recharge.${f.recharge}`, { defaultValue: f.recharge })}`}
                  </span>
                </button>
                <FeatureUses feature={f} onChange={usesCurrent => patch(i, { usesCurrent })} />
              </div>
              {open && (
                <div className="pt-1.5 pb-1 text-sm text-fs-ink-muted animate-fade-in">
                  {f.description && <p className="m-0 whitespace-pre-line">{f.description}</p>}
                  {f.source === CUSTOM_SOURCE && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => setEditing({ index: i, feature: f })}>
                        {t('features.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setFeatures(character.features.filter((_, j) => j !== i))}
                      >
                        {t('features.remove')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {editing && (
        <FeatureEditor
          initial={editing.feature}
          onClose={() => setEditing(null)}
          onSave={feature => {
            setFeatures(
              editing.index === null
                ? [...character.features, feature]
                : character.features.map((f, i) => (i === editing.index ? feature : f)),
            )
            setEditing(null)
          }}
        />
      )}
    </Card>
  )
}

const inputCls =
  'fs-focus w-full min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted'

function FeatureEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: CharacterFeature
  onSave: (feature: CharacterFeature) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [limited, setLimited] = useState(initial.usesMax !== null)
  const [usesMax, setUsesMax] = useState(initial.usesMax ?? 1)
  const [recharge, setRecharge] = useState<'short' | 'long'>(initial.recharge === 'short' ? 'short' : 'long')

  function save() {
    const max = Math.max(1, Math.floor(usesMax))
    const current = initial.usesCurrent === null ? max : Math.min(max, initial.usesCurrent)
    onSave({
      ...initial,
      name: name.trim(),
      description: description.trim(),
      usesMax: limited ? max : null,
      usesCurrent: limited ? current : null,
      recharge: limited ? recharge : null,
    })
  }

  return (
    <Dialog
      title={initial.name ? t('features.edit') : t('features.add')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" disabled={!name.trim()} onClick={save}>
            {t('table.save')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-fs-ink-muted">
          {t('features.name')}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-fs-ink-muted">
          {t('features.description')}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className={`${inputCls} py-2 resize-y`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm min-h-10">
          <input type="checkbox" checked={limited} onChange={e => setLimited(e.target.checked)} className="size-4" />
          {t('features.limited')}
        </label>
        {limited && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              {t('features.uses')}
              <input
                type="number"
                min={1}
                max={999}
                value={usesMax}
                onChange={e => setUsesMax(Number(e.target.value))}
                className={`${inputCls} w-20`}
              />
            </label>
            <Segmented
              label={t('features.rechargeLabel')}
              value={recharge}
              onChange={setRecharge}
              options={[
                { value: 'short', label: t('features.recharge.short') },
                { value: 'long', label: t('features.recharge.long') },
              ]}
            />
          </div>
        )}
      </div>
    </Dialog>
  )
}
