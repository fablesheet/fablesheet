use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Range {
    Self_,
    Touch,
    Feet(u16),
    Sight,
    Unlimited,
}
