use crate::models::character::feature::Feature;
use crate::models::skill::Skill;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Background {
    pub name: String,
    pub skill_proficiencies: Vec<Skill>,
    pub tool_proficiencies: Vec<String>,
    /// Number of extra languages granted
    pub bonus_languages: u8,
    pub feature: Feature,
    /// Starting equipment item names/descriptions
    pub equipment: Vec<String>,
    pub personality_trait_options: Vec<String>,
    pub ideal_options: Vec<String>,
    pub bond_options: Vec<String>,
    pub flaw_options: Vec<String>,
}
