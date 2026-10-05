import type { CharacterFeature } from '@fablesheet/core'
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import { classFeaturesAt, findClass, toFeature } from './classes'
import { findRace } from './races'

type FeatureHolder = Pick<Dnd5eCharacter, 'className' | 'subclass' | 'race' | 'level' | 'scores' | 'features'>

const key = (f: Pick<CharacterFeature, 'source' | 'name'>) => `${f.source}/${f.name}`

/** Racial traits a character has at a level (subrace traits included). */
export function raceFeaturesAt(raceName: string, level: number, scores: Dnd5eCharacter['scores']): CharacterFeature[] {
  const found = findRace(raceName)
  if (!found) return []
  const { race, subrace } = found
  return [
    ...race.traits.map(def => ({ def, source: race.name })),
    ...(subrace?.traits ?? []).map(def => ({ def, source: subrace!.name })),
  ]
    .filter(({ def }) => def.level <= level)
    .map(({ def, source }) => toFeature(def, source, level, scores))
}

/** All features from the rules catalog: class, subclass, race and subrace. */
export function catalogFeaturesAt(character: Omit<FeatureHolder, 'features'>): CharacterFeature[] {
  return [
    ...raceFeaturesAt(character.race, character.level, character.scores),
    ...classFeaturesAt(character.className, character.subclass, character.level, character.scores),
  ]
}

/** Sources whose features are managed by the catalog (others, like backgrounds or custom ones, are left alone). */
function catalogSources(character: Omit<FeatureHolder, 'features'>): Set<string> {
  const sources = new Set<string>()
  const cls = findClass(character.className)
  if (cls) sources.add(cls.name).add(cls.subclass.name)
  const race = findRace(character.race)
  if (race) {
    sources.add(race.race.name)
    if (race.race.subrace) sources.add(race.race.subrace.name)
  }
  return sources
}

/** Whether the catalog has features for the character that it does not track yet. */
export function hasMissingFeatures(character: FeatureHolder): boolean {
  const have = new Set(character.features.map(key))
  return catalogFeaturesAt(character).some(f => !have.has(key(f)))
}

/** Personal features (descriptions that depend on a choice) keep their stored description. */
function isPersonal(feature: CharacterFeature): boolean {
  const race = findRace(feature.source)
  const traits = race ? [...race.race.traits, ...(race.race.subrace?.traits ?? [])] : []
  return traits.some(t => t.name === feature.name && t.personal)
}

/**
 * Brings class, subclass and racial features in line with the character's level:
 * adds new ones, recalculates uses (keeping how many are spent), drops ones from
 * levels the character no longer has. Features from other sources are kept as they are.
 */
export function syncFeatures<T extends FeatureHolder>(character: T): T {
  const sources = catalogSources(character)
  if (sources.size === 0) return character
  const existing = new Map(character.features.map(f => [key(f), f]))

  const synced = catalogFeaturesAt(character).map(f => {
    const old = existing.get(key(f))
    if (!old) return f
    const description = isPersonal(f) && old.description ? old.description : f.description
    if (old.usesCurrent === null || old.usesMax === null || f.usesMax === null) return { ...f, description }
    const spent = Math.max(0, old.usesMax - old.usesCurrent)
    return { ...f, description, usesCurrent: Math.max(0, f.usesMax - spent) }
  })
  const others = character.features.filter(f => !sources.has(f.source))
  return { ...character, features: [...synced, ...others] }
}
