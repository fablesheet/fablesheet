use fablesheet_server::{app, db};

#[tokio::main]
async fn main() {
    let db_path = std::env::var("FABLESHEET_DB").unwrap_or_else(|_| "characters.db".into());
    let addr = std::env::var("FABLESHEET_ADDR").unwrap_or_else(|_| "0.0.0.0:3001".into());

    let conn = db::init(&db_path).expect("Failed to open database");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind address");
    println!("fablesheet server listening on {addr}");
    axum::serve(listener, app(conn)).await.unwrap();
}
