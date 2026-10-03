use rusqlite::{Connection, Result};

pub struct DbState(pub std::sync::Mutex<Connection>);

pub fn init(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         CREATE TABLE IF NOT EXISTS characters (
             id         TEXT PRIMARY KEY,
             name       TEXT NOT NULL,
             data       TEXT NOT NULL,
             created_at TEXT DEFAULT CURRENT_TIMESTAMP,
             updated_at TEXT DEFAULT CURRENT_TIMESTAMP
         );",
    )?;
    Ok(conn)
}
