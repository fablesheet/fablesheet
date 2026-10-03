use crate::models::size::Size;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Race {
    pub name: String,
    pub subrace: Option<String>,
    pub size: Size,
    pub base_speed: u16,
    pub darkvision: Option<u16>,
    pub trait_names: Vec<String>,
    pub languages: Vec<String>,
}

/// Common SRD races as a convenience enum.
/// Use `Race` directly for homebrew or unlisted species.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommonRace {
    Dragonborn,
    Dwarf,
    Elf,
    Gnome,
    HalfElf,
    HalfOrc,
    Halfling,
    Human,
    Tiefling,
}

impl CommonRace {
    pub fn to_race(&self) -> Race {
        match self {
            CommonRace::Dragonborn => Race {
                name: "Dragonborn".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 30,
                darkvision: None,
                trait_names: vec![
                    "Draconic Ancestry".into(),
                    "Breath Weapon".into(),
                    "Damage Resistance".into(),
                ],
                languages: vec!["Common".into(), "Draconic".into()],
            },
            CommonRace::Dwarf => Race {
                name: "Dwarf".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 25,
                darkvision: Some(60),
                trait_names: vec![
                    "Darkvision".into(),
                    "Dwarven Resilience".into(),
                    "Dwarven Combat Training".into(),
                    "Stonecunning".into(),
                ],
                languages: vec!["Common".into(), "Dwarvish".into()],
            },
            CommonRace::Elf => Race {
                name: "Elf".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 30,
                darkvision: Some(60),
                trait_names: vec![
                    "Darkvision".into(),
                    "Keen Senses".into(),
                    "Fey Ancestry".into(),
                    "Trance".into(),
                ],
                languages: vec!["Common".into(), "Elvish".into()],
            },
            CommonRace::Gnome => Race {
                name: "Gnome".into(),
                subrace: None,
                size: Size::Small,
                base_speed: 25,
                darkvision: Some(60),
                trait_names: vec!["Darkvision".into(), "Gnome Cunning".into()],
                languages: vec!["Common".into(), "Gnomish".into()],
            },
            CommonRace::HalfElf => Race {
                name: "Half-Elf".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 30,
                darkvision: Some(60),
                trait_names: vec![
                    "Darkvision".into(),
                    "Fey Ancestry".into(),
                    "Skill Versatility".into(),
                ],
                languages: vec!["Common".into(), "Elvish".into()],
            },
            CommonRace::HalfOrc => Race {
                name: "Half-Orc".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 30,
                darkvision: Some(60),
                trait_names: vec![
                    "Darkvision".into(),
                    "Menacing".into(),
                    "Relentless Endurance".into(),
                    "Savage Attacks".into(),
                ],
                languages: vec!["Common".into(), "Orc".into()],
            },
            CommonRace::Halfling => Race {
                name: "Halfling".into(),
                subrace: None,
                size: Size::Small,
                base_speed: 25,
                darkvision: None,
                trait_names: vec!["Lucky".into(), "Brave".into(), "Halfling Nimbleness".into()],
                languages: vec!["Common".into(), "Halfling".into()],
            },
            CommonRace::Human => Race {
                name: "Human".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 30,
                darkvision: None,
                trait_names: vec![],
                languages: vec!["Common".into()],
            },
            CommonRace::Tiefling => Race {
                name: "Tiefling".into(),
                subrace: None,
                size: Size::Medium,
                base_speed: 30,
                darkvision: Some(60),
                trait_names: vec![
                    "Darkvision".into(),
                    "Hellish Resistance".into(),
                    "Infernal Legacy".into(),
                ],
                languages: vec!["Common".into(), "Infernal".into()],
            },
        }
    }
}
