use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Senses {
    /// Range in feet
    pub darkvision: Option<u16>,
    /// Range in feet
    pub blindsight: Option<u16>,
    /// Range in feet
    pub tremorsense: Option<u16>,
    /// Range in feet
    pub truesight: Option<u16>,
    pub passive_perception: u8,
}
