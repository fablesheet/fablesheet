import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  /** The subclass from the SRD; other subclasses can be entered by name */
  srdName: string
  value: string
  onChange: (value: string) => void
}

const choice = (selected: boolean) =>
  [
    'fs-focus rounded-lg border text-sm text-left transition-colors min-h-11 px-3 py-2.5 cursor-pointer',
    selected
      ? 'bg-fs-accent/15 border-fs-brass text-fs-ink'
      : 'bg-fs-tile border-fs-card-line text-fs-ink hover:border-fs-brass',
  ].join(' ')

/** Choose the SRD subclass or type the name of another one. */
export function SubclassPicker({ srdName, value, onChange }: Props) {
  const { t } = useTranslation()
  const isSrd = value === srdName
  const [custom, setCustom] = useState(!isSrd && value !== '')

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={isSrd && !custom}
          onClick={() => {
            setCustom(false)
            onChange(srdName)
          }}
          className={choice(isSrd && !custom)}
        >
          <span className="block font-display">{srdName}</span>
          <span className="block text-xs text-fs-ink-muted">{t('levelUp.srdSubclass')}</span>
        </button>
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => {
            setCustom(true)
            if (isSrd) onChange('')
          }}
          className={choice(custom)}
        >
          <span className="block font-display">{t('levelUp.otherSubclass')}</span>
          <span className="block text-xs text-fs-ink-muted">{t('levelUp.otherSubclassHint')}</span>
        </button>
      </div>
      {custom && (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t('levelUp.subclassName')}
          aria-label={t('levelUp.subclassName')}
          className="fs-focus w-full min-h-10 text-sm text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3 placeholder:text-fs-ink-muted"
        />
      )}
    </div>
  )
}
