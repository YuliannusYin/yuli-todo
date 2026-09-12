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
    conn.pragma_update(None, "foreign_keys", true)
        .map_err(|_| AppError::storage(path.display().to_string()))?;
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
    let version: i32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    if version < 2 {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS task_types (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              sort_order INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tags (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS tags_name_ci ON tags(name COLLATE NOCASE);
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
              type_id TEXT NULL REFERENCES task_types(id) ON DELETE RESTRICT,
              content TEXT NOT NULL DEFAULT '' CHECK (length(content) <= 20000),
              notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 20000),
              start_at TEXT NULL,
              end_at TEXT NULL,
              status TEXT NOT NULL CHECK (status IN ('will_do','to_do','doing','done','overdue','belated','force_ended')),
              board_column TEXT NULL CHECK (board_column IN ('todo','doing','done')),
              doing_elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (doing_elapsed_seconds >= 0),
              doing_started_at TEXT NULL,
              completed_at TEXT NULL,
              archived_at TEXT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
            );
            CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(archived_at, board_column, status);
            CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(status, start_at);
            CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(status, end_at);
            CREATE INDEX IF NOT EXISTS idx_tasks_archive ON tasks(status, completed_at);
            CREATE TABLE IF NOT EXISTS task_tags (
              task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
              tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
              PRIMARY KEY (task_id, tag_id)
            );
            "#,
        )?;
        let now = crate::time::format_rfc3339(crate::time::now_utc());
        conn.execute(
            "INSERT INTO task_types (id, name, sort_order, created_at, updated_at)
             SELECT ?1, 'General', 0, ?2, ?2
             WHERE NOT EXISTS (SELECT 1 FROM task_types)",
            rusqlite::params![uuid::Uuid::new_v4().to_string(), now],
        )?;
        conn.pragma_update(None, "user_version", 2)?;
    }
    Ok(())
}
