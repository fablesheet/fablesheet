use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub enum ProficiencyLevel {
    #[default]
    None,
    HalfProficiency,
    Proficient,
    Expertise,
}
