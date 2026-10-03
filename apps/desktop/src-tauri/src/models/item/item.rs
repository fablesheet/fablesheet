use crate::models::item::magic::{ChargeData, MagicProperty, Rarity};
use crate::models::item::stats::armor::ArmorStats;
use crate::models::item::stats::container::ContainerStats;
use crate::models::item::stats::potion::PotionStats;
use crate::models::item::stats::scroll::ScrollStats;
use crate::models::item::stats::tool::ToolStats;
use crate::models::item::stats::weapon::WeaponStats;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub description: String,
    pub value: u32,
    pub quantity: u32,
    pub weight_per_unit: f32,
    pub details: ItemDetails,
    pub magic_data: Option<MagicData>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", content = "data")]
pub enum ItemDetails {
    Weapon(WeaponStats),
    Armor(ArmorStats),
    Tool(ToolStats),
    AdventuringGear, // TODO: Optional AdventuringGearStats?
    Potion(PotionStats),
    Container(ContainerStats),
    Scroll(ScrollStats),
    Valuable,
    Ammunition,
    Gear,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MagicData {
    pub rarity: Rarity,
    pub requires_attunement: bool,
    pub is_attuned: bool,
    pub charges: Option<ChargeData>,
    pub properties: Vec<MagicProperty>,
}
