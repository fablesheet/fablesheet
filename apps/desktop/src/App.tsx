import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import type { Character } from '@fablesheet/core'
import { CharacterSelect } from './components/CharacterSelect'
import { CharacterBuilder } from './components/CharacterBuilder'
import { CharacterEditModal } from './components/CharacterEditModal'
import { CharacterHeader } from './components/CharacterHeader'
import { RestDialog } from './components/RestDialog'
import { SheetView } from './components/sheet/SheetView'
import { TableView, type TableObject } from './components/table/TableView'
import { SpellbookView } from './components/spellbook/SpellbookView'
import { BackpackView } from './components/backpack/BackpackView'
import { JournalView } from './components/journal/JournalView'
import { DiceView } from './components/dice/DiceView'
import { UpdateBanner } from './components/UpdateBanner'
import { useCharacterSaver } from './hooks/useCharacterSaver'

type View = 'select' | 'builder' | 'table' | TableObject

/** Page frame for the redesigned screens: header on top, content below */
function Frame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col gap-3 bg-fs-bg p-3 font-ui overflow-hidden animate-fade-in">
      {header}
      {children}
    </div>
  )
}

function Screens() {
  const { t } = useTranslation()
  const [character, setCharacter] = useState<Character | null>(null)
  const [view, setView] = useState<View>('select')
  const [editing, setEditing] = useState(false)
  const [resting, setResting] = useState(false)
  const saver = useCharacterSaver()

  // Single source of truth: update in memory right away, persist shortly after
  const handleUpdate = useCallback(
    (updated: Character) => {
      setCharacter(updated)
      saver.schedule(updated)
    },
    [saver],
  )

  const open = (c: Character) => {
    setCharacter(c)
    setView('table')
  }

  const toList = () => {
    saver.flush()
    setCharacter(null)
    setView('select')
  }

  if (view === 'builder') {
    return <CharacterBuilder onCreated={open} onCancel={() => setView('select')} />
  }

  if (view === 'select' || !character) {
    return <CharacterSelect onSelect={open} onCreateNew={() => setView('builder')} />
  }

  const onTable = view === 'table'
  return (
    <Frame
      header={
        <CharacterHeader
          character={character}
          backLabel={onTable ? t('table.allCharacters') : t('table.backToTable')}
          onBack={onTable ? toList : () => setView('table')}
          onEdit={() => setEditing(true)}
          onRest={() => setResting(true)}
        />
      }
    >
      {onTable ? (
        <TableView character={character} onOpen={setView} />
      ) : view === 'spellbook' ? (
        <SpellbookView character={character} onUpdate={handleUpdate} />
      ) : view === 'inventory' ? (
        <BackpackView character={character} onUpdate={handleUpdate} />
      ) : view === 'notes' ? (
        <JournalView character={character} onUpdate={handleUpdate} />
      ) : view === 'dice' ? (
        <DiceView character={character} />
      ) : (
        <SheetView character={character} onUpdate={handleUpdate} />
      )}

      {editing && (
        <CharacterEditModal
          character={character}
          onSaved={updated => {
            setCharacter(updated)
            setEditing(false)
          }}
          onDeleted={() => {
            setEditing(false)
            setCharacter(null)
            setView('select')
          }}
          onClose={() => setEditing(false)}
        />
      )}
      {resting && <RestDialog character={character} onRest={handleUpdate} onClose={() => setResting(false)} />}
    </Frame>
  )
}

export default function App() {
  return (
    <>
      <Screens />
      <UpdateBanner />
    </>
  )
}
