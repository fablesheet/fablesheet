import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Currency } from '@fablesheet/core'
import { gameLabel } from '../i18n/game'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(8,4,0,0.78)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('sheet.editCurrency')}
        className="relative z-10 w-[clamp(280px,28vw,380px)] rounded-sm animate-fade-in px-6 py-5"
        style={{
          background: 'radial-gradient(ellipse at 60% 30%, #f5e8c8 0%, #e8d5a8 40%, #d4b87a 100%)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.72)',
          border: '1px solid rgba(100,70,20,0.45)',
        }}
      >
        <div className="font-cinzel-deco text-heading text-ink text-center mb-4">{t('sheet.currency')}</div>
        <div className="flex flex-col gap-2">
          {COINS.map(coin => (
            <label key={coin} className="flex items-center gap-3">
              <span className="font-fell-sc text-caption text-[#5a3a18] flex-1">
                {gameLabel(t, 'currencyName', coin)}
                <span className="text-[#9a8050]"> ({gameLabel(t, 'currency', coin)})</span>
              </span>
              <input
                type="number"
                min={0}
                value={values[coin]}
                onChange={e =>
                  setValues(prev => ({ ...prev, [coin]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))
                }
                className="w-24 text-right font-cinzel text-body text-ink rounded-sm px-2 py-1 bg-[rgba(255,240,180,0.4)] border border-[rgba(100,70,20,0.3)] outline-none focus:border-[rgba(100,70,20,0.6)]"
              />
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 font-cinzel text-caption tracking-[0.12em] text-[#8a7040] border border-[rgba(100,70,20,0.3)] py-1.5 rounded-sm cursor-pointer bg-transparent hover:border-[rgba(100,70,20,0.5)]"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onSave(values)}
            className="flex-[2] font-cinzel text-caption tracking-[0.12em] text-[#e8d090] border border-[rgba(100,70,20,0.5)] py-1.5 rounded-sm cursor-pointer hover:border-[rgba(200,168,75,0.6)] hover:text-gold"
            style={{ background: 'linear-gradient(160deg, #3a2208 0%, #2a1606 100%)' }}
          >
            {t('common.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}
