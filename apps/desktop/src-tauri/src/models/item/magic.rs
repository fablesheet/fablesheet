use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MagicData {
    pub rarity: Rarity,
    pub requires_attunement: bool,
    pub is_attuned: bool, // Ob der Spieler es gerade aktiv nutzt
    pub charges: Option<ChargeData>,
    pub properties: Vec<MagicProperty>, // Liste der Effekte
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Rarity {
    Common,
    Uncommon,
    Rare,
    VeryRare,
    Legendary,
    Artifact,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChargeData {
    pub current: u32,
    pub max: u32,
    pub recharge_condition: String, // z.B. "1d6+4 at dawn"
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "effect_type", content = "value")]
pub enum MagicProperty {
    /// Ein simpler Bonus auf Werte (z.B. +1 auf AC oder Atk)
    StatModifier {
        stat: String, // "AC", "Strength", "AttackRoll", "SpellDC"
        bonus: i32,
    },
    /// Gewährt Vorteil bei bestimmten Würfen
    Advantage {
        condition: String, // "Stealth checks", "Saving throws against magic"
    },
    /// Ein spezieller Zauber, den das Item wirken kann
    SpellsCastable(Vec<String>), // Liste der Zaubernamen
    /// Einfacher Flavour-Text oder komplexe Regeln
    SpecialEffect { title: String, description: String },
}
