use std::sync::Mutex;

use rusqlite::Connection;
use serde::Serialize;

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
    pub db_path: String,
    pub init_error: Option<String>,
}

#[derive(Serialize)]
pub struct StorageInfo {
    pub path: String,
}
