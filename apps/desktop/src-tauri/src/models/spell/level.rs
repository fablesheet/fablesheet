use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SpellLevel {
    Cantrip,
    Level(u8),
}
