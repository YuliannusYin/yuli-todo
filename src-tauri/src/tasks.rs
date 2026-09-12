use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::{
    apply_archive_now, apply_column_move, apply_time_rules, place_on_create, Column, Status,
    TaskRecord,
};
use crate::error::AppError;
use crate::time::{format_minute, format_rfc3339, now_utc, parse_optional_utc, parse_utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagDto {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TaskDto {
    pub id: String,
    pub name: String,
    pub type_id: Option<String>,
    pub type_name: Option<String>,
    pub content: String,
    pub notes: String,
    pub tags: Vec<TagDto>,
    pub start_at: Option<String>,
    pub end_at: Option<String>,
    pub status: String,
    pub board_column: Option<String>,
    pub doing_elapsed_seconds: i64,
    pub completed_at: Option<String>,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct TaskWrite {
    pub name: String,
    pub type_id: Option<String>,
    pub content: String,
    pub notes: String,
    pub tags: Vec<String>,
    pub start_at: Option<String>,
    pub end_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TaskTypeDto {
    pub id: String,
    pub name: String,
    pub sort_order: i64,
    pub in_use: bool,
}

struct TaskRow {
    id: String,
    name: String,
    type_id: Option<String>,
    type_name: Option<String>,
    content: String,
    notes: String,
    start_at: Option<String>,
    end_at: Option<String>,
    status: String,
    board_column: Option<String>,
    doing_elapsed_seconds: i64,
    doing_started_at: Option<String>,
    completed_at: Option<String>,
    archived_at: Option<String>,
    created_at: String,
    updated_at: String,
}

fn validate_write(write: &TaskWrite) -> Result<(String, String, String, Option<DateTime<Utc>>, Option<DateTime<Utc>>), AppError> {
    let name = write.name.trim().to_string();
    if name.is_empty() || name.chars().count() > 200 {
        return Err(AppError::Validation {
            message_key: "error.validation.name".into(),
        });
    }
    let content = write.content.clone();
    let notes = write.notes.clone();
    if content.chars().count() > 20_000 || notes.chars().count() > 20_000 {
        return Err(AppError::Validation {
            message_key: "error.validation.name".into(),
        });
    }
    let start_at = parse_optional_utc(&write.start_at)?;
    let end_at = parse_optional_utc(&write.end_at)?;
    if let (Some(start), Some(end)) = (start_at, end_at) {
        if end < start {
            return Err(AppError::Validation {
                message_key: "error.validation.times".into(),
            });
        }
    }
    Ok((name, content, notes, start_at, end_at))
}

fn load_tags(conn: &Connection, task_id: &str) -> Result<Vec<TagDto>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT tags.id, tags.name FROM task_tags JOIN tags ON tags.id = task_tags.tag_id
         WHERE task_tags.task_id = ?1 ORDER BY tags.name COLLATE NOCASE",
    )?;
    let tags = stmt
        .query_map(params![task_id], |row| {
            Ok(TagDto {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(tags)
}

fn map_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<TaskRow> {
    Ok(TaskRow {
        id: row.get(0)?,
        name: row.get(1)?,
        type_id: row.get(2)?,
        type_name: row.get(3)?,
        content: row.get(4)?,
        notes: row.get(5)?,
        start_at: row.get(6)?,
        end_at: row.get(7)?,
        status: row.get(8)?,
        board_column: row.get(9)?,
        doing_elapsed_seconds: row.get(10)?,
        doing_started_at: row.get(11)?,
        completed_at: row.get(12)?,
        archived_at: row.get(13)?,
        created_at: row.get(14)?,
        updated_at: row.get(15)?,
    })
}

fn to_dto(conn: &Connection, row: TaskRow) -> Result<TaskDto, AppError> {
    let _ = &row.doing_started_at;
    Ok(TaskDto {
        tags: load_tags(conn, &row.id)?,
        id: row.id,
        name: row.name,
        type_id: row.type_id,
        type_name: row.type_name,
        content: row.content,
        notes: row.notes,
        start_at: row.start_at,
        end_at: row.end_at,
        status: row.status,
        board_column: row.board_column,
        doing_elapsed_seconds: row.doing_elapsed_seconds,
        completed_at: row.completed_at,
        archived_at: row.archived_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
    })
}

const TASK_SELECT: &str = "SELECT tasks.id, tasks.name, tasks.type_id, task_types.name, tasks.content, tasks.notes,
        tasks.start_at, tasks.end_at, tasks.status, tasks.board_column, tasks.doing_elapsed_seconds,
        tasks.doing_started_at, tasks.completed_at, tasks.archived_at, tasks.created_at, tasks.updated_at
     FROM tasks LEFT JOIN task_types ON task_types.id = tasks.type_id";

pub fn list_tasks(conn: &Connection, surface: &str) -> Result<Vec<TaskDto>, AppError> {
    let sql = match surface {
        "board" => format!("{TASK_SELECT} WHERE tasks.archived_at IS NULL AND tasks.board_column IS NOT NULL ORDER BY tasks.updated_at DESC"),
        "scheduled" => format!("{TASK_SELECT} WHERE tasks.archived_at IS NULL AND tasks.status = 'will_do' ORDER BY tasks.start_at ASC"),
        "archive" => format!("{TASK_SELECT} WHERE tasks.archived_at IS NOT NULL ORDER BY tasks.archived_at DESC"),
        _ => {
            return Err(AppError::Validation {
                message_key: "error.validation.surface".into(),
            })
        }
    };
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt
        .query_map([], map_row)?
        .collect::<Result<Vec<_>, _>>()?;
    rows.into_iter().map(|row| to_dto(conn, row)).collect()
}

pub fn get_task(conn: &Connection, id: &str) -> Result<TaskDto, AppError> {
    let mut stmt = conn.prepare(&format!("{TASK_SELECT} WHERE tasks.id = ?1"))?;
    let row = stmt
        .query_row(params![id], map_row)
        .optional()?
        .ok_or(AppError::NotFound)?;
    to_dto(conn, row)
}

fn upsert_tags(conn: &Connection, task_id: &str, names: &[String]) -> Result<(), AppError> {
    conn.execute("DELETE FROM task_tags WHERE task_id = ?1", params![task_id])?;
    let mut seen = std::collections::HashSet::<String>::new();
    for raw in names {
        let name = raw.trim();
        if name.is_empty() {
            continue;
        }
        if name.chars().count() > 40 {
            return Err(AppError::Validation {
                message_key: "error.validation.name".into(),
            });
        }
        let key = name.to_lowercase();
        if !seen.insert(key) {
            continue;
        }
        let existing: Option<(String, String)> = conn
            .query_row(
                "SELECT id, name FROM tags WHERE name = ?1 COLLATE NOCASE",
                params![name],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()?;
        let tag_id = if let Some((id, _)) = existing {
            id
        } else {
            let id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO tags (id, name, created_at) VALUES (?1, ?2, ?3)",
                params![id, name, format_rfc3339(now_utc())],
            )?;
            id
        };
        conn.execute(
            "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1, ?2)",
            params![task_id, tag_id],
        )?;
    }
    Ok(())
}

pub(crate) fn load_record(conn: &Connection, id: &str) -> Result<TaskRecord, AppError> {
    conn.query_row(
        "SELECT status, board_column, start_at, end_at, doing_elapsed_seconds, doing_started_at, completed_at, archived_at
         FROM tasks WHERE id = ?1",
        params![id],
        |row| {
            let status = Status::parse(&row.get::<_, String>(0)?).ok_or(rusqlite::Error::InvalidQuery)?;
            let column = row
                .get::<_, Option<String>>(1)?
                .and_then(|value| Column::parse(&value));
            Ok((
                status,
                column,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, Option<String>>(7)?,
            ))
        },
    )
    .optional()?
    .ok_or(AppError::NotFound)
    .and_then(|(status, board_column, start, end, elapsed, started, completed, archived)| {
        Ok(TaskRecord {
            status,
            board_column,
            start_at: start.as_deref().map(parse_utc).transpose()?,
            end_at: end.as_deref().map(parse_utc).transpose()?,
            doing_elapsed_seconds: elapsed,
            doing_started_at: started.as_deref().map(parse_utc).transpose()?,
            completed_at: completed.as_deref().map(parse_utc).transpose()?,
            archived_at: archived.as_deref().map(parse_utc).transpose()?,
        })
    })
}

pub fn create_task(conn: &Connection, write: TaskWrite) -> Result<TaskDto, AppError> {
    let (name, content, notes, start_at, end_at) = validate_write(&write)?;
    let now = now_utc();
    let (status, column) = place_on_create(start_at, end_at, now);
    let id = Uuid::new_v4().to_string();
    let stamp = format_rfc3339(now);
    conn.execute(
        "INSERT INTO tasks (id, name, type_id, content, notes, start_at, end_at, status, board_column,
         doing_elapsed_seconds, doing_started_at, completed_at, archived_at, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,NULL,NULL,NULL,?10,?10)",
        params![
            id,
            name,
            write.type_id,
            content,
            notes,
            start_at.map(format_minute),
            end_at.map(format_minute),
            status.as_str(),
            column.map(Column::as_str),
            stamp
        ],
    )?;
    upsert_tags(conn, &id, &write.tags)?;
    get_task(conn, &id)
}

pub fn update_task(conn: &Connection, id: &str, write: TaskWrite) -> Result<TaskDto, AppError> {
    let (name, content, notes, start_at, end_at) = validate_write(&write)?;
    let mut record = load_record(conn, id)?;
    if record.archived_at.is_some() {
        return Err(AppError::Validation {
            message_key: "error.validation.name".into(),
        });
    }
    record.start_at = start_at;
    record.end_at = end_at;
    let now = now_utc();
    apply_time_rules(&mut record, now);
    conn.execute(
        "UPDATE tasks SET name=?1, type_id=?2, content=?3, notes=?4, start_at=?5, end_at=?6,
         status=?7, board_column=?8, doing_elapsed_seconds=?9, doing_started_at=?10,
         completed_at=?11, updated_at=?12 WHERE id=?13 AND archived_at IS NULL",
        params![
            name,
            write.type_id,
            content,
            notes,
            record.start_at.map(format_minute),
            record.end_at.map(format_minute),
            record.status.as_str(),
            record.board_column.map(Column::as_str),
            record.doing_elapsed_seconds,
            record.doing_started_at.map(format_rfc3339),
            record.completed_at.map(format_rfc3339),
            format_rfc3339(now),
            id
        ],
    )?;
    upsert_tags(conn, id, &write.tags)?;
    get_task(conn, id)
}

pub fn list_types(conn: &Connection) -> Result<Vec<TaskTypeDto>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, sort_order,
            EXISTS(SELECT 1 FROM tasks WHERE tasks.type_id = task_types.id)
         FROM task_types ORDER BY sort_order ASC, name COLLATE NOCASE ASC",
    )?;
    let types = stmt
        .query_map([], |row| {
            Ok(TaskTypeDto {
                id: row.get(0)?,
                name: row.get(1)?,
                sort_order: row.get(2)?,
                in_use: row.get::<_, i64>(3)? != 0,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(types)
}

pub fn create_type(conn: &Connection, name: String) -> Result<TaskTypeDto, AppError> {
    let name = name.trim().to_string();
    if name.is_empty() || name.chars().count() > 40 {
        return Err(AppError::Validation {
            message_key: "error.validation.name".into(),
        });
    }
    let id = Uuid::new_v4().to_string();
    let now = format_rfc3339(now_utc());
    let sort: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM task_types", [], |row| row.get(0))?;
    conn.execute(
        "INSERT INTO task_types (id, name, sort_order, created_at, updated_at) VALUES (?1,?2,?3,?4,?4)",
        params![id, name, sort, now],
    )
    .map_err(|_| AppError::Validation {
        message_key: "error.validation.name".into(),
    })?;
    Ok(TaskTypeDto {
        id,
        name,
        sort_order: sort,
        in_use: false,
    })
}

pub fn rename_type(conn: &Connection, id: &str, name: String) -> Result<TaskTypeDto, AppError> {
    let name = name.trim().to_string();
    if name.is_empty() || name.chars().count() > 40 {
        return Err(AppError::Validation {
            message_key: "error.validation.name".into(),
        });
    }
    let changed = conn.execute(
        "UPDATE task_types SET name=?1, updated_at=?2 WHERE id=?3",
        params![name, format_rfc3339(now_utc()), id],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    list_types(conn)?
        .into_iter()
        .find(|item| item.id == id)
        .ok_or(AppError::NotFound)
}

pub fn delete_type(conn: &Connection, id: &str) -> Result<(), AppError> {
    let in_use: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tasks WHERE type_id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    if in_use > 0 {
        return Err(AppError::TypeInUse);
    }
    let changed = conn.execute("DELETE FROM task_types WHERE id = ?1", params![id])?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub(crate) fn persist_lifecycle(conn: &Connection, id: &str, record: &TaskRecord, now: DateTime<Utc>) -> Result<(), AppError> {
    conn.execute(
        "UPDATE tasks SET status=?1, board_column=?2, doing_elapsed_seconds=?3, doing_started_at=?4,
         completed_at=?5, archived_at=?6, updated_at=?7 WHERE id=?8",
        params![
            record.status.as_str(),
            record.board_column.map(Column::as_str),
            record.doing_elapsed_seconds,
            record.doing_started_at.map(format_rfc3339),
            record.completed_at.map(format_rfc3339),
            record.archived_at.map(format_rfc3339),
            format_rfc3339(now),
            id
        ],
    )?;
    Ok(())
}

pub fn move_task(conn: &Connection, id: &str, to_column: &str) -> Result<TaskDto, AppError> {
    let to = Column::parse(to_column).ok_or_else(|| AppError::Validation {
        message_key: "error.validation.surface".into(),
    })?;
    let mut record = load_record(conn, id)?;
    let now = now_utc();
    apply_column_move(&mut record, to, now).map_err(|_| AppError::Validation {
        message_key: "error.validation.surface".into(),
    })?;
    persist_lifecycle(conn, id, &record, now)?;
    get_task(conn, id)
}

pub fn archive_now(conn: &Connection, id: &str) -> Result<TaskDto, AppError> {
    let mut record = load_record(conn, id)?;
    if record.archived_at.is_some() {
        return Err(AppError::Validation {
            message_key: "error.validation.surface".into(),
        });
    }
    let now = now_utc();
    apply_archive_now(&mut record, now);
    persist_lifecycle(conn, id, &record, now)?;
    get_task(conn, id)
}

pub fn delete_task(conn: &Connection, id: &str) -> Result<(), AppError> {
    let archived: Option<Option<String>> = conn
        .query_row(
            "SELECT archived_at FROM tasks WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .optional()?;
    match archived {
        None => Err(AppError::NotFound),
        Some(None) => Err(AppError::NotArchived),
        Some(Some(_)) => {
            conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
            Ok(())
        }
    }
}

fn query_ids(conn: &Connection, sql: &str, param: &str) -> Result<Vec<String>, AppError> {
    let mut stmt = conn.prepare(sql)?;
    let ids = stmt
        .query_map(params![param], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(ids)
}

pub fn clock_tick(conn: &Connection) -> Result<bool, AppError> {
    clock_tick_at(conn, now_utc())
}

pub fn clock_tick_at(conn: &Connection, now: DateTime<Utc>) -> Result<bool, AppError> {
    let now_s = format_rfc3339(now);
    let tx = conn.unchecked_transaction()?;
    let mut changed = false;

    let promote_ids = query_ids(
        &tx,
        "SELECT id FROM tasks WHERE archived_at IS NULL AND status = 'will_do' AND start_at IS NOT NULL AND start_at <= ?1",
        &now_s,
    )?;
    for id in promote_ids {
        let mut record = load_record(&tx, &id)?;
        let previous = record.clone();
        apply_time_rules(&mut record, now);
        if record != previous {
            persist_lifecycle(&tx, &id, &record, now)?;
            changed = true;
        }
    }

    let overdue_ids = query_ids(
        &tx,
        "SELECT id FROM tasks WHERE archived_at IS NULL AND board_column IN ('todo','doing')
         AND (
           (status IN ('to_do','doing') AND end_at IS NOT NULL AND end_at <= ?1)
           OR (status = 'overdue' AND (end_at IS NULL OR end_at > ?1))
         )",
        &now_s,
    )?;
    for id in overdue_ids {
        let mut record = load_record(&tx, &id)?;
        let previous = record.clone();
        apply_time_rules(&mut record, now);
        if record != previous {
            persist_lifecycle(&tx, &id, &record, now)?;
            changed = true;
        }
    }

    let days: i64 = tx.query_row(
        "SELECT archive_after_days FROM settings WHERE id = 1",
        [],
        |row| row.get(0),
    )?;
    let cutoff = now - chrono::Duration::days(days);
    let cutoff_s = format_rfc3339(cutoff);
    let archive_ids = query_ids(
        &tx,
        "SELECT id FROM tasks WHERE archived_at IS NULL AND status IN ('done','belated')
         AND completed_at IS NOT NULL AND completed_at <= ?1",
        &cutoff_s,
    )?;
    for id in archive_ids {
        let mut record = load_record(&tx, &id)?;
        record.archived_at = Some(now);
        persist_lifecycle(&tx, &id, &record, now)?;
        changed = true;
    }

    tx.commit()?;
    Ok(changed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::open_memory;
    use crate::error::AppError;
    use crate::prefs::SettingsPatch;

    fn write(name: &str, start_at: Option<String>, end_at: Option<String>) -> TaskWrite {
        TaskWrite {
            name: name.into(),
            type_id: None,
            content: String::new(),
            notes: String::new(),
            tags: vec!["alpha".into()],
            start_at,
            end_at,
        }
    }

    #[test]
    fn delete_rejects_active_and_removes_archived() {
        let conn = open_memory().unwrap();
        let created = create_task(&conn, write("Keep", None, None)).unwrap();
        assert!(matches!(
            delete_task(&conn, &created.id),
            Err(AppError::NotArchived)
        ));
        archive_now(&conn, &created.id).unwrap();
        delete_task(&conn, &created.id).unwrap();
        assert!(matches!(get_task(&conn, &created.id), Err(AppError::NotFound)));
    }

    #[test]
    fn clock_tick_promotes_marks_overdue_and_auto_archives() {
        let conn = open_memory().unwrap();
        crate::prefs::update(
            &conn,
            SettingsPatch {
                archive_after_days: Some(0),
                locale: None,
                theme_id: None,
                color_scheme: None,
            },
        )
        .unwrap();
        let now = now_utc();
        let future = format_rfc3339(now + chrono::Duration::hours(2));
        let scheduled = create_task(&conn, write("Later", Some(future), None)).unwrap();
        assert_eq!(scheduled.status, "will_do");

        conn.execute(
            "UPDATE tasks SET start_at = ?1 WHERE id = ?2",
            params![format_rfc3339(now), scheduled.id],
        )
        .unwrap();
        assert!(clock_tick_at(&conn, now).unwrap());
        let promoted = get_task(&conn, &scheduled.id).unwrap();
        assert_eq!(promoted.status, "to_do");
        assert_eq!(promoted.board_column.as_deref(), Some("todo"));

        let board = create_task(&conn, write("Due soon", None, None)).unwrap();
        conn.execute(
            "UPDATE tasks SET end_at = ?1 WHERE id = ?2",
            params![format_rfc3339(now), board.id],
        )
        .unwrap();
        assert!(clock_tick_at(&conn, now).unwrap());
        let overdue = get_task(&conn, &board.id).unwrap();
        assert_eq!(overdue.status, "overdue");
        assert_eq!(overdue.board_column.as_deref(), Some("todo"));

        let done = create_task(&conn, write("Finished", None, None)).unwrap();
        move_task(&conn, &done.id, "done").unwrap();
        let after_done = now_utc();
        assert!(clock_tick_at(&conn, after_done).unwrap());
        let archived = get_task(&conn, &done.id).unwrap();
        assert_eq!(archived.status, "done");
        assert!(archived.archived_at.is_some());
    }

    #[test]
    fn clock_tick_does_not_archive_before_delay() {
        let conn = open_memory().unwrap();
        let done = create_task(&conn, write("Wait", None, None)).unwrap();
        move_task(&conn, &done.id, "done").unwrap();
        let now = now_utc();
        assert!(!clock_tick_at(&conn, now).unwrap());
        let still = get_task(&conn, &done.id).unwrap();
        assert!(still.archived_at.is_none());
        assert_eq!(still.board_column.as_deref(), Some("done"));
    }
}
