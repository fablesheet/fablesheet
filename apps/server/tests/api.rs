//! End-to-end tests for the REST API, run against an in-memory database.

use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use fablesheet_server::{app, db};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

fn test_app() -> Router {
    app(db::init(":memory:").unwrap())
}

async fn send(app: &Router, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let request = Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(body.map_or_else(Body::empty, |b| Body::from(b.to_string())))
        .unwrap();
    let response = app.clone().oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, value)
}

#[tokio::test]
async fn character_crud_round_trip() {
    let app = test_app();

    let (status, created) = send(
        &app,
        "POST",
        "/api/characters",
        Some(json!({ "name": "Aria" })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let id = created["id"]
        .as_str()
        .expect("server assigns an id")
        .to_string();

    let (status, list) = send(&app, "GET", "/api/characters", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 1);

    let uri = format!("/api/characters/{id}");
    let (status, fetched) = send(&app, "GET", &uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(fetched["name"], "Aria");

    let (status, updated) = send(&app, "PUT", &uri, Some(json!({ "name": "Aria the Bold" }))).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(updated["id"], id.as_str());

    let (_, fetched) = send(&app, "GET", &uri, None).await;
    assert_eq!(fetched["name"], "Aria the Bold");

    let (status, _) = send(&app, "DELETE", &uri, None).await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, _) = send(&app, "GET", &uri, None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn unknown_character_returns_404() {
    let app = test_app();
    for method in ["GET", "DELETE"] {
        let (status, _) = send(&app, method, "/api/characters/missing", None).await;
        assert_eq!(status, StatusCode::NOT_FOUND, "{method}");
    }
    let (status, _) = send(
        &app,
        "PUT",
        "/api/characters/missing",
        Some(json!({ "name": "X" })),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}
