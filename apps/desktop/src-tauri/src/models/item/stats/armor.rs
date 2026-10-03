use serde::{Deserialize, Serialize};
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArmorStats {
    pub category: ArmorCategory,
    pub base_ac: u8,
    pub dex_cap: Option<u8>,
    pub strength: Option<u8>,
    pub stealth_disadvantage: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ArmorCategory {
    Light,
    Medium,
    Heavy,
}
