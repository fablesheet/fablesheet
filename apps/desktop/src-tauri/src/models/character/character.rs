use crate::models::ability::Ability;
use crate::models::alignment::Alignment;
use crate::models::character::background::Background;
use crate::models::character::class::ClassLevel;
use crate::models::character::feature::Feature;
use crate::models::character::proficiency::ProficiencyLevel;
use crate::models::character::race::Race;
use crate::models::character::spell_slots::{PactMagicSlots, SpellSlots};
use crate::models::condition::Condition;
use crate::models::currency::Currency;
use crate::models::dice::DiceType;
use crate::models::item::item::Item;
use crate::models::skill::Skill;
use crate::models::speed::Speed;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub name: String,
    pub race: Race,
    pub classes: Vec<ClassLevel>,
    pub background: Background,
    pub alignment: Alignment,
    pub experience_points: u32,

    // --- Ability scores (raw scores, not modifiers) ---
    pub strength: u8,
    pub dexterity: u8,
    pub constitution: u8,
    pub intelligence: u8,
    pub wisdom: u8,
    pub charisma: u8,

    // --- Hit points ---
    pub hp_max: u16,
    pub hp_current: i16,
    pub hp_temporary: u16,

    // --- Combat ---
    pub armor_class: u16,
    pub initiative_bonus: i8,
    pub speed: Speed,

    // --- Proficiencies ---
    pub saving_throw_proficiencies: Vec<Ability>,
    pub skill_proficiencies: Vec<SkillProficiency>,
    /// Weapon, armor, tool, and language proficiencies stored as plain strings
    pub other_proficiencies: Vec<String>,
    pub languages: Vec<String>,

    // --- Resources ---
    pub inspiration: bool,
    pub death_saves: DeathSaves,
    pub hit_dice: Vec<HitDicePool>,

    // --- Spellcasting ---
    pub spellcasting_ability: Option<Ability>,
    pub spell_slots: Option<SpellSlots>,
    pub pact_magic: Option<PactMagicSlots>,
    /// IDs or names of spells the character knows/has prepared
    pub known_spells: Vec<String>,
    pub prepared_spells: Vec<String>,

    // --- Inventory ---
    pub inventory: Vec<Item>,
    pub currency: Currency,
    pub equipped_armor: Option<String>,
    pub equipped_main_hand: Option<String>,
    pub equipped_off_hand: Option<String>,

    // --- Status ---
    pub conditions: Vec<Condition>,
    pub features: Vec<Feature>,

    // --- Personality ---
    pub personality_traits: Vec<String>,
    pub ideals: Vec<String>,
    pub bonds: Vec<String>,
    pub flaws: Vec<String>,
    pub appearance: String,
    pub backstory: String,
    pub notes: String,
}

impl Character {
    /// Returns the total character level across all classes.
    pub fn total_level(&self) -> u8 {
        self.classes.iter().map(|c| c.level).sum()
    }

    /// Proficiency bonus based on total character level.
    pub fn proficiency_bonus(&self) -> i8 {
        match self.total_level() {
            1..=4 => 2,
            5..=8 => 3,
            9..=12 => 4,
            13..=16 => 5,
            17..=20 => 6,
            _ => 2,
        }
    }

    /// Returns the ability modifier for a given score.
    pub fn modifier(score: u8) -> i8 {
        ((score as i8) - 10) / 2
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillProficiency {
    pub skill: Skill,
    pub level: ProficiencyLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DeathSaves {
    /// Number of successes (0–3)
    pub successes: u8,
    /// Number of failures (0–3)
    pub failures: u8,
}

/// Tracks hit dice for one class (characters may have multiple from multiclassing).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HitDicePool {
    pub die: DiceType,
    pub total: u8,
    pub used: u8,
}

impl HitDicePool {
    pub fn available(&self) -> u8 {
        self.total.saturating_sub(self.used)
    }
}
