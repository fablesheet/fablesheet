import type { Item, ItemCategory } from '@fablesheet/dnd5e'
import { parseArmor, parseWeapon } from './parse'
import { MAGIC_ITEM_CATALOG } from './magicItems'

type CatalogItem = Omit<Item, 'id'>

function entry(
  name: string,
  category: ItemCategory,
  description: string,
  weight: number,
  value: number,
): CatalogItem {
  return {
    name, category, description, quantity: 1,
    weight, value, equipped: false,
    rarity: null, requiresAttunement: false, isAttuned: false, notes: '',
    weapon: category === 'Weapon' ? parseWeapon(description) : null,
    armor: category === 'Armor' ? parseArmor(description) : null,
  }
}

export const ITEM_CATALOG: CatalogItem[] = [
  // ── Simple Melee Weapons ────────────────────────────────────────────────────
  entry('Club',          'Weapon', 'Simple melee weapon. 1d4 bludgeoning. Light, Monk.',                          2,    0.1),
  entry('Dagger',        'Weapon', 'Simple melee weapon. 1d4 piercing. Finesse, Light, Thrown (range 20/60).',    1,    2),
  entry('Greatclub',     'Weapon', 'Simple melee weapon. 1d8 bludgeoning. Two-handed.',                          10,   0.2),
  entry('Handaxe',       'Weapon', 'Simple melee weapon. 1d6 slashing. Light, Thrown (range 20/60).',             2,    5),
  entry('Javelin',       'Weapon', 'Simple melee weapon. 1d6 piercing. Thrown (range 30/120).',                   2,    0.5),
  entry('Light Hammer',  'Weapon', 'Simple melee weapon. 1d4 bludgeoning. Light, Thrown (range 20/60).',          2,    2),
  entry('Mace',          'Weapon', 'Simple melee weapon. 1d6 bludgeoning.',                                       4,    5),
  entry('Quarterstaff',  'Weapon', 'Simple melee weapon. 1d6 bludgeoning. Versatile (1d8).',                      4,    0.2),
  entry('Sickle',        'Weapon', 'Simple melee weapon. 1d4 slashing. Light.',                                   2,    1),
  entry('Spear',         'Weapon', 'Simple melee weapon. 1d6 piercing. Thrown (range 20/60), Versatile (1d8).',   3,    1),

  // ── Simple Ranged Weapons ───────────────────────────────────────────────────
  entry('Light Crossbow','Weapon', 'Simple ranged weapon. 1d8 piercing. Ammunition (range 80/320), Loading, Two-handed.', 5, 25),
  entry('Dart',          'Weapon', 'Simple ranged weapon. 1d4 piercing. Finesse, Thrown (range 20/60).',          0.25, 0.05),
  entry('Shortbow',      'Weapon', 'Simple ranged weapon. 1d6 piercing. Ammunition (range 80/320), Two-handed.',  2,    25),
  entry('Sling',         'Weapon', 'Simple ranged weapon. 1d4 bludgeoning. Ammunition (range 30/120).',           0,    0.1),

  // ── Martial Melee Weapons ───────────────────────────────────────────────────
  entry('Battleaxe',     'Weapon', 'Martial melee weapon. 1d8 slashing. Versatile (1d10).',                       4,    10),
  entry('Flail',         'Weapon', 'Martial melee weapon. 1d8 bludgeoning.',                                      2,    10),
  entry('Glaive',        'Weapon', 'Martial melee weapon. 1d10 slashing. Heavy, Reach, Two-handed.',              6,    20),
  entry('Greataxe',      'Weapon', 'Martial melee weapon. 1d12 slashing. Heavy, Two-handed.',                     7,    30),
  entry('Greatsword',    'Weapon', 'Martial melee weapon. 2d6 slashing. Heavy, Two-handed.',                      6,    50),
  entry('Halberd',       'Weapon', 'Martial melee weapon. 1d10 slashing. Heavy, Reach, Two-handed.',              6,    20),
  entry('Lance',         'Weapon', 'Martial melee weapon. 1d12 piercing. Reach, Special.',                        6,    10),
  entry('Longsword',     'Weapon', 'Martial melee weapon. 1d8 slashing. Versatile (1d10).',                       3,    15),
  entry('Maul',          'Weapon', 'Martial melee weapon. 2d6 bludgeoning. Heavy, Two-handed.',                  10,    10),
  entry('Morningstar',   'Weapon', 'Martial melee weapon. 1d8 piercing.',                                         4,    15),
  entry('Pike',          'Weapon', 'Martial melee weapon. 1d10 piercing. Heavy, Reach, Two-handed.',             18,     5),
  entry('Rapier',        'Weapon', 'Martial melee weapon. 1d8 piercing. Finesse.',                                2,    25),
  entry('Scimitar',      'Weapon', 'Martial melee weapon. 1d6 slashing. Finesse, Light.',                         3,    25),
  entry('Shortsword',    'Weapon', 'Martial melee weapon. 1d6 piercing. Finesse, Light.',                         2,    10),
  entry('Trident',       'Weapon', 'Martial melee weapon. 1d6 piercing. Thrown (range 20/60), Versatile (1d8).',  4,     5),
  entry('War Pick',      'Weapon', 'Martial melee weapon. 1d8 piercing.',                                         2,     5),
  entry('Warhammer',     'Weapon', 'Martial melee weapon. 1d8 bludgeoning. Versatile (1d10).',                    2,    15),
  entry('Whip',          'Weapon', 'Martial melee weapon. 1d4 slashing. Finesse, Reach.',                         3,     2),

  // ── Martial Ranged Weapons ──────────────────────────────────────────────────
  entry('Blowgun',        'Weapon', 'Martial ranged weapon. 1 piercing. Ammunition (range 25/100), Loading.',     1,    10),
  entry('Hand Crossbow',  'Weapon', 'Martial ranged weapon. 1d6 piercing. Ammunition (range 30/120), Light, Loading.', 3, 75),
  entry('Heavy Crossbow', 'Weapon', 'Martial ranged weapon. 1d10 piercing. Ammunition (range 100/400), Heavy, Loading, Two-handed.', 18, 50),
  entry('Longbow',        'Weapon', 'Martial ranged weapon. 1d8 piercing. Ammunition (range 150/600), Heavy, Two-handed.', 2, 50),
  entry('Net',            'Weapon', 'Martial ranged weapon. Special. Thrown (range 5/15).',                       3,     1),

  // ── Armor — Light ───────────────────────────────────────────────────────────
  entry('Padded Armor',         'Armor', 'Light armor. AC 11 + Dex modifier. Disadvantage on Stealth.',           8,    5),
  entry('Leather Armor',        'Armor', 'Light armor. AC 11 + Dex modifier.',                                   10,   10),
  entry('Studded Leather Armor','Armor', 'Light armor. AC 12 + Dex modifier.',                                   13,   45),

  // ── Armor — Medium ──────────────────────────────────────────────────────────
  entry('Hide Armor',    'Armor', 'Medium armor. AC 12 + Dex modifier (max 2).',                                 12,   10),
  entry('Chain Shirt',   'Armor', 'Medium armor. AC 13 + Dex modifier (max 2).',                                 20,   50),
  entry('Scale Mail',    'Armor', 'Medium armor. AC 14 + Dex modifier (max 2). Disadvantage on Stealth.',        45,   50),
  entry('Breastplate',   'Armor', 'Medium armor. AC 14 + Dex modifier (max 2).',                                 20,  400),
  entry('Half Plate',    'Armor', 'Medium armor. AC 15 + Dex modifier (max 2). Disadvantage on Stealth.',        40,  750),

  // ── Armor — Heavy ───────────────────────────────────────────────────────────
  entry('Ring Mail',     'Armor', 'Heavy armor. AC 14. Disadvantage on Stealth.',                                40,   30),
  entry('Chain Mail',    'Armor', 'Heavy armor. AC 16. Str 13 required. Disadvantage on Stealth.',               55,   75),
  entry('Splint Armor',  'Armor', 'Heavy armor. AC 17. Str 15 required. Disadvantage on Stealth.',               60,  200),
  entry('Plate Armor',   'Armor', 'Heavy armor. AC 18. Str 15 required. Disadvantage on Stealth.',               65, 1500),

  // ── Shield ──────────────────────────────────────────────────────────────────
  entry('Shield',        'Armor', 'Shield. +2 AC. Requires one free hand.',                                       6,   10),

  // ── Adventuring Gear ────────────────────────────────────────────────────────
  entry('Backpack',           'Adventuring Gear', 'A backpack can hold 1 cubic foot / 30 pounds of gear.',         5,   2),
  entry('Bedroll',            'Adventuring Gear', 'A sleeping mat for rest outdoors.',                             7,   1),
  entry('Blanket',            'Adventuring Gear', 'A thick, warm blanket.',                                        3,   0.5),
  entry('Caltrops (bag of 20)','Adventuring Gear', 'Scattered caltrops reduce movement speed and cause 1 piercing damage on a failed DC 15 Dex save.', 2, 1),
  entry('Candle',             'Adventuring Gear', 'For 1 hour, illuminates a 5-ft radius with bright light and an additional 5-ft with dim light.', 0, 0.01),
  entry('Chain (10 feet)',    'Adventuring Gear', 'A chain with 10 hit points. Can be burst with a DC 20 Strength check.', 10, 5),
  entry("Climber's Kit",      'Adventuring Gear', 'Includes special pitons, boot tips, gloves, and a harness. Advantage on Athletics checks to climb.', 12, 25),
  entry('Crowbar',            'Adventuring Gear', 'Advantage on Strength checks where the crowbar can be applied.',  5,   2),
  entry('Fishing Tackle',     'Adventuring Gear', 'Includes a wooden rod, silken line, corks, steel hooks, leads, and velvet pouches.', 4, 1),
  entry('Grappling Hook',     'Adventuring Gear', 'Used with rope to ascend or secure a line.',                    4,   2),
  entry('Hammer',             'Adventuring Gear', 'A standard hammer for driving pitons or other tasks.',           3,   1),
  entry("Healer's Kit",       'Adventuring Gear', '10 uses. Stabilize a creature at 0 HP without a Medicine check.', 3, 5),
  entry('Holy Symbol',        'Adventuring Gear', 'An amulet, emblem, or reliquary used as a spellcasting focus for clerics and paladins.', 1, 5),
  entry('Holy Water (flask)', 'Adventuring Gear', 'Deals 2d6 radiant damage to undead or fiends it is thrown on.',  1,  25),
  entry('Hunting Trap',       'Adventuring Gear', 'A toothed metal trap. DC 13 Str save or restrained and 1d4 piercing damage.', 25, 5),
  entry('Ink (1-oz bottle)',  'Adventuring Gear', 'Black ink for writing.',                                         0,  10),
  entry('Lantern, Hooded',    'Adventuring Gear', 'Casts bright light in a 30-ft radius and dim light in a 60-ft radius. Can be shuttered.',  2, 5),
  entry('Lantern, Bullseye',  'Adventuring Gear', 'Casts bright light in a 60-ft cone and dim light in a 120-ft cone.',                      2, 10),
  entry('Manacles',           'Adventuring Gear', 'Restrain a Small or Medium creature. DC 20 Str or Dex (Thieves\' Tools) to escape.',       6,  2),
  entry('Mess Kit',           'Adventuring Gear', 'A tin box containing a cup and eating utensils.',                1,   0.2),
  entry('Mirror, Steel',      'Adventuring Gear', 'A small, polished steel mirror.',                               0.5,  5),
  entry('Oil (flask)',        'Adventuring Gear', 'Poured and lit: 1d4 fire damage per turn for 2 turns in a 5-ft area.',                     1, 0.1),
  entry('Paper (sheet)',      'Adventuring Gear', 'A single sheet of paper.',                                       0,   0.2),
  entry('Parchment (sheet)',  'Adventuring Gear', 'A single sheet of parchment made from animal skin.',             0,   0.1),
  entry('Pitons (10)',        'Adventuring Gear', 'Ten iron spikes used for climbing or anchoring.',                2.5, 0.5),
  entry('Pole (10-foot)',     'Adventuring Gear', 'A wooden pole 10 feet long.',                                    7,   0.05),
  entry('Pouch',              'Adventuring Gear', 'A cloth or leather pouch holding up to 1/5 cubic foot / 6 lbs.',  1,  0.5),
  entry('Rations (1 day)',    'Adventuring Gear', 'Dry foods suitable for extended travel: jerky, dried fruit, hardtack, nuts.',               2, 0.5),
  entry('Robes',              'Adventuring Gear', 'A set of fine or common robes.',                                 4,   1),
  entry('Rope, Hempen (50 ft)','Adventuring Gear', 'Hemp rope has 2 hit points and can be burst with a DC 17 Strength check.',               10,  1),
  entry('Rope, Silk (50 ft)', 'Adventuring Gear', 'Silk rope has 2 hit points and can be burst with a DC 17 Strength check. Lighter than hemp.', 5, 10),
  entry('Sack',               'Adventuring Gear', 'Holds up to 1 cubic foot / 30 lbs.',                            0.5, 0.01),
  entry('Sealing Wax',        'Adventuring Gear', 'Used to seal envelopes and documents.',                          0,   0.5),
  entry('Shovel',             'Adventuring Gear', 'A standard digging shovel.',                                     5,   2),
  entry('Signal Whistle',     'Adventuring Gear', 'A small whistle audible up to 600 feet away.',                   0,   0.05),
  entry('Signet Ring',        'Adventuring Gear', 'A ring bearing a personal or family seal.',                      0,   5),
  entry('Soap',               'Adventuring Gear', 'A cake of soap for cleaning.',                                   0,   0.02),
  entry('Spellbook',          'Adventuring Gear', 'A leather-bound tome with 100 pages for recording spells.',      3,  50),
  entry('Tent, Two-Person',   'Adventuring Gear', 'A simple and portable canvas shelter.',                         20,   2),
  entry('Tinderbox',          'Adventuring Gear', 'Used to light fires. Starting a fire takes 1 action.',           1,   0.5),
  entry('Torch',              'Adventuring Gear', 'Burns for 1 hour, providing bright light in a 20-ft radius and dim light in a 40-ft radius. Can deal 1 fire damage.', 1, 0.01),
  entry('Vial',               'Adventuring Gear', 'A small glass vial that holds 4 ounces of liquid.',              0,   1),
  entry('Waterskin',          'Adventuring Gear', 'Holds up to 4 pints of liquid.',                                 5,   0.2),
  entry('Whetstone',          'Adventuring Gear', 'Used to sharpen bladed weapons.',                                1,   0.01),

  // ── Tools ───────────────────────────────────────────────────────────────────
  entry("Alchemist's Supplies",     'Tool', "Includes a glass vial, a mortar and pestle, and a variety of chemicals. Used to brew potions and transmute materials.", 8,  50),
  entry("Brewer's Supplies",        'Tool', "Includes a large glass jug, a quantity of hops, a siphon, and several feet of tubing. Used to brew ales, wines, and spirits.", 9, 20),
  entry("Calligrapher's Supplies",  'Tool', "Includes ink, a dozen sheets of parchment, and three quills. Used to produce fine handwriting.", 5, 10),
  entry("Carpenter's Tools",        'Tool', "Includes a saw, a hammer, nails, a hatchet, a square, a ruler, an adze, a plane, and a chisel. Used to construct wooden structures.", 6, 8),
  entry("Cartographer's Tools",     'Tool', "Includes a quill, ink, parchment, a pair of compasses, calipers, and a ruler. Used to create maps.", 6, 15),
  entry("Cobbler's Tools",          'Tool', "Includes a hammer, an awl, a knife, a shoe stand, a cutter, spare leather, and thread. Used to craft and repair footwear.", 5, 5),
  entry("Cook's Utensils",          'Tool', "Includes metal pots, pans, ladles, tongs, and various cooking tools. Used to prepare meals.", 8, 1),
  entry('Disguise Kit',             'Tool', 'Includes cosmetics, hair dye, small props, and a few replacement outfits. Used to assume a different appearance.',   3, 25),
  entry('Forgery Kit',              'Tool', 'Includes several different types of ink, a variety of parchments and papers, several quills, seals, and sealing wax.', 5, 15),
  entry("Glassblower's Tools",      'Tool', "Includes a blowpipe, a small marver, blocks, and tweezers. Used to craft glass objects.", 5, 30),
  entry('Herbalism Kit',            'Tool', "Includes pouches, glass jars, clippers, leather gloves, and a mortar and pestle. Used to craft antitoxin and poultices.", 3, 5),
  entry("Jeweler's Tools",          'Tool', "Includes a small saw, files, pliers, a hammer, tweezers, and a small magnifying glass. Used to craft jeweled items.", 2, 25),
  entry("Leatherworker's Tools",    'Tool', "Includes a knife, a small mallet, an edger, a hole punch, thread, and leather scraps. Used to craft leather items.", 5, 5),
  entry("Mason's Tools",            'Tool', "Includes a trowel, a hammer, a chisel, brushes, and a square. Used to work with stone.", 8, 10),
  entry('Musical Instrument, Lute', 'Tool', 'A stringed instrument with a pear-shaped body. Requires proficiency to play well.',                                  2, 35),
  entry('Musical Instrument, Flute','Tool', 'A wind instrument made of wood or bone. Requires proficiency to play well.',                                         1,  2),
  entry("Navigator's Tools",        'Tool', "Includes a sextant, a compass, calipers, a ruler, parchment, ink, and a quill. Used to navigate by the stars.",    2, 25),
  entry("Painter's Supplies",       'Tool', "Includes an easel, canvas, paints, brushes, charcoal sticks, and a palette. Used to create works of art.", 5, 10),
  entry("Poisoner's Kit",           'Tool', "Includes glass vials, a mortar and pestle, chemicals, and a glass stirring rod. Used to craft and apply poisons.", 2, 50),
  entry("Potter's Tools",           'Tool', "Includes potter's needles, ribs, scrapers, a knife, and calipers. Used to create pottery.", 3, 10),
  entry("Smith's Tools",            'Tool', "Includes hammers, tongs, a chisel, brushes, and a file. Used to work with metal.", 8, 20),
  entry("Thieves' Tools",           'Tool', "Includes a small file, a set of lock picks, a small mirror, a set of narrow-bladed scissors, and a pair of pliers. Used to pick locks and disarm traps.", 1, 25),
  entry("Tinker's Tools",           'Tool', "Includes a variety of hand tools, thread, needles, a whetstone, scraps of cloth and leather, and a small pot of glue.", 10, 50),
  entry("Weaver's Tools",           'Tool', "Includes thread, needles, and scraps of cloth. Used to weave cloth and tailor garments.", 5, 1),
  entry("Woodcarver's Tools",       'Tool', "Includes a knife, a gouge, and a small saw. Used to craft wooden items.", 5, 1),

  // ── Potions ─────────────────────────────────────────────────────────────────
  entry('Potion of Healing',          'Potion', 'Regains 2d4+2 hit points when drunk.',                                        0.5,    50),
  entry('Potion of Greater Healing',  'Potion', 'Regains 4d4+4 hit points when drunk.',                                        0.5,   100),
  entry('Potion of Superior Healing', 'Potion', 'Regains 8d4+8 hit points when drunk.',                                        0.5,   500),
  entry('Potion of Supreme Healing',  'Potion', 'Regains 10d4+20 hit points when drunk.',                                      0.5,  1350),
  entry('Antitoxin',                  'Potion', 'Grants advantage on saving throws against poison for 1 hour.',                 0,      50),
  entry('Potion of Speed',            'Potion', 'Grants the effects of the Haste spell for 1 minute (no concentration).',      0.5,   400),
  entry('Potion of Invisibility',     'Potion', 'Grants invisibility for 1 hour or until the drinker attacks or casts a spell.', 0.5,  180),

  // ── Containers ──────────────────────────────────────────────────────────────
  entry('Barrel',     'Container', 'Holds 40 gallons of liquid or 4 cubic feet of solid material.',  70,   2),
  entry('Basket',     'Container', 'Holds 2 cubic feet / 40 lbs.',                                    2,   0.4),
  entry('Bottle, Glass','Container','A glass bottle that holds 1.5 pints of liquid.',                  2,   2),
  entry('Bucket',     'Container', 'Holds 3 gallons of liquid or ½ cubic foot of solid material.',    2,   0.05),
  entry('Chest',      'Container', 'Holds 12 cubic feet / 300 lbs.',                                 25,   5),
  entry('Flask',      'Container', 'Holds 1 pint of liquid.',                                         1,   0.02),
  entry('Jug',        'Container', 'Holds 1 gallon of liquid.',                                       4,   0.02),
  entry('Pot, Iron',  'Container', 'Holds 1 gallon of liquid.',                                      10,   2),
  entry('Saddlebags', 'Container', 'Straps to the back of a mount. Holds up to 2 cubic feet / 30 lbs on each side.', 8, 4),

  // ── Ammunition ──────────────────────────────────────────────────────────────
  entry('Arrows (20)',          'Ammunition', '20 standard arrows for shortbows and longbows.',         1,   1),
  entry('Blowgun Needles (50)', 'Ammunition', '50 needles for a blowgun.',                              1,   1),
  entry('Crossbow Bolts (20)',  'Ammunition', '20 bolts for light, hand, or heavy crossbows.',          1.5, 1),
  entry('Sling Bullets (20)',   'Ammunition', '20 lead bullets for a sling.',                           1.5, 0.04),

  // ── Magic items ─────────────────────────────────────────────────────────────
  ...MAGIC_ITEM_CATALOG,
]

/**
 * Adds weapon/armor stats from the catalog to an item that has none, matched by
 * name and category (e.g. items added before stats existed). Other items are returned as-is.
 */
export function withCatalogStats<T extends Item>(item: T): T {
  if (item.weapon || item.armor) return item
  const match = ITEM_CATALOG.find(c => c.name === item.name && c.category === item.category)
  return match && (match.weapon || match.armor) ? { ...item, weapon: match.weapon, armor: match.armor } : item
}
