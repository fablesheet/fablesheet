import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { RollResult } from '@fablesheet/core'
import { DieShape } from './DieShape'
import { dieTone, displayTotal, OUTCOME_COLOR, outcomeText } from './rollText'

const VISIBLE_MS = 7000

interface Props {
  result: RollResult
  onClose: () => void
}

/** Result of a roll made on a sheet, shown at the bottom of the screen for a few seconds. */
export function RollToast({ result, onClose }: Props) {
  const { t } = useTranslation()
  useEffect(() => {
    const timer = window.setTimeout(onClose, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [result, onClose])

  const outcome = outcomeText(result, t)
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <button
        type="button"
        onClick={onClose}
        role="status"
        aria-live="polite"
        title={t('common.close')}
        className="pointer-events-auto flex items-center gap-4 max-w-xl w-full px-4 py-3 rounded-fs border border-fs-brass shadow-2xl cursor-pointer text-left animate-fade-in"
        style={{ background: '#1f2d24' }}
      >
        <span className="flex flex-wrap gap-1.5 max-w-[45%]">
          {result.dice.slice(0, 8).map((d, i) => (
            <DieShape
              key={i}
              sides={d.sides}
              value={d.value}
              size="sm"
              dropped={d.dropped}
              highlight={dieTone(result, i)}
            />
          ))}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-[#a9b8a8] truncate">{result.label}</span>
          {outcome && (
            <span
              className={`block font-display text-sm ${result.outcome?.kind ? OUTCOME_COLOR[result.outcome.kind] : 'text-[#efe4cc]'}`}
            >
              {outcome}
            </span>
          )}
        </span>
        <span className="font-display text-3xl text-[#efe4cc]">{displayTotal(result)}</span>
      </button>
    </div>
  )
}
