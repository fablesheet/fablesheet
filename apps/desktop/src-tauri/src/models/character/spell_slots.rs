use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SpellSlotLevel {
    pub max: u8,
    pub used: u8,
}

impl SpellSlotLevel {
    pub fn new(max: u8) -> Self {
        SpellSlotLevel { max, used: 0 }
    }

    pub fn available(&self) -> u8 {
        self.max.saturating_sub(self.used)
    }
}

/// Tracks all nine levels of spell slots.
/// Index 0 = 1st level, index 8 = 9th level.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SpellSlots {
    pub level_1: SpellSlotLevel,
    pub level_2: SpellSlotLevel,
    pub level_3: SpellSlotLevel,
    pub level_4: SpellSlotLevel,
    pub level_5: SpellSlotLevel,
    pub level_6: SpellSlotLevel,
    pub level_7: SpellSlotLevel,
    pub level_8: SpellSlotLevel,
    pub level_9: SpellSlotLevel,
}

/// Warlock pact magic slots (all the same level).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PactMagicSlots {
    pub slot_level: u8,
    pub max: u8,
    pub used: u8,
}
