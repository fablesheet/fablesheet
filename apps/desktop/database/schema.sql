-- =============================================================================
-- Fablesheet SQLite Schema
-- =============================================================================
-- Design rules:
--   • Mutable scalars (HP, spell slots, feature uses) → real columns w/ direct UPDATE
--   • Structural templates always read as a unit (Race, Background) → JSON columns
--   • Items are owned instances per character (quantity, attunement, charges are live state)
--   • Spells are a shared reference table; character ownership is a thin join table
--   • Creatures are mostly a JSON blob with a few promoted columns for compendium filtering
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- =============================================================================
-- CHARACTERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS characters (
    id                      TEXT    PRIMARY KEY,
    name                    TEXT    NOT NULL,

    -- Race and Background stored as JSON because they are structural templates
    -- that are always read and written as a unit, never partially queried.
    race_json               TEXT    NOT NULL,       -- serialized Race struct
    background_json         TEXT    NOT NULL,       -- serialized Background struct

    alignment               TEXT    NOT NULL,       -- e.g. "ChaoticGood"
    experience_points       INTEGER NOT NULL DEFAULT 0,

    -- -------------------------------------------------------------------------
    -- Ability scores (raw scores, NOT modifiers)
    -- -------------------------------------------------------------------------
    strength                INTEGER NOT NULL CHECK (strength    BETWEEN 1 AND 30),
    dexterity               INTEGER NOT NULL CHECK (dexterity   BETWEEN 1 AND 30),
    constitution            INTEGER NOT NULL CHECK (constitution BETWEEN 1 AND 30),
    intelligence            INTEGER NOT NULL CHECK (intelligence BETWEEN 1 AND 30),
    wisdom                  INTEGER NOT NULL CHECK (wisdom      BETWEEN 1 AND 30),
    charisma                INTEGER NOT NULL CHECK (charisma    BETWEEN 1 AND 30),

    -- -------------------------------------------------------------------------
    -- Hit points
    -- -------------------------------------------------------------------------
    hp_max                  INTEGER NOT NULL CHECK (hp_max >= 0),
    hp_current              INTEGER NOT NULL,
    hp_temporary            INTEGER NOT NULL DEFAULT 0 CHECK (hp_temporary >= 0),

    -- -------------------------------------------------------------------------
    -- Combat
    -- -------------------------------------------------------------------------
    armor_class             INTEGER NOT NULL CHECK (armor_class >= 0),
    initiative_bonus        INTEGER NOT NULL DEFAULT 0,

    -- Speed (inline to avoid a join for every sheet load)
    speed_walk              INTEGER NOT NULL DEFAULT 30 CHECK (speed_walk >= 0),
    speed_fly               INTEGER              CHECK (speed_fly   IS NULL OR speed_fly   >= 0),
    speed_swim              INTEGER              CHECK (speed_swim  IS NULL OR speed_swim  >= 0),
    speed_burrow            INTEGER              CHECK (speed_burrow IS NULL OR speed_burrow >= 0),
    speed_climb             INTEGER              CHECK (speed_climb IS NULL OR speed_climb >= 0),
    speed_hover             INTEGER NOT NULL DEFAULT 0 CHECK (speed_hover IN (0, 1)),

    -- -------------------------------------------------------------------------
    -- Status
    -- -------------------------------------------------------------------------
    inspiration             INTEGER NOT NULL DEFAULT 0 CHECK (inspiration IN (0, 1)),
    death_saves_successes   INTEGER NOT NULL DEFAULT 0 CHECK (death_saves_successes BETWEEN 0 AND 3),
    death_saves_failures    INTEGER NOT NULL DEFAULT 0 CHECK (death_saves_failures  BETWEEN 0 AND 3),

    -- -------------------------------------------------------------------------
    -- Spellcasting
    -- -------------------------------------------------------------------------
    spellcasting_ability    TEXT,   -- NULL for non-casters; e.g. "Intelligence"

    -- Standard spell slots (9 levels × 2 fields = 18 columns)
    -- Inline because they are updated individually with direct UPDATEs.
    slot_1_max INTEGER NOT NULL DEFAULT 0, slot_1_used INTEGER NOT NULL DEFAULT 0,
    slot_2_max INTEGER NOT NULL DEFAULT 0, slot_2_used INTEGER NOT NULL DEFAULT 0,
    slot_3_max INTEGER NOT NULL DEFAULT 0, slot_3_used INTEGER NOT NULL DEFAULT 0,
    slot_4_max INTEGER NOT NULL DEFAULT 0, slot_4_used INTEGER NOT NULL DEFAULT 0,
    slot_5_max INTEGER NOT NULL DEFAULT 0, slot_5_used INTEGER NOT NULL DEFAULT 0,
    slot_6_max INTEGER NOT NULL DEFAULT 0, slot_6_used INTEGER NOT NULL DEFAULT 0,
    slot_7_max INTEGER NOT NULL DEFAULT 0, slot_7_used INTEGER NOT NULL DEFAULT 0,
    slot_8_max INTEGER NOT NULL DEFAULT 0, slot_8_used INTEGER NOT NULL DEFAULT 0,
    slot_9_max INTEGER NOT NULL DEFAULT 0, slot_9_used INTEGER NOT NULL DEFAULT 0,

    -- Warlock pact magic (separate slot pool at a fixed level)
    pact_slot_level         INTEGER,
    pact_slots_max          INTEGER,
    pact_slots_used         INTEGER NOT NULL DEFAULT 0,

    -- -------------------------------------------------------------------------
    -- Currency
    -- -------------------------------------------------------------------------
    currency_cp             INTEGER NOT NULL DEFAULT 0 CHECK (currency_cp >= 0),
    currency_sp             INTEGER NOT NULL DEFAULT 0 CHECK (currency_sp >= 0),
    currency_ep             INTEGER NOT NULL DEFAULT 0 CHECK (currency_ep >= 0),
    currency_gp             INTEGER NOT NULL DEFAULT 0 CHECK (currency_gp >= 0),
    currency_pp             INTEGER NOT NULL DEFAULT 0 CHECK (currency_pp >= 0),

    -- -------------------------------------------------------------------------
    -- Equipped slots (reference item IDs; NULL = nothing equipped)
    -- -------------------------------------------------------------------------
    equipped_armor          TEXT REFERENCES character_items(id) ON DELETE SET NULL,
    equipped_main_hand      TEXT REFERENCES character_items(id) ON DELETE SET NULL,
    equipped_off_hand       TEXT REFERENCES character_items(id) ON DELETE SET NULL,

    -- -------------------------------------------------------------------------
    -- JSON array fields (always read/written as a unit)
    -- -------------------------------------------------------------------------
    -- ["Strength", "Wisdom"] — which abilities have saving throw proficiency
    saving_throw_profs_json     TEXT NOT NULL DEFAULT '[]',
    -- ["Longswords", "Thieves'' Tools", "Common", ...] — misc proficiencies
    other_proficiencies_json    TEXT NOT NULL DEFAULT '[]',
    -- ["Common", "Elvish", "Draconic"]
    languages_json              TEXT NOT NULL DEFAULT '[]',
    -- ["I use polysyllabic words...", ...]
    personality_traits_json     TEXT NOT NULL DEFAULT '[]',
    ideals_json                 TEXT NOT NULL DEFAULT '[]',
    bonds_json                  TEXT NOT NULL DEFAULT '[]',
    flaws_json                  TEXT NOT NULL DEFAULT '[]',

    appearance                  TEXT NOT NULL DEFAULT '',
    backstory                   TEXT NOT NULL DEFAULT '',
    notes                       TEXT NOT NULL DEFAULT '',

    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Automatically bump updated_at on any change
CREATE TRIGGER IF NOT EXISTS characters_updated_at
    AFTER UPDATE ON characters
    FOR EACH ROW
BEGIN
    UPDATE characters SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = NEW.id;
END;

-- =============================================================================
-- CHARACTER CLASSES
-- One row per class level (multiclassing = multiple rows per character)
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_classes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id    TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    class_name      TEXT    NOT NULL,   -- e.g. "Wizard"
    level           INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
    subclass        TEXT                -- NULL until subclass is chosen
);

