use crate::models::dice::DiceType;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClassName {
    Barbarian,
    Bard,
    Cleric,
    Druid,
    Fighter,
    Monk,
    Paladin,
    Ranger,
    Rogue,
    Sorcerer,
    Warlock,
    Wizard,
    /// For homebrew or setting-specific classes
    Custom(String),
}

impl ClassName {
    pub fn hit_die(&self) -> DiceType {
        match self {
            ClassName::Barbarian => DiceType::D12,
            ClassName::Bard => DiceType::D8,
            ClassName::Cleric => DiceType::D8,
            ClassName::Druid => DiceType::D8,
            ClassName::Fighter => DiceType::D10,
            ClassName::Monk => DiceType::D8,
            ClassName::Paladin => DiceType::D10,
            ClassName::Ranger => DiceType::D10,
            ClassName::Rogue => DiceType::D8,
            ClassName::Sorcerer => DiceType::D6,
            ClassName::Warlock => DiceType::D8,
            ClassName::Wizard => DiceType::D6,
            ClassName::Custom(_) => DiceType::D8,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassLevel {
    pub class: ClassName,
    pub level: u8,
    pub subclass: Option<String>,
}
