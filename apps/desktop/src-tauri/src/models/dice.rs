use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum DiceType {
    D4,
    D6,
    D8,
    D10,
    D12,
    D20,
    D100,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DiceRoll {
    pub amount: u8,
    pub die: DiceType,
    pub modifier: i8,
}
