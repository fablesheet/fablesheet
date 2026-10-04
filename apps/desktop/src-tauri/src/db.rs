use rusqlite::{Connection, Result};

pub struct DbState(pub std::sync::Mutex<Connection>);

/// Schema migrations, applied in order. The database's `user_version` pragma
/// stores how many have been applied.
///
/// Never edit or reorder an existing entry once it has been released — add a
/// new one instead.
const MIGRATIONS: &[&str] = &[
    // 1: characters stored as JSON documents
    "CREATE TABLE IF NOT EXISTS characters (
         id         TEXT PRIMARY KEY,
         name       TEXT NOT NULL,
         data       TEXT NOT NULL,
         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
         updated_at TEXT DEFAULT CURRENT_TIMESTAMP
     );",
];

/// Latest schema version this build understands.
pub const SCHEMA_VERSION: i64 = MIGRATIONS.len() as i64;

pub fn init(path: &str) -> Result<Connection> {
    let mut conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    migrate(&mut conn)?;
    Ok(conn)
}

/// Applies all pending migrations, each in its own transaction.
pub fn migrate(conn: &mut Connection) -> Result<()> {
    let current: i64 = conn.query_row("PRAGMA user_version", [], |row| row.get(0))?;

    if current > SCHEMA_VERSION {
        return Err(rusqlite::Error::InvalidParameterName(format!(
            "database schema version {current} is newer than this app supports ({SCHEMA_VERSION}); please update Fablesheet"
        )));
    }

    for (index, sql) in MIGRATIONS.iter().enumerate().skip(current.max(0) as usize) {
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", index as i64 + 1)?;
        tx.commit()?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn user_version(conn: &Connection) -> i64 {
        conn.query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap()
    }

    #[test]
    fn fresh_database_is_migrated_to_latest() {
        let mut conn = Connection::open_in_memory().unwrap();
        migrate(&mut conn).unwrap();
        assert_eq!(user_version(&conn), SCHEMA_VERSION);
        conn.execute(
            "INSERT INTO characters (id, name, data) VALUES ('a', 'A', '{}')",
            [],
        )
        .unwrap();
    }

    #[test]
    fn migrate_is_idempotent() {
        let mut conn = Connection::open_in_memory().unwrap();
        migrate(&mut conn).unwrap();
        migrate(&mut conn).unwrap();
        assert_eq!(user_version(&conn), SCHEMA_VERSION);
    }

    #[test]
    fn database_from_0_1_0_keeps_its_data() {
        // v0.1.0 created the table without setting user_version
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE characters (
                 id TEXT PRIMARY KEY, name TEXT NOT NULL, data TEXT NOT NULL,
                 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
             );
             INSERT INTO characters (id, name, data) VALUES ('x', 'Old', '{\"name\":\"Old\"}');",
        )
        .unwrap();

        migrate(&mut conn).unwrap();

        let name: String = conn
            .query_row("SELECT name FROM characters WHERE id = 'x'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(name, "Old");
        assert_eq!(user_version(&conn), SCHEMA_VERSION);
    }

    #[test]
    fn newer_database_is_rejected() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "user_version", SCHEMA_VERSION + 1)
            .unwrap();
        assert!(migrate(&mut conn).is_err());
    }
}
