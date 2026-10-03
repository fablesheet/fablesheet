use crate::db::DbState;
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub fn create_character(state: State<DbState>, mut character: Value) -> Result<Value, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let name = character["name"].as_str().unwrap_or("Unknown").to_string();
    character["id"] = Value::String(id.clone());

    let data_str = serde_json::to_string(&character).map_err(|e| e.to_string())?;
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO characters (id, name, data) VALUES (?1, ?2, ?3)",
        rusqlite::params![id, name, data_str],
    )
    .map_err(|e| e.to_string())?;

    Ok(character)
}

#[tauri::command]
pub fn get_characters(state: State<DbState>) -> Result<Vec<Value>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT data FROM characters ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut chars = Vec::new();
    for row in rows {
        let data_str = row.map_err(|e| e.to_string())?;
        let val: Value = serde_json::from_str(&data_str).map_err(|e| e.to_string())?;
        chars.push(val);
    }
    Ok(chars)
}

#[tauri::command]
pub fn get_character(state: State<DbState>, id: String) -> Result<Value, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let data: String = conn
        .query_row(
            "SELECT data FROM characters WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_character(
    state: State<DbState>,
    id: String,
    character: Value,
) -> Result<Value, String> {
    let name = character["name"].as_str().unwrap_or("Unknown").to_string();
    let data_str = serde_json::to_string(&character).map_err(|e| e.to_string())?;
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE characters SET name = ?1, data = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
        rusqlite::params![name, data_str, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(character)
}

#[tauri::command]
pub fn delete_character(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM characters WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
