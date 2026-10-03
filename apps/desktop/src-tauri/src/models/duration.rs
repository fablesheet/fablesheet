use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Duration {
    Instant,
    Round(u8),
    Minute(u16),
    Hour(u16),
    Permanent,
}
