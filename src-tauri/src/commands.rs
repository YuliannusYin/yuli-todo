use rusqlite::Connection;
use tauri::State;

use crate::error::AppError;
use crate::prefs::{Settings, SettingsPatch};
use crate::state::{AppState, StorageInfo};

fn with_conn<T>(state: &AppState, f: impl FnOnce(&Connection) -> Result<T, AppError>) -> Result<T, AppError> {
    if state.init_error.is_some() {
        return Err(AppError::storage(&state.db_path));
    }
    let guard = state
        .db
        .lock()
        .map_err(|_| AppError::storage(&state.db_path))?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| AppError::storage(&state.db_path))?;
    f(conn).map_err(|err| match err {
        AppError::Storage { path } if path.is_empty() => AppError::storage(&state.db_path),
        other => other,
    })
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<Settings, AppError> {
    with_conn(&state, crate::prefs::get)
}

#[tauri::command]
pub fn update_settings(state: State<AppState>, patch: SettingsPatch) -> Result<Settings, AppError> {
    with_conn(&state, |conn| crate::prefs::update(conn, patch))
}

#[tauri::command]
pub fn get_storage_info(state: State<AppState>) -> StorageInfo {
    StorageInfo {
        path: state.db_path.clone(),
    }
}
