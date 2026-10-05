import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import { Button } from '../../components/ui/Button'
import type { CharacterViewProps } from '../types'
import { LevelUpDialog } from './levelup/LevelUpDialog'
import { RestDialog } from './RestDialog'

/** Level up and rest, next to the stats in the header. */
export function HeaderActions({ character, onUpdate }: CharacterViewProps<Dnd5eCharacter>) {
  const { t } = useTranslation()
  const [levelling, setLevelling] = useState(false)
  const [resting, setResting] = useState(false)

  return (
    <>
      {character.level < 20 && (
        <Button
          onBar
          size="sm"
          onClick={() => setLevelling(true)}
          title={t('levelUp.button')}
          aria-label={t('levelUp.button')}
          className="mr-2"
        >
          ▲<span className="hidden lg:inline"> {t('levelUp.short')}</span>
        </Button>
      )}
      <Button onBar variant="primary" size="sm" onClick={() => setResting(true)}>
        {t('table.rest')}
      </Button>

      {levelling && (
        <LevelUpDialog
          character={character}
          onLevelUp={updated => {
            onUpdate(updated)
            setLevelling(false)
          }}
          onClose={() => setLevelling(false)}
        />
      )}
      {resting && <RestDialog character={character} onRest={onUpdate} onClose={() => setResting(false)} />}
    </>
  )
}
