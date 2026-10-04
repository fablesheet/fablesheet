//! Fablesheet sync server: a small REST API storing characters as JSON documents.

pub mod db;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use rusqlite::Connection;
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;
use uuid::Uuid;

type Db = Arc<Mutex<Connection>>;

/// Builds the HTTP router on top of an open database connection.
pub fn app(conn: Connection) -> Router {
    let state: Db = Arc::new(Mutex::new(conn));
    Router::new()
        .route(
            "/api/characters",
            get(list_characters).post(create_character),
        )
        .route(
            "/api/characters/{id}",
            get(get_character)
                .put(update_character)
                .delete(delete_character),
        )
        .layer(CorsLayer::permissive())
        .with_state(state)
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async fn list_characters(State(db): State<Db>) -> Result<Json<Value>, StatusCode> {
    let conn = db.lock().unwrap();
    let characters = db::select_all(&conn).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(json!(characters)))
}

async fn get_character(
    State(db): State<Db>,
    Path(id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let conn = db.lock().unwrap();
    match db::select_one(&conn, &id).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)? {
        Some(character) => Ok(Json(character)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_character(
    State(db): State<Db>,
    Json(mut body): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    body["id"] = json!(id);
    let name = body["name"].as_str().unwrap_or("Unknown").to_string();
    let conn = db.lock().unwrap();
    db::insert(&conn, &id, &name, &body).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(body))
}

async fn update_character(
    State(db): State<Db>,
    Path(id): Path<String>,
    Json(mut body): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    body["id"] = json!(id);
    let name = body["name"].as_str().unwrap_or("Unknown").to_string();
    let conn = db.lock().unwrap();
    let found =
        db::update(&conn, &id, &name, &body).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if found {
        Ok(Json(body))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn delete_character(
    State(db): State<Db>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let conn = db.lock().unwrap();
    let found = db::delete(&conn, &id).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if found {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
