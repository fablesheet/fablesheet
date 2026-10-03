use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feature {
    pub name: String,
    pub description: String,
    pub source: FeatureSource,
    pub level_required: Option<u8>,
    pub uses: Option<FeatureUses>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeatureSource {
    Class(String),
    Subclass(String),
    Race,
    Background,
    Feat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureUses {
    pub current: u8,
    pub max: u8,
    pub recharge: RechargeOn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RechargeOn {
    ShortRest,
    LongRest,
    Dawn,
    /// Recharges on a roll of the given number or higher on a D6
    DawnDiceRoll(u8),
}
