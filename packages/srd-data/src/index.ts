// Game content from the System Reference Document 5.1 (CC-BY-4.0). See NOTICE.
export { SPELL_CATALOG } from './spells'
export { ITEM_CATALOG, withCatalogStats } from './items'
export { parseArmor, parseWeapon } from './parse'
export { CLASS_CATALOG, classFeaturesAt, featuresGainedAt, findClass } from './classes'
export type { ClassDef, ClassFeatureDef, FeatureRecharge, SubclassDef } from './classes'
export {
  RACE_CATALOG,
  LANGUAGES,
  ancestryDescription,
  findRace,
  raceAbilityBonuses,
  raceHitPointsPerLevel,
} from './races'
export type { DraconicAncestry, RaceDef, ResolvedRace, SubraceDef } from './races'
export { BACKGROUND_CATALOG, CUSTOM_BACKGROUND_SKILLS, findBackground, startingItems } from './backgrounds'
export type { BackgroundDef } from './backgrounds'
export { catalogFeaturesAt, hasMissingFeatures, raceFeaturesAt, syncFeatures } from './features'
