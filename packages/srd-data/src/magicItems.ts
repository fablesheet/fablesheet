// Magic items from the System Reference Document 5.1 (CC-BY-4.0). See NOTICE.
// Descriptions are short paraphrases. Magic weapons and armor (+1 to +3) are made
// from regular items in the item editor.
import type { Item, ItemBonuses, ItemCharges, ItemRarity } from '@fablesheet/core'

type CatalogItem = Omit<Item, 'id'>

interface Options {
  attunement?: boolean
  bonuses?: Partial<ItemBonuses>
  charges?: Omit<ItemCharges, 'current'>
  weight?: number
}

function magic(name: string, rarity: ItemRarity, description: string, options: Options = {}): CatalogItem {
  return {
    name,
    category: 'Magic Item',
    description,
    quantity: 1,
    weight: options.weight ?? 0,
    value: 0,
    equipped: false,
    rarity,
    requiresAttunement: options.attunement ?? false,
    isAttuned: false,
    notes: '',
    weapon: null,
    armor: null,
    bonuses: options.bonuses ? { ac: 0, attack: 0, damage: 0, savingThrows: 0, ...options.bonuses } : null,
    charges: options.charges ? { ...options.charges, current: options.charges.max } : null,
  }
}

const wand = (max: number, regain: string): Omit<ItemCharges, 'current'> => ({
  max,
  recharge: 'long',
  regain: regain || null,
})

export const MAGIC_ITEM_CATALOG: CatalogItem[] = [
  magic('Ring of Protection', 'Rare', '+1 bonus to AC and saving throws while wearing this ring.', {
    attunement: true,
    bonuses: { ac: 1, savingThrows: 1 },
  }),
  magic('Cloak of Protection', 'Uncommon', '+1 bonus to AC and saving throws while wearing this cloak.', {
    attunement: true,
    bonuses: { ac: 1, savingThrows: 1 },
    weight: 1,
  }),
  magic(
    'Bracers of Defense',
    'Rare',
    '+2 bonus to AC while you wear no armor and use no shield. Not added automatically: add it in the AC bonus when it applies.',
    { attunement: true, weight: 1 },
  ),
  magic(
    'Wand of Magic Missiles',
    'Uncommon',
    'Spend 1 charge to cast Magic Missile (1st level), +1 spell level per extra charge. Regains 1d6 + 1 charges at dawn; using the last charge, roll a d20 — on a 1 the wand crumbles.',
    { charges: wand(7, '1d6+1'), weight: 1 },
  ),
  magic(
    'Wand of Web',
    'Uncommon',
    'Spellcasters only. Spend 1 charge to cast Web (save DC 15). Regains 1d6 + 1 charges at dawn.',
    { attunement: true, charges: wand(7, '1d6+1'), weight: 1 },
  ),
  magic(
    'Wand of Fireballs',
    'Rare',
    'Spellcasters only. Spend 1 or more charges to cast Fireball (save DC 15) at 3rd level, +1 spell level per extra charge. Regains 1d6 + 1 charges at dawn.',
    { attunement: true, charges: wand(7, '1d6+1'), weight: 1 },
  ),
  magic(
    'Wand of Lightning Bolts',
    'Rare',
    'Spellcasters only. Spend 1 or more charges to cast Lightning Bolt (save DC 15) at 3rd level, +1 spell level per extra charge. Regains 1d6 + 1 charges at dawn.',
    { attunement: true, charges: wand(7, '1d6+1'), weight: 1 },
  ),
  magic(
    'Wand of Secrets',
    'Uncommon',
    'Spend 1 charge to learn whether a secret door or trap is within 30 ft. Regains 1d3 charges at dawn.',
    { charges: wand(3, '1d3'), weight: 1 },
  ),
  magic(
    'Staff of Healing',
    'Rare',
    'For bards, clerics and druids. Spend charges to cast Cure Wounds (1 charge per spell level), Lesser Restoration (2) or Mass Cure Wounds (5). Regains 1d6 + 4 charges at dawn.',
    { attunement: true, charges: wand(10, '1d6+4'), weight: 4 },
  ),
  magic(
    'Pearl of Power',
    'Uncommon',
    'Spellcasters only. Action: regain one expended spell slot of 3rd level or lower, once per dawn.',
    {
      attunement: true,
      charges: wand(1, ''),
    },
  ),
  magic(
    'Driftglobe',
    'Uncommon',
    'Casts Light on itself at will, or Daylight once per dawn; it can hover and follow you.',
    {
      charges: wand(1, ''),
      weight: 1,
    },
  ),
  magic('Bag of Holding', 'Uncommon', 'Holds up to 500 lb (64 cubic feet) but always weighs 15 lb.', { weight: 15 }),
  magic(
    'Boots of Elvenkind',
    'Uncommon',
    'Your steps make no sound; advantage on Dexterity (Stealth) checks that rely on moving silently.',
    {
      weight: 1,
    },
  ),
  magic(
    'Cloak of Elvenkind',
    'Uncommon',
    'With the hood up, Wisdom (Perception) checks to see you have disadvantage and you have advantage on Dexterity (Stealth) checks to hide.',
    {
      attunement: true,
      weight: 1,
    },
  ),
  magic('Goggles of Night', 'Uncommon', 'Darkvision out to 60 ft, or 60 ft more if you already have it.'),
  magic('Immovable Rod', 'Uncommon', 'Press the button and the rod stays fixed in place, holding up to 8,000 lb.', {
    weight: 2,
  }),
  magic('Rope of Climbing', 'Uncommon', '60 ft of silk rope that moves, knots and fastens itself on command.', {
    weight: 3,
  }),
  magic(
    'Periapt of Wound Closure',
    'Uncommon',
    'You stabilize at the start of your turn when dying, and hit dice heal you twice the rolled amount.',
    {
      attunement: true,
    },
  ),
  magic('Ring of Feather Falling', 'Rare', 'When you fall, you descend 60 ft per round and take no falling damage.', {
    attunement: true,
  }),
  magic(
    'Necklace of Adaptation',
    'Uncommon',
    'You can breathe in any environment and have advantage on saves against harmful gases and vapors.',
    {
      attunement: true,
    },
  ),
  magic(
    'Gauntlets of Ogre Power',
    'Uncommon',
    'Your Strength score is 19 while you wear them (no effect if it is already 19 or higher).',
    {
      attunement: true,
      weight: 2,
    },
  ),
  magic(
    'Headband of Intellect',
    'Uncommon',
    'Your Intelligence score is 19 while you wear it (no effect if it is already 19 or higher).',
    {
      attunement: true,
    },
  ),
  magic(
    'Amulet of Health',
    'Rare',
    'Your Constitution score is 19 while you wear it (no effect if it is already 19 or higher).',
    {
      attunement: true,
      weight: 1,
    },
  ),
]
