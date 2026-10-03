use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Speed {
    pub walk: u16,
    pub fly: Option<u16>,
    pub swim: Option<u16>,
    pub burrow: Option<u16>,
    pub climb: Option<u16>,
    /// True if the creature can hover (prevents falling when fly speed is reduced to 0)
    pub hover: bool,
}

impl Speed {
    pub fn walk(feet: u16) -> Self {
        Speed {
            walk: feet,
            fly: None,
            swim: None,
            burrow: None,
            climb: None,
            hover: false,
        }
    }
}
