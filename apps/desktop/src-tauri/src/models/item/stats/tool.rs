use crate::models::ability::Ability;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ToolStats {
    pub category: String,
    pub default_ability: Ability,
    pub utilize: Vec<Utilise>,
    pub crafting_recipe: Option<Vec<RecipeComponent>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RecipeComponent {
    pub item_id: String,
    pub quantity: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Utilise {
    pub action: String,
    pub description: String,
    pub difficulty_class: u8,
    pub override_ability: Option<Ability>,
}