CREATE INDEX IF NOT EXISTS idx_character_classes_char ON character_classes(character_id);

-- =============================================================================
-- CHARACTER SKILL PROFICIENCIES
-- Explicit child table because proficiency_level is mutable state
-- and queried by skill name ("show me skills I have expertise in").
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_skill_proficiencies (
    character_id        TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill               TEXT    NOT NULL,   -- e.g. "Arcana"
    proficiency_level   TEXT    NOT NULL DEFAULT 'Proficient',
        -- 'None' | 'HalfProficiency' | 'Proficient' | 'Expertise'
    PRIMARY KEY (character_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_char_skill_profs_char ON character_skill_proficiencies(character_id);

-- =============================================================================
-- CHARACTER CONDITIONS
-- Explicit child table because Exhaustion carries a level value
-- and conditions are toggled frequently during play.
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_conditions (
    character_id        TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    condition           TEXT    NOT NULL,   -- e.g. "Poisoned", "Exhaustion"
    exhaustion_level    INTEGER             -- 1-6, only set when condition = 'Exhaustion'
        CHECK (exhaustion_level IS NULL OR exhaustion_level BETWEEN 1 AND 6),
    PRIMARY KEY (character_id, condition)
);

CREATE INDEX IF NOT EXISTS idx_char_conditions_char ON character_conditions(character_id);

-- =============================================================================
-- CHARACTER FEATURES
-- Mutable: uses_current is updated every time an ability is used or recharged.
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_features (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id        TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name                TEXT    NOT NULL,
    description         TEXT    NOT NULL DEFAULT '',
    source_type         TEXT    NOT NULL,   -- 'Class' | 'Subclass' | 'Race' | 'Background' | 'Feat'
    source_name         TEXT,               -- class/subclass name if source_type is Class/Subclass
    level_required      INTEGER,
    uses_current        INTEGER,            -- NULL = unlimited
    uses_max            INTEGER,
    recharge_on         TEXT                -- 'ShortRest' | 'LongRest' | 'Dawn' | 'DawnDiceRoll' | NULL
);

CREATE INDEX IF NOT EXISTS idx_char_features_char ON character_features(character_id);

-- =============================================================================
-- CHARACTER HIT DICE
-- One row per die pool (multiclassing = multiple rows).
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_hit_dice (
    character_id    TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    die_type        TEXT    NOT NULL,   -- 'D6' | 'D8' | 'D10' | 'D12'
    total           INTEGER NOT NULL CHECK (total >= 0),
    used            INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
    PRIMARY KEY (character_id, die_type)
);

CREATE INDEX IF NOT EXISTS idx_char_hit_dice_char ON character_hit_dice(character_id);

-- =============================================================================
-- CHARACTER ITEMS (owned instances)
-- Items belong to one character. Quantity, attunement, and charges are
-- instance-level state and must be updateable without JSON surgery.
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_items (
    id                          TEXT    PRIMARY KEY,
    character_id                TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name                        TEXT    NOT NULL,
    description                 TEXT    NOT NULL DEFAULT '',
    value_cp                    INTEGER NOT NULL DEFAULT 0 CHECK (value_cp >= 0),
    quantity                    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    weight_per_unit             REAL    NOT NULL DEFAULT 0.0,

    -- Promoted out of details_json for fast filtering ("show me all weapons")
    item_type                   TEXT    NOT NULL,
        -- 'Weapon' | 'Armor' | 'Tool' | 'AdventuringGear' | 'Potion'
        -- | 'Container' | 'Scroll' | 'Valuable' | 'Ammunition' | 'Gear'

    -- Full item-type-specific stats. The JSON mirrors ItemDetails's inner payload.
    -- For AdventuringGear/Valuable/Ammunition/Gear this will be '{}'.
    details_json                TEXT    NOT NULL DEFAULT '{}',

    -- Magic item data (NULL for mundane items)
    is_magic                    INTEGER NOT NULL DEFAULT 0 CHECK (is_magic IN (0, 1)),
    magic_rarity                TEXT,   -- 'Common'|'Uncommon'|'Rare'|'VeryRare'|'Legendary'|'Artifact'
    magic_requires_attunement   INTEGER NOT NULL DEFAULT 0 CHECK (magic_requires_attunement IN (0, 1)),
    magic_is_attuned            INTEGER NOT NULL DEFAULT 0 CHECK (magic_is_attuned IN (0, 1)),
    magic_charges_current       INTEGER CHECK (magic_charges_current IS NULL OR magic_charges_current >= 0),
    magic_charges_max           INTEGER CHECK (magic_charges_max     IS NULL OR magic_charges_max     >= 0),
    magic_charges_recharge      TEXT,   -- e.g. "1d6+4 charges at dawn"
    -- MagicProperty list; rarely queried, always read as a unit
    magic_properties_json       TEXT    NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_char_items_char      ON character_items(character_id);
CREATE INDEX IF NOT EXISTS idx_char_items_type      ON character_items(character_id, item_type);

-- =============================================================================
-- SPELLS  (shared reference table / compendium)
-- =============================================================================

CREATE TABLE IF NOT EXISTS spells (
    id              TEXT    PRIMARY KEY,     -- slug, e.g. "fireball"
    name            TEXT    NOT NULL UNIQUE,
    level           INTEGER NOT NULL CHECK (level BETWEEN 0 AND 9),  -- 0 = cantrip
    school          TEXT    NOT NULL,        -- 'Evocation' | 'Necromancy' | ...

    -- Promoted scalars for the spell browser / filter panel
    concentration   INTEGER NOT NULL DEFAULT 0 CHECK (concentration IN (0, 1)),
    ritual          INTEGER NOT NULL DEFAULT 0 CHECK (ritual        IN (0, 1)),
    verbal          INTEGER NOT NULL DEFAULT 0 CHECK (verbal        IN (0, 1)),
    somatic         INTEGER NOT NULL DEFAULT 0 CHECK (somatic       IN (0, 1)),
    material        TEXT,                    -- NULL = no material component

    -- Complex fields stored as JSON (always displayed as a unit, never filtered on)
    casting_time_json   TEXT NOT NULL,       -- serialized CastingTime enum
    range_json          TEXT NOT NULL,       -- serialized Range enum
    duration_json       TEXT NOT NULL,       -- serialized Duration enum
    mechanic_json       TEXT,                -- Option<SpellMechanic>
    damage_json         TEXT NOT NULL DEFAULT '[]',  -- Vec<DamageRoll>
    scaling_json        TEXT,                -- Option<Scaling>
    aoe_json            TEXT,                -- Option<AreaOfEffect>

    description         TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_spells_level  ON spells(level);
CREATE INDEX IF NOT EXISTS idx_spells_school ON spells(school);
CREATE INDEX IF NOT EXISTS idx_spells_name   ON spells(name);

-- =============================================================================
-- CHARACTER SPELLS
-- Links characters to spells they know/have prepared.
-- Custom or homebrew spells not in the spells table can be stored as
-- free-text names in characters.known_spells_json / prepared_spells_json.
-- =============================================================================

CREATE TABLE IF NOT EXISTS character_spells (
    character_id    TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    spell_id        TEXT    NOT NULL REFERENCES spells(id)     ON DELETE CASCADE,
    is_known        INTEGER NOT NULL DEFAULT 1 CHECK (is_known    IN (0, 1)),
    is_prepared     INTEGER NOT NULL DEFAULT 0 CHECK (is_prepared IN (0, 1)),
    PRIMARY KEY (character_id, spell_id)
);

CREATE INDEX IF NOT EXISTS idx_char_spells_char ON character_spells(character_id);

-- =============================================================================
-- CREATURES  (DM compendium / monster stat blocks)
-- Most of the stat block is stored as a single JSON blob because:
--   • It is always read as a unit (load one creature for an encounter)
--   • Actions, traits, legendary actions are deeply nested and never partially updated
-- A handful of scalar columns are promoted for the encounter-builder filter panel.
-- =============================================================================

CREATE TABLE IF NOT EXISTS creatures (
    id                      TEXT    PRIMARY KEY,
    name                    TEXT    NOT NULL,

    -- Promoted for compendium filtering
    creature_type           TEXT    NOT NULL,   -- 'Dragon' | 'Undead' | ...
    size                    TEXT    NOT NULL,   -- 'Medium' | 'Large' | ...
    -- CR stored as a float to support sorting: 0, 0.125, 0.25, 0.5, 1 … 30
    challenge_rating_sort   REAL    NOT NULL CHECK (challenge_rating_sort >= 0),
    -- Human-readable CR label kept separately for display
    challenge_rating_label  TEXT    NOT NULL,   -- '0' | '1/8' | '1/4' | '1/2' | '1' … '30'
    experience_points       INTEGER NOT NULL DEFAULT 0,

    -- Full stat block (all remaining Creature fields)
    data_json               TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creatures_cr   ON creatures(challenge_rating_sort);
CREATE INDEX IF NOT EXISTS idx_creatures_type ON creatures(creature_type);
CREATE INDEX IF NOT EXISTS idx_creatures_name ON creatures(name);

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id              TEXT    PRIMARY KEY,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS campaigns_updated_at
    AFTER UPDATE ON campaigns
    FOR EACH ROW
BEGIN
    UPDATE campaigns SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = NEW.id;
END;

-- Characters that belong to a campaign
CREATE TABLE IF NOT EXISTS campaign_characters (
    campaign_id     TEXT    NOT NULL REFERENCES campaigns(id)  ON DELETE CASCADE,
    character_id    TEXT    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, character_id)
);

-- Creature instances used in a campaign (NPCs, monsters with custom HP/names)
CREATE TABLE IF NOT EXISTS campaign_creatures (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id     TEXT    NOT NULL REFERENCES campaigns(id)  ON DELETE CASCADE,
    creature_id     TEXT    NOT NULL REFERENCES creatures(id)  ON DELETE CASCADE,
    -- DM can give a specific name to an instance (e.g. "Grimnok the Hobgoblin Chief")
    display_name    TEXT,
    hp_current      INTEGER NOT NULL CHECK (hp_current >= 0),
    notes           TEXT    NOT NULL DEFAULT '',
    is_alive        INTEGER NOT NULL DEFAULT 1 CHECK (is_alive IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_campaign_creatures_camp ON campaign_creatures(campaign_id);

-- Session notes tied to a campaign
CREATE TABLE IF NOT EXISTS campaign_notes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id     TEXT    NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title           TEXT    NOT NULL DEFAULT '',
    body            TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_campaign_notes_camp ON campaign_notes(campaign_id);

-- =============================================================================
-- ITEM CATALOG  (optional read-only SRD reference data)
-- Characters pick items from here; a copy is inserted into character_items.
-- Keeping this separate means the catalog is never modified by gameplay.
-- =============================================================================

CREATE TABLE IF NOT EXISTS item_catalog (
    id                  TEXT    PRIMARY KEY,    -- e.g. "longsword"
    name                TEXT    NOT NULL UNIQUE,
    description         TEXT    NOT NULL DEFAULT '',
    value_cp            INTEGER NOT NULL DEFAULT 0,
    weight_per_unit     REAL    NOT NULL DEFAULT 0.0,
    item_type           TEXT    NOT NULL,
    details_json        TEXT    NOT NULL DEFAULT '{}',
    is_magic            INTEGER NOT NULL DEFAULT 0,
    magic_rarity        TEXT,
    magic_properties_json TEXT  NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_item_catalog_type ON item_catalog(item_type);
CREATE INDEX IF NOT EXISTS idx_item_catalog_name ON item_catalog(name);
