use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Currency {
    pub copper: u32,
    pub silver: u32,
    pub electrum: u32,
    pub gold: u32,
    pub platinum: u32,
}
