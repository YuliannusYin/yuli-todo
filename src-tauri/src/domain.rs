use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Status {
    WillDo,
    ToDo,
    Doing,
    Done,
    Overdue,
    Belated,
    ForceEnded,
}

impl Status {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::WillDo => "will_do",
            Self::ToDo => "to_do",
            Self::Doing => "doing",
            Self::Done => "done",
            Self::Overdue => "overdue",
            Self::Belated => "belated",
            Self::ForceEnded => "force_ended",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "will_do" => Some(Self::WillDo),
            "to_do" => Some(Self::ToDo),
            "doing" => Some(Self::Doing),
            "done" => Some(Self::Done),
            "overdue" => Some(Self::Overdue),
            "belated" => Some(Self::Belated),
            "force_ended" => Some(Self::ForceEnded),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Column {
    Todo,
    Doing,
    Done,
}

impl Column {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Todo => "todo",
            Self::Doing => "doing",
            Self::Done => "done",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "todo" => Some(Self::Todo),
            "doing" => Some(Self::Doing),
            "done" => Some(Self::Done),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct TaskRecord {
    pub status: Status,
    pub board_column: Option<Column>,
    pub start_at: Option<DateTime<Utc>>,
    pub end_at: Option<DateTime<Utc>>,
    pub doing_elapsed_seconds: i64,
    pub doing_started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub archived_at: Option<DateTime<Utc>>,
}

pub fn flush_doing(task: &mut TaskRecord, now: DateTime<Utc>) {
    if let Some(started) = task.doing_started_at.take() {
        let delta = (now - started).num_seconds().max(0);
        task.doing_elapsed_seconds = task.doing_elapsed_seconds.saturating_add(delta);
    }
}

pub fn start_doing(task: &mut TaskRecord, now: DateTime<Utc>) {
    if task.doing_started_at.is_none() {
        task.doing_started_at = Some(now);
    }
}

pub fn place_on_create(
    start_at: Option<DateTime<Utc>>,
    end_at: Option<DateTime<Utc>>,
    now: DateTime<Utc>,
) -> (Status, Option<Column>) {
    if start_at.is_some_and(|start| start > now) {
        return (Status::WillDo, None);
    }
    let due = end_at.is_some_and(|end| end <= now);
    if due {
        (Status::Overdue, Some(Column::Todo))
    } else {
        (Status::ToDo, Some(Column::Todo))
    }
}

pub fn apply_time_rules(task: &mut TaskRecord, now: DateTime<Utc>) {
    if task.archived_at.is_some() {
        return;
    }
    if task.start_at.is_some_and(|start| start > now) {
        flush_doing(task, now);
        task.status = Status::WillDo;
        task.board_column = None;
        task.completed_at = None;
        return;
    }
    if task.status == Status::WillDo {
        task.board_column = Some(Column::Todo);
        task.status = Status::ToDo;
    }
    let due = task.end_at.is_some_and(|end| end <= now);
    if task.status == Status::Overdue && !due {
        task.status = match task.board_column {
            Some(Column::Doing) => Status::Doing,
            _ => Status::ToDo,
        };
    }
    if due
        && matches!(task.board_column, Some(Column::Todo) | Some(Column::Doing))
        && !matches!(task.status, Status::Done | Status::Belated)
    {
        task.status = Status::Overdue;
    }
}

pub fn apply_column_move(task: &mut TaskRecord, to: Column, now: DateTime<Utc>) -> Result<(), ()> {
    if task.archived_at.is_some() {
        return Err(());
    }
    let from = task.board_column.ok_or(())?;
    if from == to {
        if to == Column::Doing {
            start_doing(task, now);
        }
        return Ok(());
    }
    let due = task.end_at.is_some_and(|end| end <= now);
    let was_overdue = task.status == Status::Overdue;
    match to {
        Column::Done => {
            flush_doing(task, now);
            task.status = if was_overdue {
                Status::Belated
            } else {
                Status::Done
            };
            task.board_column = Some(Column::Done);
            task.completed_at = Some(now);
        }
        Column::Todo => {
            if from == Column::Doing {
                flush_doing(task, now);
            }
            if from == Column::Done {
                task.completed_at = None;
            }
            task.board_column = Some(Column::Todo);
            task.status = if due { Status::Overdue } else { Status::ToDo };
        }
        Column::Doing => {
            if from == Column::Done {
                task.completed_at = None;
            }
            task.board_column = Some(Column::Doing);
            task.status = if due { Status::Overdue } else { Status::Doing };
            start_doing(task, now);
        }
    }
    Ok(())
}

pub fn apply_archive_now(task: &mut TaskRecord, now: DateTime<Utc>) {
    flush_doing(task, now);
    match task.status {
        Status::Done | Status::Belated => {
            task.archived_at = Some(now);
        }
        _ => {
            task.status = Status::ForceEnded;
            task.completed_at = Some(now);
            task.archived_at = Some(now);
        }
    }
}
