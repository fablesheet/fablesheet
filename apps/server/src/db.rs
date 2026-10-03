use rusqlite::{params, Connection, Result};
use serde_json::Value;

pub fn init(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS characters (
            id   TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            data TEXT NOT NULL
        );",
    )?;
    Ok(conn)
}

pub fn insert(conn: &Connection, id: &str, name: &str, data: &Value) -> Result<()> {
    conn.execute(
        "INSERT INTO characters (id, name, data) VALUES (?1, ?2, ?3)",
        params![id, name, data.to_string()],
    )?;
    Ok(())
}

pub fn select_all(conn: &Connection) -> Result<Vec<Value>> {
    let mut stmt = conn.prepare("SELECT data FROM characters ORDER BY rowid")?;
    let rows = stmt.query_map([], |row| {
        let raw: String = row.get(0)?;
        Ok(raw)
    })?;
    let mut out = Vec::new();
    for row in rows {
        let raw = row?;
        if let Ok(v) = serde_json::from_str::<Value>(&raw) {
            out.push(v);
        }
    }
    Ok(out)
}

pub fn select_one(conn: &Connection, id: &str) -> Result<Option<Value>> {
    let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?1")?;
    let mut rows = stmt.query(params![id])?;
    if let Some(row) = rows.next()? {
        let raw: String = row.get(0)?;
        return Ok(serde_json::from_str::<Value>(&raw).ok());
    }
    Ok(None)
}

pub fn update(conn: &Connection, id: &str, name: &str, data: &Value) -> Result<bool> {
    let changed = conn.execute(
        "UPDATE characters SET name = ?1, data = ?2 WHERE id = ?3",
        params![name, data.to_string(), id],
    )?;
    Ok(changed > 0)
}

pub fn delete(conn: &Connection, id: &str) -> Result<bool> {
    let changed = conn.execute("DELETE FROM characters WHERE id = ?1", params![id])?;
    Ok(changed > 0)
}
