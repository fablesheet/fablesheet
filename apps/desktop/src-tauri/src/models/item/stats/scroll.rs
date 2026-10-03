use crate::models::damage::DamageRoll;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ScrollStats {
    pub spell_name: String,
    pub spell_level: u8,
    pub damage: Vec<DamageRoll>,
    pub save_dc: Option<u8>,
    pub attack_bonus: Option<i8>,
}
