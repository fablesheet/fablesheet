import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import type { CharacterBase } from '@fablesheet/core'
import { CharacterSelect } from './components/CharacterSelect'
import { CharacterHeader } from './components/CharacterHeader'
import { CombatBar } from './components/combat/CombatBar'
import { StartCombatDialog } from './components/combat/StartCombatDialog'
import { DiceView } from './components/dice/DiceView'
import { SystemPicker } from './components/SystemPicker'
import { DICE_OBJECT, TableView } from './components/table/TableView'
import { UpdateBanner } from './components/UpdateBanner'
import { useCharacterSaver } from './hooks/useCharacterSaver'
import { SYSTEMS, systemFor } from './systems/registry'
import type { GameSystemUI } from './systems/types'

/** Character list, choosing a game system, creating a character, the table, or an object on it */
type View =
  | { kind: 'select' }
  | { kind: 'pickSystem' }
  | { kind: 'builder'; system: GameSystemUI }
  | { kind: 'table' }
  | { kind: 'object'; id: string }

/** Page frame: header on top, content below */
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
  const [character, setCharacter] = useState<CharacterBase | null>(null)
  const [view, setView] = useState<View>({ kind: 'select' })
  const [editing, setEditing] = useState(false)
  const [startingCombat, setStartingCombat] = useState(false)
  const saver = useCharacterSaver()

  // Single source of truth: update in memory right away, persist shortly after
  const handleUpdate = useCallback(
    (updated: CharacterBase) => {
      setCharacter(updated)
      saver.schedule(updated)
    },
    [saver],
  )

  const open = (c: CharacterBase) => {
    setCharacter(c)
    setView({ kind: 'table' })
  }

  const toList = () => {
    saver.flush()
    setCharacter(null)
    setView({ kind: 'select' })
  }

  // With a single game system there is nothing to choose
  const createNew = () =>
    setView(SYSTEMS.length === 1 ? { kind: 'builder', system: SYSTEMS[0] } : { kind: 'pickSystem' })

  if (view.kind === 'pickSystem') {
    return (
      <SystemPicker
        systems={SYSTEMS}
        onPick={system => setView({ kind: 'builder', system })}
        onCancel={() => setView({ kind: 'select' })}
      />
    )
  }

  if (view.kind === 'builder') {
    const { Builder } = view.system
    return <Builder onCreated={open} onCancel={() => setView({ kind: 'select' })} />
  }

  if (view.kind === 'select' || !character) {
    return <CharacterSelect onSelect={open} onCreateNew={createNew} />
  }

  const system = systemFor(character)
  const onTable = view.kind === 'table'
  const object = view.kind === 'object' ? system.tableObjects(character, t).find(o => o.id === view.id) : undefined
  const { EditDialog } = system

  return (
    <Frame
      header={
        <CharacterHeader
          character={character}
          system={system}
          onUpdate={handleUpdate}
          backLabel={onTable ? t('table.allCharacters') : t('table.backToTable')}
          onBack={onTable ? toList : () => setView({ kind: 'table' })}
          onEdit={() => setEditing(true)}
          onStartCombat={() => setStartingCombat(true)}
        />
      }
    >
      <CombatBar character={character} system={system} onUpdate={handleUpdate} />
      {onTable ? (
        <TableView
          character={character}
          system={system}
          onOpen={id => setView({ kind: 'object', id })}
          onUpdate={handleUpdate}
        />
      ) : object ? (
        <object.View character={character} onUpdate={handleUpdate} />
      ) : view.kind === 'object' && view.id === DICE_OBJECT ? (
        <DiceView quickRolls={system.quickRolls(character, t)} />
      ) : (
        <TableView
          character={character}
          system={system}
          onOpen={id => setView({ kind: 'object', id })}
          onUpdate={handleUpdate}
        />
      )}

      {editing && (
        <EditDialog
          character={character}
          onSaved={updated => {
            setCharacter(updated)
            setEditing(false)
          }}
          onDeleted={() => {
            setEditing(false)
            setCharacter(null)
            setView({ kind: 'select' })
          }}
          onClose={() => setEditing(false)}
        />
      )}
      {startingCombat && (
        <StartCombatDialog
          character={character}
          initiativeModifier={system.combat.initiativeModifier(character)}
          onStart={updated => {
            handleUpdate(updated)
            setStartingCombat(false)
          }}
          onClose={() => setStartingCombat(false)}
        />
      )}
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
