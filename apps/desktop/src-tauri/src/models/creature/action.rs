use crate::models::damage::DamageRoll;
use crate::models::range::Range;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatureAction {
    pub name: String,
    pub description: String,
    pub action_type: ActionType,
    pub attack: Option<AttackAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Action,
    BonusAction,
    Reaction,
    LegendaryAction,
    LairAction,
    FreeAction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttackAction {
    pub attack_type: AttackType,
    pub attack_bonus: i8,
    pub reach_or_range: Range,
    pub hit_damage: Vec<DamageRoll>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AttackType {
    MeleeWeapon,
    RangedWeapon,
    MeleeSpell,
    RangedSpell,
}
