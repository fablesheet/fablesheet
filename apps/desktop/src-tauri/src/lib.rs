pub mod commands;
pub mod db;
#[cfg(test)]
mod db_tests;
pub mod models;
#[cfg(test)]
mod tests;

use db::DbState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            std::fs::create_dir_all(&data_dir).ok();
            let db_path = data_dir.join("characters.db");
            let conn = db::init(db_path.to_str().unwrap_or("characters.db"))
                .expect("failed to initialise database");
            app.manage(DbState(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::character::create_character,
            commands::character::get_characters,
            commands::character::get_character,
            commands::character::update_character,
            commands::character::delete_character,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
