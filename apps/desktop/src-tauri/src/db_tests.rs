#[cfg(test)]
mod tests {
    use rusqlite::{Connection, Result};

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /// Open an in-memory SQLite database and apply the full schema.
    fn open_db() -> Result<Connection> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        conn.execute_batch(include_str!("../../database/schema.sql"))?;
        Ok(conn)
    }

    /// Insert the example High Elf Wizard 1 / Acolyte character.
    fn insert_elf_wizard(conn: &Connection) -> Result<()> {
        let race_json = serde_json::json!({
            "name": "High Elf",
            "subrace": "High",
            "size": "Medium",
            "base_speed": 30,
            "darkvision": 60,
            "trait_names": ["Darkvision","Keen Senses","Fey Ancestry","Trance","Cantrip","Elf Weapon Training"],
            "languages": ["Common","Elvish"]
        }).to_string();

        let background_json = serde_json::json!({
            "name": "Acolyte",
            "skill_proficiencies": ["Insight","Religion"],
            "tool_proficiencies": [],
            "bonus_languages": 2,
            "feature": {
                "name": "Shelter of the Faithful",
                "description": "You and your companions can expect free healing at a temple of your faith.",
                "source": { "type": "Background" },
                "level_required": null,
                "uses": null
            },
            "equipment": ["Holy symbol","Prayer book","Simple clothing"],
            "personality_trait_options": [],
            "ideal_options": [],
            "bond_options": [],
            "flaw_options": []
        }).to_string();

        conn.execute(
            "INSERT INTO characters (
                id, name, race_json, background_json, alignment, experience_points,
                strength, dexterity, constitution, intelligence, wisdom, charisma,
                hp_max, hp_current, hp_temporary,
                armor_class, initiative_bonus,
                speed_walk, speed_fly, speed_swim, speed_burrow, speed_climb, speed_hover,
                inspiration, death_saves_successes, death_saves_failures,
                spellcasting_ability,
                slot_1_max, slot_1_used,
                slot_2_max, slot_2_used, slot_3_max, slot_3_used,
                slot_4_max, slot_4_used, slot_5_max, slot_5_used,
                slot_6_max, slot_6_used, slot_7_max, slot_7_used,
                slot_8_max, slot_8_used, slot_9_max, slot_9_used,
                pact_slot_level, pact_slots_max, pact_slots_used,
                currency_cp, currency_sp, currency_ep, currency_gp, currency_pp,
                saving_throw_profs_json, other_proficiencies_json, languages_json,
                personality_traits_json, ideals_json, bonds_json, flaws_json,
                appearance, backstory, notes
            ) VALUES (
                'elf_wizard_01', 'Elfenmagier', ?1, ?2, 'ChaoticGood', 0,
                10, 15, 14, 16, 12, 8,
                8, 8, 0,
                12, 2,
                30, NULL, NULL, NULL, NULL, 0,
                0, 0, 0,
                'Intelligence',
                2, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                NULL, NULL, 0,
                0, 0, 0, 5, 0,
                '[\"Intelligence\",\"Wisdom\"]',
                '[\"Longswords\",\"Shortswords\",\"Shortbows\",\"Longbows\",\"Daggers\",\"Darts\",\"Slings\",\"Quarterstaffs\",\"Light crossbows\"]',
                '[\"Common\",\"Elvish\",\"Draconic\",\"Dwarvish\",\"Goblin\"]',
                '[\"I use polysyllabic words to give an impression of great scholarship.\"]',
                '[\"Knowledge. The path to power is through knowledge.\"]',
                '[\"The tome I carry is the record of my life work.\"]',
                '[\"I would do almost anything to uncover historical secrets.\"]',
                'High Elf with timeless grace.',
                'A devotee of the god of knowledge who has dedicated their life to scholarship.',
                ''
            )",
            rusqlite::params![race_json, background_json],
        )?;

        // Classes
        conn.execute(
            "INSERT INTO character_classes (character_id, class_name, level, subclass)
             VALUES ('elf_wizard_01', 'Wizard', 1, NULL)",
            [],
        )?;

        // Skill proficiencies
        for skill in &["Arcana", "Investigation", "Insight", "Religion"] {
            conn.execute(
                "INSERT INTO character_skill_proficiencies (character_id, skill, proficiency_level)
                 VALUES ('elf_wizard_01', ?1, 'Proficient')",
                rusqlite::params![skill],
            )?;
        }

        // Hit dice
        conn.execute(
            "INSERT INTO character_hit_dice (character_id, die_type, total, used)
             VALUES ('elf_wizard_01', 'D6', 1, 0)",
            [],
        )?;

        // Features
        for (name, source_type, source_name, uses_max, recharge) in &[
            (
                "Arcane Recovery",
                "Class",
                Some("Wizard"),
                Some(1),
                Some("LongRest"),
            ),
            ("Fey Ancestry", "Race", None, None, None),
            ("Trance", "Race", None, None, None),
        ] {
            conn.execute(
                "INSERT INTO character_features
                    (character_id, name, description, source_type, source_name,
                     level_required, uses_current, uses_max, recharge_on)
                 VALUES ('elf_wizard_01', ?1, '', ?2, ?3, NULL, ?4, ?5, ?6)",
                rusqlite::params![name, source_type, source_name, uses_max, uses_max, recharge],
            )?;
        }

        // Shortsword
        let weapon_json = serde_json::json!({
            "category": "Martial",
            "weapon_type": "Melee",
            "damage": { "dice_count": 1, "dice_type": "D6" },
            "damage_type": "Piercing",
            "properties": ["Finesse", "Light"],
            "handedness": "OneHanded",
            "mastery": "Nick"
        })
        .to_string();

        conn.execute(
            "INSERT INTO character_items
                (id, character_id, name, description, value_cp, quantity, weight_per_unit,
                 item_type, details_json, is_magic)
             VALUES ('shortsword_01', 'elf_wizard_01', 'Shortsword', 'A light finesse blade.',
                     1000, 1, 2.0, 'Weapon', ?1, 0)",
            rusqlite::params![weapon_json],
        )?;

        // Spellbook
        conn.execute(
            "INSERT INTO character_items
                (id, character_id, name, description, value_cp, quantity, weight_per_unit,
                 item_type, details_json, is_magic)
             VALUES ('spellbook_01', 'elf_wizard_01', 'Spellbook', 'Contains the wizard spells.',
                     5000, 1, 3.0, 'Valuable', '{}', 0)",
            [],
        )?;

        Ok(())
    }

    // ---------------------------------------------------------------------------
    // Schema setup
    // ---------------------------------------------------------------------------

    #[test]
    fn test_schema_creates_all_tables() {
        let conn = open_db().unwrap();
        let mut tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |r| r.get(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();
        tables.retain(|t| !t.starts_with("sqlite_"));

        let expected = [
            "campaign_characters",
            "campaign_creatures",
            "campaign_notes",
            "campaigns",
            "character_classes",
            "character_conditions",
            "character_features",
            "character_hit_dice",
            "character_items",
            "character_skill_proficiencies",
            "character_spells",
            "characters",
            "creatures",
            "item_catalog",
            "spells",
        ];
        for t in &expected {
            assert!(tables.contains(&t.to_string()), "Missing table: {t}");
        }
        assert_eq!(tables.len(), expected.len());
    }

    #[test]
    fn test_foreign_keys_are_enabled() {
        let conn = open_db().unwrap();
        let enabled: i32 = conn
            .query_row("PRAGMA foreign_keys", [], |r| r.get(0))
            .unwrap();
        assert_eq!(enabled, 1);
    }

    // ---------------------------------------------------------------------------
    // Character INSERT and basic SELECT
    // ---------------------------------------------------------------------------

    #[test]
    fn test_insert_and_read_character() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (name, alignment, xp): (String, String, i32) = conn
            .query_row(
                "SELECT name, alignment, experience_points FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(name, "Elfenmagier");
        assert_eq!(alignment, "ChaoticGood");
        assert_eq!(xp, 0);
    }

    #[test]
    fn test_ability_scores_stored_correctly() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (str_, dex, con, int, wis, cha): (i32, i32, i32, i32, i32, i32) = conn
            .query_row(
                "SELECT strength, dexterity, constitution, intelligence, wisdom, charisma
                 FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| {
                    Ok((
                        r.get(0)?,
                        r.get(1)?,
                        r.get(2)?,
                        r.get(3)?,
                        r.get(4)?,
                        r.get(5)?,
                    ))
                },
            )
            .unwrap();

        assert_eq!(str_, 10);
        assert_eq!(dex, 15);
        assert_eq!(con, 14);
        assert_eq!(int, 16);
        assert_eq!(wis, 12);
        assert_eq!(cha, 8);
    }

    #[test]
    fn test_hp_stored_correctly() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (max, current, temp): (i32, i32, i32) = conn
            .query_row(
                "SELECT hp_max, hp_current, hp_temporary FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(max, 8);
        assert_eq!(current, 8);
        assert_eq!(temp, 0);
    }

    #[test]
    fn test_combat_stats_stored_correctly() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (ac, init, speed): (i32, i32, i32) = conn
            .query_row(
                "SELECT armor_class, initiative_bonus, speed_walk
                 FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(ac, 12);
        assert_eq!(init, 2);
        assert_eq!(speed, 30);
    }

    #[test]
    fn test_spell_slots_stored_correctly() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (s1_max, s1_used, s2_max): (i32, i32, i32) = conn
            .query_row(
                "SELECT slot_1_max, slot_1_used, slot_2_max FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(s1_max, 2);
        assert_eq!(s1_used, 0);
        assert_eq!(s2_max, 0);
    }

    #[test]
    fn test_currency_stored_correctly() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (cp, sp, gp): (i32, i32, i32) = conn
            .query_row(
                "SELECT currency_cp, currency_sp, currency_gp
                 FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(cp, 0);
        assert_eq!(sp, 0);
        assert_eq!(gp, 5);
    }

    #[test]
    fn test_languages_json_stored_correctly() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let json: String = conn
            .query_row(
                "SELECT languages_json FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();

        let langs: Vec<String> = serde_json::from_str(&json).unwrap();
        assert!(langs.contains(&"Common".to_string()));
        assert!(langs.contains(&"Elvish".to_string()));
        assert!(langs.contains(&"Draconic".to_string()));
        assert_eq!(langs.len(), 5);
    }

    // ---------------------------------------------------------------------------
    // Child tables
    // ---------------------------------------------------------------------------

    #[test]
    fn test_character_class_inserted() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (class_name, level, subclass): (String, i32, Option<String>) = conn
            .query_row(
                "SELECT class_name, level, subclass FROM character_classes
                 WHERE character_id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(class_name, "Wizard");
        assert_eq!(level, 1);
        assert!(subclass.is_none());
    }

    #[test]
    fn test_skill_proficiencies_inserted() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM character_skill_proficiencies
                 WHERE character_id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 4); // Arcana, Investigation, Insight, Religion

        let arcana_level: String = conn
            .query_row(
                "SELECT proficiency_level FROM character_skill_proficiencies
                 WHERE character_id = 'elf_wizard_01' AND skill = 'Arcana'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(arcana_level, "Proficient");
    }

    #[test]
    fn test_hit_dice_inserted() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let (die, total, used): (String, i32, i32) = conn
            .query_row(
                "SELECT die_type, total, used FROM character_hit_dice
                 WHERE character_id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(die, "D6");
        assert_eq!(total, 1);
        assert_eq!(used, 0);
    }

    #[test]
    fn test_features_inserted() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM character_features WHERE character_id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 3); // Arcane Recovery, Fey Ancestry, Trance

        let (uses_current, uses_max, recharge): (Option<i32>, Option<i32>, Option<String>) = conn
            .query_row(
                "SELECT uses_current, uses_max, recharge_on FROM character_features
                 WHERE character_id = 'elf_wizard_01' AND name = 'Arcane Recovery'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(uses_current, Some(1));
        assert_eq!(uses_max, Some(1));
        assert_eq!(recharge, Some("LongRest".to_string()));
    }

    #[test]
    fn test_items_inserted() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM character_items WHERE character_id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 2); // Shortsword + Spellbook

        let (item_type, value_cp): (String, i32) = conn
            .query_row(
                "SELECT item_type, value_cp FROM character_items WHERE id = 'shortsword_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();

        assert_eq!(item_type, "Weapon");
        assert_eq!(value_cp, 1000);
    }

    // ---------------------------------------------------------------------------
    // UPDATE operations (common in-session mutations)
    // ---------------------------------------------------------------------------

    #[test]
    fn test_update_current_hp() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "UPDATE characters SET hp_current = 3 WHERE id = 'elf_wizard_01'",
            [],
        )
        .unwrap();

        let hp: i32 = conn
            .query_row(
                "SELECT hp_current FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(hp, 3);
    }

    #[test]
    fn test_use_spell_slot() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "UPDATE characters SET slot_1_used = slot_1_used + 1 WHERE id = 'elf_wizard_01'",
            [],
        )
        .unwrap();

        let (max, used): (i32, i32) = conn
            .query_row(
                "SELECT slot_1_max, slot_1_used FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();

        assert_eq!(max, 2);
        assert_eq!(used, 1);
    }

    #[test]
    fn test_long_rest_resets_spell_slots() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        // Use both slots
        conn.execute(
            "UPDATE characters SET slot_1_used = 2 WHERE id = 'elf_wizard_01'",
            [],
        )
        .unwrap();

        // Long rest: reset used to 0
        conn.execute(
            "UPDATE characters SET slot_1_used = 0 WHERE id = 'elf_wizard_01'",
            [],
        )
        .unwrap();

        let used: i32 = conn
            .query_row(
                "SELECT slot_1_used FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(used, 0);
    }

    #[test]
    fn test_use_feature_charge() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "UPDATE character_features SET uses_current = uses_current - 1
             WHERE character_id = 'elf_wizard_01' AND name = 'Arcane Recovery'",
            [],
        )
        .unwrap();

        let uses: i32 = conn
            .query_row(
                "SELECT uses_current FROM character_features
                 WHERE character_id = 'elf_wizard_01' AND name = 'Arcane Recovery'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(uses, 0);
    }

    #[test]
    fn test_add_and_remove_condition() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        // Apply Poisoned
        conn.execute(
            "INSERT INTO character_conditions (character_id, condition)
             VALUES ('elf_wizard_01', 'Poisoned')",
            [],
        )
        .unwrap();

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM character_conditions WHERE character_id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);

        // Remove it
        conn.execute(
            "DELETE FROM character_conditions
             WHERE character_id = 'elf_wizard_01' AND condition = 'Poisoned'",
            [],
        )
        .unwrap();

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM character_conditions WHERE character_id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_exhaustion_level() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "INSERT INTO character_conditions (character_id, condition, exhaustion_level)
             VALUES ('elf_wizard_01', 'Exhaustion', 2)",
            [],
        )
        .unwrap();

        let level: i32 = conn
            .query_row(
                "SELECT exhaustion_level FROM character_conditions
                 WHERE character_id = 'elf_wizard_01' AND condition = 'Exhaustion'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(level, 2);
    }

    #[test]
    fn test_spend_gold() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "UPDATE characters SET currency_gp = currency_gp - 3 WHERE id = 'elf_wizard_01'",
            [],
        )
        .unwrap();

        let gp: i32 = conn
            .query_row(
                "SELECT currency_gp FROM characters WHERE id = 'elf_wizard_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(gp, 2);
    }

    #[test]
    fn test_use_hit_die() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "UPDATE character_hit_dice SET used = used + 1
             WHERE character_id = 'elf_wizard_01' AND die_type = 'D6'",
            [],
        )
        .unwrap();

        let (total, used): (i32, i32) = conn
            .query_row(
                "SELECT total, used FROM character_hit_dice
                 WHERE character_id = 'elf_wizard_01' AND die_type = 'D6'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();

        assert_eq!(total, 1);
        assert_eq!(used, 1);
    }

    // ---------------------------------------------------------------------------
    // Cascading deletes
    // ---------------------------------------------------------------------------

    #[test]
    fn test_cascade_delete_removes_all_child_rows() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute("DELETE FROM characters WHERE id = 'elf_wizard_01'", [])
            .unwrap();

        for table in &[
            "character_classes",
            "character_skill_proficiencies",
            "character_features",
            "character_hit_dice",
            "character_items",
            "character_conditions",
            "character_spells",
        ] {
            let count: i32 = conn
                .query_row(
                    &format!("SELECT COUNT(*) FROM {table} WHERE character_id = 'elf_wizard_01'"),
                    [],
                    |r| r.get(0),
                )
                .unwrap();
            assert_eq!(
                count, 0,
                "Expected no rows in {table} after character delete"
            );
        }
    }

    // ---------------------------------------------------------------------------
    // Spells reference table
    // ---------------------------------------------------------------------------

    #[test]
    fn test_insert_and_query_spell() {
        let conn = open_db().unwrap();

        conn.execute(
            "INSERT INTO spells (id, name, level, school, concentration, ritual,
                                 verbal, somatic, material,
                                 casting_time_json, range_json, duration_json,
                                 damage_json, description)
             VALUES ('fireball', 'Fireball', 3, 'Evocation', 0, 0,
                     1, 1, 'A tiny ball of bat guano and sulfur',
                     '{\"type\":\"Action\"}',
                     '{\"type\":\"Feet\",\"value\":150}',
                     '{\"type\":\"Instant\"}',
                     '[{\"dice\":{\"amount\":8,\"die\":\"D6\",\"modifier\":0},\"damage_type\":\"Fire\"}]',
                     'A bright streak flashes from your pointing finger to a point you choose.')",
            [],
        ).unwrap();

        let (name, level, school): (String, i32, String) = conn
            .query_row(
                "SELECT name, level, school FROM spells WHERE id = 'fireball'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(name, "Fireball");
        assert_eq!(level, 3);
        assert_eq!(school, "Evocation");
    }

    #[test]
    fn test_filter_spells_by_level_and_school() {
        let conn = open_db().unwrap();

        let spells = [
            ("magic-missile", "Magic Missile", 1, "Evocation"),
            ("fireball", "Fireball", 3, "Evocation"),
            ("sleep", "Sleep", 1, "Enchantment"),
        ];

        for (id, name, level, school) in &spells {
            conn.execute(
                "INSERT INTO spells (id, name, level, school, casting_time_json, range_json, duration_json, damage_json)
                 VALUES (?1, ?2, ?3, ?4, '{}', '{}', '{}', '[]')",
                rusqlite::params![id, name, level, school],
            ).unwrap();
        }

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM spells WHERE level = 1 AND school = 'Evocation'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);

        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM spells WHERE level = 1", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(count, 2);
    }

    // ---------------------------------------------------------------------------
    // Creatures reference table
    // ---------------------------------------------------------------------------

    #[test]
    fn test_insert_and_query_creature() {
        let conn = open_db().unwrap();

        let data = serde_json::json!({
            "name": "Goblin",
            "size": "Small",
            "creature_type": "Humanoid",
            "alignment": "NeutralEvil",
            "armor_class": 15,
            "hp_average": 7,
            "strength": 8, "dexterity": 14, "constitution": 10,
            "intelligence": 10, "wisdom": 8, "charisma": 8
        })
        .to_string();

        conn.execute(
            "INSERT INTO creatures (id, name, creature_type, size, challenge_rating_sort, challenge_rating_label, experience_points, data_json)
             VALUES ('goblin', 'Goblin', 'Humanoid', 'Small', 0.25, '1/4', 50, ?1)",
            rusqlite::params![data],
        ).unwrap();

        let (name, cr_label, xp): (String, String, i32) = conn
            .query_row(
                "SELECT name, challenge_rating_label, experience_points FROM creatures WHERE id = 'goblin'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(name, "Goblin");
        assert_eq!(cr_label, "1/4");
        assert_eq!(xp, 50);
    }

    #[test]
    fn test_filter_creatures_by_cr_range() {
        let conn = open_db().unwrap();

        let entries = [
            ("goblin", "Goblin", "Humanoid", 0.25_f64, "1/4", 50_i32),
            ("orc", "Orc", "Humanoid", 0.5, "1/2", 100),
            ("ogre", "Ogre", "Giant", 2.0, "2", 450),
            ("dragon", "Dragon", "Dragon", 17.0, "17", 18000),
        ];

        for (id, name, ctype, cr_sort, cr_label, xp) in &entries {
            conn.execute(
                "INSERT INTO creatures (id, name, creature_type, size, challenge_rating_sort, challenge_rating_label, experience_points, data_json)
                 VALUES (?1, ?2, ?3, 'Medium', ?4, ?5, ?6, '{}')",
                rusqlite::params![id, name, ctype, cr_sort, cr_label, xp],
            ).unwrap();
        }

        // Filter CR 0.5 to 2 (inclusive)
        let names: Vec<String> = conn
            .prepare("SELECT name FROM creatures WHERE challenge_rating_sort BETWEEN 0.5 AND 2.0 ORDER BY challenge_rating_sort")
            .unwrap()
            .query_map([], |r| r.get(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();

        assert_eq!(names, vec!["Orc", "Ogre"]);
    }

    // ---------------------------------------------------------------------------
    // Campaigns
    // ---------------------------------------------------------------------------

    #[test]
    fn test_campaign_with_character() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        conn.execute(
            "INSERT INTO campaigns (id, name, description) VALUES ('camp_01', 'Lost Mine of Phandelver', '')",
            [],
        ).unwrap();

        conn.execute(
            "INSERT INTO campaign_characters (campaign_id, character_id)
             VALUES ('camp_01', 'elf_wizard_01')",
            [],
        )
        .unwrap();

        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM campaign_characters WHERE campaign_id = 'camp_01'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_campaign_creature_instance() {
        let conn = open_db().unwrap();

        conn.execute(
            "INSERT INTO campaigns (id, name) VALUES ('camp_01', 'Test Campaign')",
            [],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO creatures (id, name, creature_type, size, challenge_rating_sort, challenge_rating_label, experience_points, data_json)
             VALUES ('goblin', 'Goblin', 'Humanoid', 'Small', 0.25, '1/4', 50, '{}')",
            [],
        ).unwrap();

        conn.execute(
            "INSERT INTO campaign_creatures (campaign_id, creature_id, display_name, hp_current, is_alive)
             VALUES ('camp_01', 'goblin', 'Grimnok', 7, 1)",
            [],
        ).unwrap();

        let (display_name, hp, alive): (String, i32, i32) = conn
            .query_row(
                "SELECT display_name, hp_current, is_alive FROM campaign_creatures
                 WHERE campaign_id = 'camp_01'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();

        assert_eq!(display_name, "Grimnok");
        assert_eq!(hp, 7);
        assert_eq!(alive, 1);
    }

    // ---------------------------------------------------------------------------
    // CHECK constraints
    // ---------------------------------------------------------------------------

    #[test]
    fn test_ability_score_out_of_range_is_rejected() {
        let conn = open_db().unwrap();
        let result = conn.execute(
            "INSERT INTO characters (id, name, race_json, background_json, alignment,
                strength, dexterity, constitution, intelligence, wisdom, charisma,
                hp_max, hp_current, armor_class, speed_walk)
             VALUES ('bad', 'Bad', '{}', '{}', 'TrueNeutral',
                31, 10, 10, 10, 10, 10,
                8, 8, 10, 30)",
            [],
        );
        assert!(
            result.is_err(),
            "Strength 31 should violate CHECK constraint"
        );
    }

    #[test]
    fn test_death_saves_out_of_range_is_rejected() {
        let conn = open_db().unwrap();
        let result = conn.execute(
            "INSERT INTO characters (id, name, race_json, background_json, alignment,
                strength, dexterity, constitution, intelligence, wisdom, charisma,
                hp_max, hp_current, armor_class, speed_walk, death_saves_successes)
             VALUES ('bad', 'Bad', '{}', '{}', 'TrueNeutral',
                10, 10, 10, 10, 10, 10,
                8, 8, 10, 30, 4)",
            [],
        );
        assert!(
            result.is_err(),
            "death_saves_successes = 4 should violate CHECK constraint"
        );
    }

    #[test]
    fn test_exhaustion_level_out_of_range_is_rejected() {
        let conn = open_db().unwrap();
        insert_elf_wizard(&conn).unwrap();

        let result = conn.execute(
            "INSERT INTO character_conditions (character_id, condition, exhaustion_level)
             VALUES ('elf_wizard_01', 'Exhaustion', 7)",
            [],
        );
        assert!(
            result.is_err(),
            "Exhaustion level 7 should violate CHECK constraint"
        );
    }
}
