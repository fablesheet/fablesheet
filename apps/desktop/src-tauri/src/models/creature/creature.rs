use crate::models::ability::Ability;
use crate::models::alignment::Alignment;
use crate::models::condition::Condition;
use crate::models::creature::action::CreatureAction;
use crate::models::creature::creature_type::CreatureType;
use crate::models::damage::DamageType;
use crate::models::dice::DiceRoll;
use crate::models::sense::Senses;
use crate::models::size::Size;
use crate::models::skill::Skill;
use crate::models::speed::Speed;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Creature {
    pub name: String,
    pub size: Size,
    pub creature_type: CreatureType,
    /// e.g. "any race" or "devil"
    pub subtype: Option<String>,
    pub alignment: Alignment,

    // --- Defenses ---
    pub armor_class: u8,
    /// e.g. "natural armor" or "chain mail"
    pub armor_description: Option<String>,
    pub hp_average: u16,
    pub hp_dice: DiceRoll,

    pub speed: Speed,

    // --- Ability scores ---
    pub strength: u8,
    pub dexterity: u8,
    pub constitution: u8,
    pub intelligence: u8,
    pub wisdom: u8,
    pub charisma: u8,

    // --- Bonuses ---
    pub saving_throw_bonuses: Vec<SavingThrowBonus>,
    pub skill_bonuses: Vec<SkillBonus>,

    // --- Damage modifiers ---
    pub damage_immunities: Vec<DamageType>,
    pub damage_resistances: Vec<DamageType>,
    pub damage_vulnerabilities: Vec<DamageType>,
    pub condition_immunities: Vec<Condition>,

    // --- Senses & language ---
    pub senses: Senses,
    pub languages: Vec<String>,
    pub telepathy_range: Option<u16>,

    pub challenge_rating: ChallengeRating,
    pub proficiency_bonus: i8,
    pub experience_points: u32,

    // --- Actions ---
    /// Passive abilities listed in the traits block
    pub traits: Vec<CreatureAction>,
    pub actions: Vec<CreatureAction>,
    pub bonus_actions: Vec<CreatureAction>,
    pub reactions: Vec<CreatureAction>,
    pub legendary_actions: Option<LegendaryActions>,
    pub lair_actions: Vec<CreatureAction>,
    pub mythic_actions: Option<MythicActions>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavingThrowBonus {
    pub ability: Ability,
    pub bonus: i8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillBonus {
    pub skill: Skill,
    pub bonus: i8,
}

/// D&D 5e challenge ratings including fractional values.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChallengeRating {
    Zero,
    OneEighth,
    OneFourth,
    OneHalf,
    /// Covers CR 1 through CR 30
    Full(u8),
}

impl ChallengeRating {
    pub fn experience_points(&self) -> u32 {
        match self {
            ChallengeRating::Zero => 10,
            ChallengeRating::OneEighth => 25,
            ChallengeRating::OneFourth => 50,
            ChallengeRating::OneHalf => 100,
            ChallengeRating::Full(cr) => match cr {
                1 => 200,
                2 => 450,
                3 => 700,
                4 => 1_100,
                5 => 1_800,
                6 => 2_300,
                7 => 2_900,
                8 => 3_900,
                9 => 5_000,
                10 => 5_900,
                11 => 7_200,
                12 => 8_400,
                13 => 10_000,
                14 => 11_500,
                15 => 13_000,
                16 => 15_000,
                17 => 18_000,
                18 => 20_000,
                19 => 22_000,
                20 => 25_000,
                21 => 33_000,
                22 => 41_000,
                23 => 50_000,
                24 => 62_000,
                25 => 75_000,
                26 => 90_000,
                27 => 105_000,
                28 => 120_000,
                29 => 135_000,
                30 => 155_000,
                _ => 0,
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegendaryActions {
    pub description: String,
    /// How many legendary actions the creature can take per round
    pub count: u8,
    pub actions: Vec<CreatureAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MythicActions {
    pub description: String,
    pub actions: Vec<CreatureAction>,
}
