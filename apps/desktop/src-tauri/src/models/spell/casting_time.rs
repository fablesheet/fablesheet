use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CastingTime {
    Action,
    BonusAction,
    Reaction,
    Minute(u8),
    Hour(u8),
}
