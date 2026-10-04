import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Currency } from '@fablesheet/core'
import { gameLabel } from '../i18n/game'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'

const COINS: Array<keyof Currency> = ['pp', 'gp', 'ep', 'sp', 'cp']

interface Props {
  currency: Currency
  onSave: (currency: Currency) => void
  onClose: () => void
}

export function CurrencyModal({ currency, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [values, setValues] = useState<Currency>(currency)

  return (
    <Dialog
      title={t('sheet.currency')}
      onClose={onClose}
      width="min(92vw, 380px)"
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={() => onSave(values)}>
            {t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {COINS.map(coin => (
          <label key={coin} className="flex items-center gap-3 text-sm">
            <span className="flex-1">
              {gameLabel(t, 'currencyName', coin)}
              <span className="text-fs-ink-muted"> ({gameLabel(t, 'currency', coin)})</span>
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={values[coin]}
              onChange={e =>
                setValues(prev => ({ ...prev, [coin]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))
              }
              className="fs-focus w-28 min-h-10 text-right font-display text-lg text-fs-ink bg-fs-tile border border-fs-card-line rounded-lg px-3"
            />
          </label>
        ))}
      </div>
    </Dialog>
  )
}
