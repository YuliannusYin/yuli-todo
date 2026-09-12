use std::fs;
use std::path::PathBuf;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::error::AppError;

pub fn expected_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| AppError::storage("unknown"))?;
    Ok(dir.join("yuli-todo.sqlite"))
}

pub fn open(app: &AppHandle) -> Result<(PathBuf, Connection), AppError> {
    let path = expected_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|_| AppError::storage(path.display().to_string()))?;
    }
    let conn = Connection::open(&path).map_err(|_| AppError::storage(path.display().to_string()))?;
    migrate(&conn).map_err(|_| AppError::storage(path.display().to_string()))?;
    Ok((path, conn))
}

fn migrate(conn: &Connection) -> rusqlite::Result<()> {
    let version: i32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if version < 1 {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS settings (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              archive_after_days INTEGER NOT NULL DEFAULT 3 CHECK (archive_after_days >= 0 AND archive_after_days <= 365),
              locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'zh-CN')),
              theme_id TEXT NOT NULL DEFAULT 'metal' CHECK (theme_id IN ('metal', 'claude', 'vscode', 'github', 'tiktok')),
              color_scheme TEXT NOT NULL DEFAULT 'system' CHECK (color_scheme IN ('light', 'dark', 'system'))
            );
            INSERT OR IGNORE INTO settings (id) VALUES (1);
            "#,
        )?;
        conn.pragma_update(None, "user_version", 1)?;
    }
    Ok(())
}
