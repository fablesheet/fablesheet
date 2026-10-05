import { useTranslation } from 'react-i18next'
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import { longRest, shortRest } from '@fablesheet/dnd5e'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'

interface Props {
  character: Dnd5eCharacter
  onRest: (rested: Dnd5eCharacter) => void
  onClose: () => void
}

export function RestDialog({ character, onRest, onClose }: Props) {
  const { t } = useTranslation()

  const option = (kind: 'short' | 'long') => (
    <div className="flex items-start gap-4 rounded-lg border border-fs-card-line p-3">
      <div className="flex-1">
        <div className="font-display text-base">{t(kind === 'short' ? 'table.shortRest' : 'table.longRest')}</div>
        <p className="text-sm text-fs-ink-muted m-0 mt-1">
          {t(kind === 'short' ? 'sheet.shortRestHint' : 'sheet.longRestHint')}
        </p>
      </div>
      <Button
        variant={kind === 'long' ? 'primary' : 'secondary'}
        onClick={() => {
          onRest(kind === 'long' ? longRest(character) : shortRest(character))
          onClose()
        }}
      >
        {t('table.restNow')}
      </Button>
    </div>
  )

  return (
    <Dialog title={t('table.rest')} onClose={onClose} width="min(92vw, 520px)">
      <div className="flex flex-col gap-3">
        {option('short')}
        {option('long')}
      </div>
    </Dialog>
  )
}
