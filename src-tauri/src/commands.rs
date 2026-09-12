use rusqlite::Connection;
use tauri::State;

use crate::error::AppError;
use crate::prefs::{Settings, SettingsPatch};
use crate::state::{AppState, StorageInfo};
use crate::tasks::{TaskWrite, TaskTypeDto, TaskDto};

pub fn with_conn<T>(state: &AppState, f: impl FnOnce(&Connection) -> Result<T, AppError>) -> Result<T, AppError> {
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

#[tauri::command]
pub fn list_tasks(state: State<AppState>, surface: String) -> Result<Vec<TaskDto>, AppError> {
    with_conn(&state, |conn| crate::tasks::list_tasks(conn, &surface))
}

#[tauri::command]
pub fn get_task(state: State<AppState>, id: String) -> Result<TaskDto, AppError> {
    with_conn(&state, |conn| crate::tasks::get_task(conn, &id))
}

#[tauri::command]
pub fn create_task(state: State<AppState>, payload: TaskWrite) -> Result<TaskDto, AppError> {
    with_conn(&state, |conn| crate::tasks::create_task(conn, payload))
}

#[tauri::command]
pub fn update_task(state: State<AppState>, id: String, payload: TaskWrite) -> Result<TaskDto, AppError> {
    with_conn(&state, |conn| crate::tasks::update_task(conn, &id, payload))
}

#[tauri::command]
pub fn list_types(state: State<AppState>) -> Result<Vec<TaskTypeDto>, AppError> {
    with_conn(&state, crate::tasks::list_types)
}

#[tauri::command]
pub fn create_type(state: State<AppState>, name: String) -> Result<TaskTypeDto, AppError> {
    with_conn(&state, |conn| crate::tasks::create_type(conn, name))
}

#[tauri::command]
pub fn rename_type(state: State<AppState>, id: String, name: String) -> Result<TaskTypeDto, AppError> {
    with_conn(&state, |conn| crate::tasks::rename_type(conn, &id, name))
}

#[tauri::command]
pub fn delete_type(state: State<AppState>, id: String) -> Result<(), AppError> {
    with_conn(&state, |conn| crate::tasks::delete_type(conn, &id))
}

#[tauri::command]
pub fn move_task(state: State<AppState>, id: String, to_column: String) -> Result<crate::tasks::TaskDto, AppError> {
    with_conn(&state, |conn| crate::tasks::move_task(conn, &id, &to_column))
}

#[tauri::command]
pub fn archive_now(state: State<AppState>, id: String) -> Result<crate::tasks::TaskDto, AppError> {
    with_conn(&state, |conn| crate::tasks::archive_now(conn, &id))
}
