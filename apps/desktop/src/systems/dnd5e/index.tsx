// Fifth edition rules from the SRD 5.1: rules (@fablesheet/dnd5e), content
// (@fablesheet/dnd5e-srd) and the screens below, put together as a game system.
import type { Dnd5eCharacter } from '@fablesheet/dnd5e'
import {
  ABILITY_NAMES,
  armorClass,
  equippedAttacks,
  formatModifier,
  isItemUsable,
  itemBonus,
  savingThrowBonus,
  skillBonus,
  spendCharge,
} from '@fablesheet/dnd5e'
import { gameLabel } from '../../i18n/game'
import { BackpackArt, BookArt, JournalArt, SheetArt } from '../../components/table/TableObjects'
import type { GameSystemUI, QuickRollGroup } from '../types'
import { dnd5eSystemDefinition } from './definition'
import { BackpackView } from './backpack/BackpackView'
import { CharacterBuilder } from './builder/CharacterBuilder'
import { CharacterEditModal } from './CharacterEditModal'
import { ConcentrationChip } from './combat/ConcentrationChip'
import { HeaderActions } from './HeaderActions'
import { JournalView } from './journal/JournalView'
import { CONDITIONS } from './sheet/conditions'
import { SheetView } from './sheet/SheetView'
import { SpellbookView } from './spellbook/SpellbookView'

/** Exhaustion has levels and isn't a timed effect */
const TIMED_CONDITIONS = CONDITIONS.filter(c => !c.startsWith('Exhaustion'))

export const dnd5e: GameSystemUI<Dnd5eCharacter> = {
  definition: dnd5eSystemDefinition,
  name: t => t('systems.dnd5e.name'),
  description: t => t('systems.dnd5e.description'),

  Builder: CharacterBuilder,
  EditDialog: CharacterEditModal,
  HeaderActions,

  subtitle: (c, t) =>
    t('sheet.subtitle', {
      race: gameLabel(t, 'race', c.race),
      className: gameLabel(t, 'class', c.className),
      level: c.level,
    }),
  headerStats: (c, t) => [
    { label: t('sheet.ac'), value: String(armorClass(c)) },
    { label: t('sheet.initiative'), value: formatModifier(c.initiativeBonus) },
    { label: t('sheet.speed'), value: String(c.speed) },
  ],
  cardStats: (c, t) => [
    { label: t('select.hp'), value: `${c.hp.current}/${c.hp.max}` },
    { label: t('select.ac'), value: String(armorClass(c)) },
    {
      label: t('select.alignmentShort'),
      value: c.alignment ? gameLabel(t, 'alignmentShort', c.alignment) : '—',
    },
  ],
  hitPoints: c => c.hp,

  tableObjects: (c, t) => {
    const spellCount = new Set([...c.knownSpells, ...c.preparedSpells]).size
    // Racial cantrips (e.g. High Elf, Tiefling) also go into the spellbook
    const hasSpellbook = c.spellcastingAbility !== null || c.knownSpells.length > 0
    return [
      {
        id: 'sheet',
        title: t('table.sheet'),
        subtitle: t('table.sheetHint'),
        art: <SheetArt initial={c.name.toUpperCase()} />,
        View: SheetView,
      },
      ...(hasSpellbook
        ? [
            {
              id: 'spellbook',
              title: t('table.spellbook'),
              subtitle: t('table.spellCount', { count: spellCount }),
              art: <BookArt />,
              View: SpellbookView,
            },
          ]
        : []),
      {
        id: 'inventory',
        title: t('table.backpack'),
        subtitle: t('inventory.catalogCount', { count: c.items.length }),
        art: <BackpackArt />,
        View: BackpackView,
      },
      {
        id: 'notes',
        title: t('table.journal'),
        subtitle: t('table.journalHint'),
        art: <JournalArt label={t('table.journal')} />,
        View: JournalView,
      },
    ]
  },

  // Feature uses are generic; magic items with charges are 5e
  tokens: c =>
    c.items
      .filter(i => i.charges && isItemUsable(i))
      .map(i => ({
        key: `item/${i.id}`,
        name: i.name,
        current: i.charges!.current,
        max: i.charges!.max,
        shape: 'round' as const,
        spend: () => spendCharge(c, i.id),
      })),

  quickRolls: (c, t): QuickRollGroup[] => {
    const attacks = equippedAttacks(c)
    const saveBonus = itemBonus(c, 'savingThrows')
    return [
      {
        title: t('combat.title'),
        rolls: [
          { label: t('sheet.initiative'), roll: { kind: 'd20', modifier: c.initiativeBonus } },
          ...attacks.map(a => ({ label: a.name, roll: { kind: 'd20' as const, modifier: a.attackBonus } })),
          ...attacks
            .filter(a => a.damage)
            .map(a => ({
              label: `${a.name}: ${t('table.damage')}`,
              roll: { kind: 'dice' as const, expression: a.damage!.replace('−', '-') },
            })),
        ],
      },
      {
        title: t('sheet.savingThrows'),
        rolls: ABILITY_NAMES.map(ab => ({
          label: `${t('table.save')} ${gameLabel(t, 'abilityShort', ab)}`,
          short: gameLabel(t, 'abilityShort', ab),
          roll: {
            kind: 'd20',
            modifier:
              savingThrowBonus(c.scores[ab], c.savingThrowProficiencies.includes(ab), c.proficiencyBonus) + saveBonus,
          },
        })),
      },
      {
        title: t('sheet.skills'),
        rolls: c.skills.map(skill => ({
          label: gameLabel(t, 'skill', skill.name),
          roll: { kind: 'd20', modifier: skillBonus(c.scores[skill.ability], skill.proficiency, c.proficiencyBonus) },
        })),
      },
    ]
  },

  combat: {
    initiativeModifier: c => c.initiativeBonus,
    actions: t => [
      { id: 'action', label: t('combat.actionUsed') },
      { id: 'bonusAction', label: t('combat.bonusActionUsed') },
      { id: 'reaction', label: t('combat.reactionUsed') },
    ],
    conditions: () => TIMED_CONDITIONS,
    conditionLabel: (t, condition) => gameLabel(t, 'condition', condition),
    BarExtras: ConcentrationChip,
    showBarOutsideCombat: c => c.concentration !== null,
  },
}
