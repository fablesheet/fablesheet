use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ProficiencyLevel {
    None,
    HalfProficiency,
    Proficient,
    Expertise,
}

impl Default for ProficiencyLevel {
    fn default() -> Self {
        ProficiencyLevel::None
    }
}
