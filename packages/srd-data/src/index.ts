// Game content from the System Reference Document 5.1 (CC-BY-4.0). See NOTICE.
export { SPELL_CATALOG } from './spells'
export { ITEM_CATALOG, withCatalogStats } from './items'
export { parseArmor, parseWeapon } from './parse'
export {
  CLASS_CATALOG,
  classFeaturesAt,
  featuresGainedAt,
  findClass,
  hasMissingClassFeatures,
  syncClassFeatures,
} from './classes'
export type { ClassDef, ClassFeatureDef, FeatureRecharge, SubclassDef } from './classes'
