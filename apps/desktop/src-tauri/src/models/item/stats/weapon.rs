use crate::models::damage::DamageType;
use crate::models::dice::DiceType;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WeaponStats {
    pub category: WeaponCategory,
    pub weapon_type: WeaponType,
    pub damage: Damage,
    pub damage_type: DamageType,
    pub properties: Vec<WeaponProperty>,
    pub handedness: Handedness,
    pub mastery: Option<Mastery>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum WeaponType {
    Melee,
    Ranged,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Damage {
    pub dice_count: u8,
    pub dice_type: DiceType,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WeaponRange {
    pub normal: u32,
    pub long: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Handedness {
    OneHanded,
    TwoHanded,
    Versatile(Damage),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum WeaponCategory {
    Simple,
    Martial,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum WeaponProperty {
    Finesse,
    Heavy,
    Light,
    Reach,
    Thrown(WeaponRange),
    Ammunition(WeaponRange),
    Loading,
    Special,
    Range(WeaponRange),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Mastery {
    Cleave,
    Craze,
    Nick,
    Push,
    Sap,
    Slow,
    Topple,
    Vex,
}
