import { useState, useCallback } from 'react'
import './App.css'
import type { Character } from '@fablesheet/core'
import { CharacterSelect } from './components/CharacterSelect'
import { CharacterSheet } from './components/CharacterSheet'
import { CharacterBuilder } from './components/CharacterBuilder'
import { SpellBook } from './components/SpellBook'
import { Inventory } from './components/Inventory'
import { updateCharacter } from './services/api'
import { UpdateBanner } from './components/UpdateBanner'

type View = 'select' | 'builder' | 'sheet' | 'spellbook' | 'inventory'

function Screens() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [view, setView] = useState<View>('select')

  const handleUpdate = useCallback(async (updated: Character) => {
    setCharacter(updated)
    try {
      await updateCharacter(updated.id, updated)
    } catch (err) {
      console.error('Failed to save character:', err)
    }
  }, [])

  if (view === 'builder') {
    return (
      <CharacterBuilder
        onCreated={c => {
          setCharacter(c)
          setView('sheet')
        }}
        onCancel={() => setView('select')}
      />
    )
  }

  if (view === 'select' || !character) {
    return (
      <CharacterSelect
        onSelect={c => {
          setCharacter(c)
          setView('sheet')
        }}
        onCreateNew={() => setView('builder')}
      />
    )
  }

  if (view === 'spellbook') {
    return <SpellBook character={character} onBack={() => setView('sheet')} onUpdate={handleUpdate} />
  }

  if (view === 'inventory') {
    return <Inventory character={character} onBack={() => setView('sheet')} onUpdate={handleUpdate} />
  }

  return (
    <CharacterSheet
      character={character}
      onBack={() => {
        setCharacter(null)
        setView('select')
      }}
      onSpellbook={() => setView('spellbook')}
      onInventory={() => setView('inventory')}
      onUpdate={handleUpdate}
    />
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
