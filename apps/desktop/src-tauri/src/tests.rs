use crate::models::{
    ability::Ability,
    alignment::Alignment,
    character::{
        background::Background,
        character::{Character, DeathSaves, HitDicePool, SkillProficiency},
        class::{ClassLevel, ClassName},
        feature::{Feature, FeatureSource, FeatureUses, RechargeOn},
        proficiency::ProficiencyLevel,
        race::Race,
        spell_slots::{SpellSlotLevel, SpellSlots},
    },
    condition::Condition,
    currency::Currency,
    damage::{DamageRoll, DamageType},
    dice::{DiceRoll, DiceType},
    item::{
        item::{Item, ItemDetails, MagicData},
        stats::weapon::{
            Damage, Handedness, Mastery, WeaponCategory, WeaponProperty, WeaponStats, WeaponType,
        },
    },
    size::Size,
    skill::Skill,
    speed::Speed,
};

/// Builds the example High Elf Wizard 1 / Acolyte from the starter character sheet.
fn build_elf_wizard() -> Character {
    let race = Race {
        name: "High Elf".into(),
        subrace: Some("High".into()),
        size: Size::Medium,
        base_speed: 30,
        darkvision: Some(60),
        trait_names: vec![
            "Darkvision".into(),
            "Keen Senses".into(),
            "Fey Ancestry".into(),
            "Trance".into(),
            "Cantrip".into(), // High Elf bonus cantrip
            "Elf Weapon Training".into(),
        ],
        languages: vec!["Common".into(), "Elvish".into()],
    };

    let class = ClassLevel {
        class: ClassName::Wizard,
        level: 1,
        subclass: None,
    };

    let acolyte_feature = Feature {
        name: "Shelter of the Faithful".into(),
        description: "As an acolyte, you command the respect of those who share your faith. \
            You and your adventuring companions can expect to receive free healing and care \
            at a temple, shrine, or other established presence of your faith."
            .into(),
        source: FeatureSource::Background,
        level_required: None,
        uses: None,
    };

    let background = Background {
        name: "Acolyte".into(),
        skill_proficiencies: vec![Skill::Insight, Skill::Religion],
        tool_proficiencies: vec![],
        bonus_languages: 2,
        feature: acolyte_feature,
        equipment: vec![
            "Holy symbol".into(),
            "Prayer book".into(),
            "Simple clothing".into(),
        ],
        personality_trait_options: vec![
            "I use polysyllabic words to give the impression of great scholarship.".into(),
        ],
        ideal_options: vec![
            "Knowledge. The path to power and self-improvement is through knowledge.".into(),
        ],
        bond_options: vec!["The tome I carry is the record of my life's work so far, \
             and no vault is safe enough to contain it."
            .into()],
        flaw_options: vec!["I would do almost anything to uncover historical secrets \
             that could support my research."
            .into()],
    };

    // Shortsword: +4 to hit (DEX +2 + prof +2), 1d6+2 piercing (Finesse)
    let shortsword = Item {
        id: "shortsword_01".into(),
        name: "Shortsword".into(),
        description: "A light, finesse blade favoured by dexterous fighters.".into(),
        value: 1000, // 10 gp in copper
        quantity: 1,
        weight_per_unit: 2.0,
        details: ItemDetails::Weapon(WeaponStats {
            category: WeaponCategory::Martial,
            weapon_type: WeaponType::Melee,
            damage: Damage {
                dice_count: 1,
                dice_type: DiceType::D6,
            },
            damage_type: DamageType::Piercing,
            properties: vec![WeaponProperty::Finesse, WeaponProperty::Light],
            handedness: Handedness::OneHanded,
            mastery: Some(Mastery::Nick),
        }),
        magic_data: None,
    };

    let spellbook = Item {
        id: "spellbook_01".into(),
        name: "Spellbook".into(),
        description: "A leather-bound tome containing the wizard's spells.".into(),
        value: 5000,
        quantity: 1,
        weight_per_unit: 3.0,
        details: ItemDetails::Valuable,
        magic_data: None,
    };

    let component_pouch = Item {
        id: "component_pouch_01".into(),
        name: "Component Pouch".into(),
        description: "A small pouch containing material components for spells.".into(),
        value: 2500,
        quantity: 1,
        weight_per_unit: 2.0,
        details: ItemDetails::Gear,
        magic_data: None,
    };

    // Wizard spell slots at level 1: 2 first-level slots
    let spell_slots = SpellSlots {
        level_1: SpellSlotLevel::new(2),
        level_2: SpellSlotLevel::new(0),
        level_3: SpellSlotLevel::new(0),
        level_4: SpellSlotLevel::new(0),
        level_5: SpellSlotLevel::new(0),
        level_6: SpellSlotLevel::new(0),
        level_7: SpellSlotLevel::new(0),
        level_8: SpellSlotLevel::new(0),
        level_9: SpellSlotLevel::new(0),
    };

    let arcane_recovery = Feature {
        name: "Arcane Recovery".into(),
        description: "Once per day when you finish a short rest, you can recover expended \
            spell slots with a combined level equal to or less than half your wizard level \
            (rounded up)."
            .into(),
        source: FeatureSource::Class("Wizard".into()),
        level_required: Some(1),
        uses: Some(FeatureUses {
            current: 1,
            max: 1,
            recharge: RechargeOn::LongRest,
        }),
    };

    let fey_ancestry = Feature {
        name: "Fey Ancestry".into(),
        description: "You have advantage on saving throws against being charmed, \
            and magic can't put you to sleep."
            .into(),
        source: FeatureSource::Race,
        level_required: None,
        uses: None,
    };

    let trance = Feature {
        name: "Trance".into(),
        description: "Elves don't need to sleep. Instead they meditate deeply for 4 hours \
            a day, gaining the same benefit that a human does from 8 hours of sleep."
            .into(),
        source: FeatureSource::Race,
        level_required: None,
        uses: None,
    };

    Character {
        id: "elf_wizard_starter".into(),
        name: "Elfenmagier".into(),
        race,
        classes: vec![class],
        background,
        alignment: Alignment::ChaoticGood,
        experience_points: 0,

        // Ability scores
        strength: 10,
        dexterity: 15,
        constitution: 14,
        intelligence: 16,
        wisdom: 12,
        charisma: 8,

        // HP (Wizard 1: max hit die d6 + CON mod +2 = 8)
        hp_max: 8,
        hp_current: 8,
        hp_temporary: 0,

        // Combat
        armor_class: 12, // DEX +2 (no armor)
        initiative_bonus: 2,
        speed: Speed::walk(30),

        // Saving throw proficiencies: Wizard gets INT + WIS
        saving_throw_proficiencies: vec![Ability::Intelligence, Ability::Wisdom],

        // Skill proficiencies:
        // Wizard class: Arcana, Investigation
        // Acolyte background: Insight, Religion
        skill_proficiencies: vec![
            SkillProficiency {
                skill: Skill::Arcana,
                level: ProficiencyLevel::Proficient,
            },
            SkillProficiency {
                skill: Skill::Investigation,
                level: ProficiencyLevel::Proficient,
            },
            SkillProficiency {
                skill: Skill::Insight,
                level: ProficiencyLevel::Proficient,
            },
            SkillProficiency {
                skill: Skill::Religion,
                level: ProficiencyLevel::Proficient,
            },
        ],

        other_proficiencies: vec![
            // High Elf weapon training
            "Longswords".into(),
            "Shortswords".into(),
            "Shortbows".into(),
            "Longbows".into(),
            // Wizard tools
            "Daggers".into(),
            "Darts".into(),
            "Slings".into(),
            "Quarterstaffs".into(),
            "Light crossbows".into(),
        ],

        languages: vec![
            "Common".into(),
            "Elvish".into(),
            "Draconic".into(),
            "Dwarvish".into(),
            "Goblin".into(),
        ],

        inspiration: false,
        death_saves: DeathSaves::default(),

        hit_dice: vec![HitDicePool {
            die: DiceType::D6,
            total: 1,
            used: 0,
        }],

        // Spellcasting (INT-based)
        // Spell save DC  = 8 + prof(2) + INT mod(3) = 13
        // Spell attack   = prof(2) + INT mod(3)     = +5
        spellcasting_ability: Some(Ability::Intelligence),
        spell_slots: Some(spell_slots),
        pact_magic: None,

        // Cantrips known (level 0 — no slot cost)
        known_spells: vec![
            "Chill Touch".into(),
            "Mage Hand".into(),
            "Shocking Grasp".into(),
            "Prestidigitation".into(),
        ],

        // Prepared 1st-level spells (4 spells from spellbook)
        prepared_spells: vec![
            "Burning Hands".into(),
            "Detect Magic".into(),
            "Mage Armor".into(),
            "Sleep".into(),
        ],

        inventory: vec![shortsword, spellbook, component_pouch],
        currency: Currency {
            copper: 0,
            silver: 0,
            electrum: 0,
            gold: 5,
            platinum: 0,
        },

        equipped_armor: None,
        equipped_main_hand: Some("shortsword_01".into()),
        equipped_off_hand: None,

        conditions: vec![],

        features: vec![arcane_recovery, fey_ancestry, trance],

        personality_traits: vec![
            "I use polysyllabic words to give the impression of great scholarship. \
             I have also spent so much time in the temple that I have little experience \
             dealing with people in the outside world."
                .into(),
        ],
        ideals: vec![
            "Knowledge. The path to power and self-improvement is through knowledge.".into(),
        ],
        bonds: vec!["The tome I carry is the record of my life's work so far, \
             and no vault is safe enough to contain it."
            .into()],
        flaws: vec!["I would do almost anything to uncover historical secrets \
             that could support my research."
            .into()],
        appearance: "High Elf with the grace typical of their kind.".into(),
        backstory: "A devotee of Oghma, god of knowledge, who has dedicated their life to \
            scholarship and the pursuit of arcane mastery."
            .into(),
        notes: String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_character_builds_without_panic() {
        let _ = build_elf_wizard();
    }

    #[test]
    fn test_total_level() {
        let c = build_elf_wizard();
        assert_eq!(c.total_level(), 1);
    }

    #[test]
    fn test_proficiency_bonus() {
        let c = build_elf_wizard();
        assert_eq!(c.proficiency_bonus(), 2);
    }

    #[test]
    fn test_ability_modifiers() {
        // STR 10 → +0, DEX 15 → +2, CON 14 → +2,
        // INT 16 → +3, WIS 12 → +1, CHA 8 → -1
        assert_eq!(Character::modifier(10), 0);
        assert_eq!(Character::modifier(15), 2);
        assert_eq!(Character::modifier(14), 2);
        assert_eq!(Character::modifier(16), 3);
        assert_eq!(Character::modifier(12), 1);
        assert_eq!(Character::modifier(8), -1);
    }

    #[test]
    fn test_hp_matches_sheet() {
        let c = build_elf_wizard();
        // Wizard 1: max hit die (6) + CON mod (2) = 8
        assert_eq!(c.hp_max, 8);
        assert_eq!(c.hp_current, 8);
        assert_eq!(c.hp_temporary, 0);
    }

    #[test]
    fn test_armor_class_matches_sheet() {
        let c = build_elf_wizard();
        assert_eq!(c.armor_class, 12); // DEX mod only, no armor
    }

    #[test]
    fn test_initiative_matches_sheet() {
        let c = build_elf_wizard();
        // Initiative = DEX mod = +2
        assert_eq!(c.initiative_bonus, 2);
    }

    #[test]
    fn test_speed_matches_sheet() {
        let c = build_elf_wizard();
        assert_eq!(c.speed.walk, 30);
    }

    #[test]
    fn test_spell_save_dc() {
        let c = build_elf_wizard();
        // DC = 8 + proficiency(2) + INT mod(3) = 13
        let prof = c.proficiency_bonus() as u8;
        let int_mod = Character::modifier(c.intelligence) as u8;
        let dc = 8 + prof + int_mod;
        assert_eq!(dc, 13);
    }

    #[test]
    fn test_spell_attack_bonus() {
        let c = build_elf_wizard();
        // Spell attack = proficiency(2) + INT mod(3) = +5
        let bonus = c.proficiency_bonus() + Character::modifier(c.intelligence);
        assert_eq!(bonus, 5);
    }

    #[test]
    fn test_saving_throw_proficiencies() {
        let c = build_elf_wizard();
        // Wizard saves: Intelligence and Wisdom
        assert!(c
            .saving_throw_proficiencies
            .contains(&Ability::Intelligence));
        assert!(c.saving_throw_proficiencies.contains(&Ability::Wisdom));
        assert!(!c.saving_throw_proficiencies.contains(&Ability::Strength));
        // INT save = INT mod(+3) + prof(+2) = +5
        let int_save = Character::modifier(c.intelligence) + c.proficiency_bonus();
        assert_eq!(int_save, 5);
        // WIS save = WIS mod(+1) + prof(+2) = +3
        let wis_save = Character::modifier(c.wisdom) + c.proficiency_bonus();
        assert_eq!(wis_save, 3);
    }

    #[test]
    fn test_skill_bonuses() {
        let c = build_elf_wizard();
        let prof = c.proficiency_bonus();

        // Arcana (INT proficient): INT mod(+3) + prof(+2) = +5
        let arcana_bonus = Character::modifier(c.intelligence) + prof;
        assert_eq!(arcana_bonus, 5);

        // Investigation (INT proficient): same = +5
        let investigation_bonus = Character::modifier(c.intelligence) + prof;
        assert_eq!(investigation_bonus, 5);

        // Insight (WIS proficient): WIS mod(+1) + prof(+2) = +3
        let insight_bonus = Character::modifier(c.wisdom) + prof;
        assert_eq!(insight_bonus, 3);

        // Acrobatics (DEX, no proficiency): DEX mod = +2
        let acrobatics_bonus = Character::modifier(c.dexterity);
        assert_eq!(acrobatics_bonus, 2);

        // Charisma-based (no proficiency): CHA mod = -1
        let cha_bonus = Character::modifier(c.charisma);
        assert_eq!(cha_bonus, -1);
    }

    #[test]
    fn test_weapon_attack_bonus() {
        let c = build_elf_wizard();
        // Shortsword is Finesse — uses DEX mod (+2) + prof (+2) = +4
        let attack_bonus = Character::modifier(c.dexterity) + c.proficiency_bonus();
        assert_eq!(attack_bonus, 4);
    }

    #[test]
    fn test_weapon_damage_bonus() {
        let c = build_elf_wizard();
        // Shortsword damage: 1d6 + DEX mod = 1d6+2
        let damage_mod = Character::modifier(c.dexterity);
        assert_eq!(damage_mod, 2);
    }

    #[test]
    fn test_hit_dice() {
        let c = build_elf_wizard();
        assert_eq!(c.hit_dice.len(), 1);
        assert_eq!(c.hit_dice[0].total, 1);
        assert_eq!(c.hit_dice[0].used, 0);
        assert_eq!(c.hit_dice[0].available(), 1);
    }

    #[test]
    fn test_spell_slots() {
        let c = build_elf_wizard();
        let slots = c.spell_slots.as_ref().unwrap();
        // Wizard 1 has exactly 2 first-level slots
        assert_eq!(slots.level_1.max, 2);
        assert_eq!(slots.level_1.available(), 2);
        // No higher-level slots yet
        assert_eq!(slots.level_2.max, 0);
    }

    #[test]
    fn test_known_cantrips() {
        let c = build_elf_wizard();
        assert!(c.known_spells.contains(&"Chill Touch".to_string()));
        assert!(c.known_spells.contains(&"Mage Hand".to_string()));
        assert!(c.known_spells.contains(&"Shocking Grasp".to_string()));
        assert!(c.known_spells.contains(&"Prestidigitation".to_string()));
        assert_eq!(c.known_spells.len(), 4);
    }

    #[test]
    fn test_prepared_spells() {
        let c = build_elf_wizard();
        assert!(c.prepared_spells.contains(&"Burning Hands".to_string()));
        assert!(c.prepared_spells.contains(&"Detect Magic".to_string()));
        assert!(c.prepared_spells.contains(&"Mage Armor".to_string()));
        assert!(c.prepared_spells.contains(&"Sleep".to_string()));
        // Wizard 1 can prepare INT mod(3) + level(1) = 4 spells
        assert_eq!(
            c.prepared_spells.len(),
            (Character::modifier(c.intelligence) as usize) + (c.total_level() as usize)
        );
    }

    #[test]
    fn test_currency() {
        let c = build_elf_wizard();
        assert_eq!(c.currency.gold, 5);
        assert_eq!(c.currency.silver, 0);
    }

    #[test]
    fn test_languages() {
        let c = build_elf_wizard();
        assert!(c.languages.contains(&"Common".to_string()));
        assert!(c.languages.contains(&"Elvish".to_string()));
        assert!(c.languages.contains(&"Draconic".to_string()));
        assert!(c.languages.contains(&"Dwarvish".to_string()));
        assert!(c.languages.contains(&"Goblin".to_string()));
        assert_eq!(c.languages.len(), 5);
    }

    #[test]
    fn test_darkvision() {
        let c = build_elf_wizard();
        assert_eq!(c.race.darkvision, Some(60));
    }

    #[test]
    fn test_no_conditions_at_start() {
        let c = build_elf_wizard();
        assert!(c.conditions.is_empty());
    }

    #[test]
    fn test_inventory_items() {
        let c = build_elf_wizard();
        assert_eq!(c.inventory.len(), 3);
        assert!(c.inventory.iter().any(|i| i.name == "Shortsword"));
        assert!(c.inventory.iter().any(|i| i.name == "Spellbook"));
        assert!(c.inventory.iter().any(|i| i.name == "Component Pouch"));
    }

    #[test]
    fn test_features() {
        let c = build_elf_wizard();
        let names: Vec<&str> = c.features.iter().map(|f| f.name.as_str()).collect();
        assert!(names.contains(&"Arcane Recovery"));
        assert!(names.contains(&"Fey Ancestry"));
        assert!(names.contains(&"Trance"));
    }

    #[test]
    fn test_alignment() {
        let c = build_elf_wizard();
        assert!(matches!(c.alignment, Alignment::ChaoticGood));
    }
}
