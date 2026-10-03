use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContainerStats {
    pub capacity_weight: f32,
    pub capacity_volume: Option<f32>,
    pub weight_multiplier: f32,
}
