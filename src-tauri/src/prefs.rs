use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub archive_after_days: i64,
    pub locale: String,
    pub theme_id: String,
    pub color_scheme: String,
}

#[derive(Debug, Deserialize)]
pub struct SettingsPatch {
    pub archive_after_days: Option<i64>,
    pub locale: Option<String>,
    pub theme_id: Option<String>,
    pub color_scheme: Option<String>,
}

pub fn get(conn: &Connection) -> Result<Settings, AppError> {
    conn.query_row(
        "SELECT archive_after_days, locale, theme_id, color_scheme FROM settings WHERE id = 1",
        [],
        |row| {
            Ok(Settings {
                archive_after_days: row.get(0)?,
                locale: row.get(1)?,
                theme_id: row.get(2)?,
                color_scheme: row.get(3)?,
            })
        },
    )
    .map_err(|_| AppError::storage(String::new()))
}

pub fn update(conn: &Connection, patch: SettingsPatch) -> Result<Settings, AppError> {
    let mut current = get(conn)?;

    if let Some(days) = patch.archive_after_days {
        if !(0..=365).contains(&days) {
            return Err(AppError::Validation {
                message_key: "error.validation.archiveDays".into(),
            });
        }
        current.archive_after_days = days;
    }
    if let Some(locale) = patch.locale {
        if locale != "en" && locale != "zh-CN" {
            return Err(AppError::Validation {
                message_key: "error.validation.locale".into(),
            });
        }
        current.locale = locale;
    }
    if let Some(theme_id) = patch.theme_id {
        match theme_id.as_str() {
            "metal" | "claude" | "vscode" | "github" | "tiktok" => current.theme_id = theme_id,
            _ => {
                return Err(AppError::Validation {
                    message_key: "error.validation.theme".into(),
                })
            }
        }
    }
    if let Some(color_scheme) = patch.color_scheme {
        match color_scheme.as_str() {
            "light" | "dark" | "system" => current.color_scheme = color_scheme,
            _ => {
                return Err(AppError::Validation {
                    message_key: "error.validation.scheme".into(),
                })
            }
        }
    }

    conn.execute(
        "UPDATE settings SET archive_after_days = ?1, locale = ?2, theme_id = ?3, color_scheme = ?4 WHERE id = 1",
        rusqlite::params![
            current.archive_after_days,
            current.locale,
            current.theme_id,
            current.color_scheme
        ],
    )
    .map_err(|_| AppError::storage(String::new()))?;

    Ok(current)
}
