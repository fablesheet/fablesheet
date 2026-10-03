use crate::models::ability::Ability;
use crate::models::damage::DamageRoll;
use crate::models::dice::DiceRoll;
use crate::models::duration::Duration;
use crate::models::range::Range;
use crate::models::spell::casting_time::CastingTime;
use crate::models::spell::component::Components;
use crate::models::spell::level::SpellLevel;
use crate::models::spell::school::SpellSchool;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Spell {
    pub name: String,
    pub level: SpellLevel,
    pub school: SpellSchool,

    pub casting_time: CastingTime,
    pub range: Range,
    pub components: Components,
    pub duration: Duration,

    pub concentration: bool,
    pub ritual: bool,

    pub mechanic: Option<SpellMechanic>,
    pub damage: Vec<DamageRoll>,

    pub scaling: Option<Scaling>,

    pub area_of_effect: Option<AreaOfEffect>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SpellMechanic {
    AttackRoll { attack_bonus: i8 },
    SavingThrow { dc: u8, ability: Ability },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scaling {
    pub extra_damage_per_level: DiceRoll,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AreaOfEffect {
    Sphere(u16),
    Cone(u16),
    Cube(u16),
    Cylinder { radius: u16, height: u16 },
    Line { length: u16, width: u16 },
}
