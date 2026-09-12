mod commands;
mod db;
mod error;
mod prefs;
mod state;

use std::sync::Mutex;

use tauri::{AppHandle, Manager};

use crate::state::AppState;

pub fn build_state(app: &AppHandle) -> AppState {
    match crate::db::open(app) {
        Ok((path, conn)) => AppState {
            db: Mutex::new(Some(conn)),
            db_path: path.display().to_string(),
            init_error: None,
        },
        Err(err) => {
            let path = crate::db::expected_path(app)
                .map(|p| p.display().to_string())
                .unwrap_or_else(|_| "unknown".into());
            let _ = err;
            AppState {
                db: Mutex::new(None),
                db_path: path,
                init_error: Some("STORAGE".into()),
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let state = build_state(app.handle());
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::update_settings,
            commands::get_storage_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
