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

#[derive(Debug, Clone, PartialEq, Eq)]
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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn now() -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 3, 15, 12, 0, 0).unwrap()
    }

    fn blank() -> TaskRecord {
        TaskRecord {
            status: Status::ToDo,
            board_column: Some(Column::Todo),
            start_at: None,
            end_at: None,
            doing_elapsed_seconds: 0,
            doing_started_at: None,
            completed_at: None,
            archived_at: None,
        }
    }

    #[test]
    fn place_on_create_follows_start_and_due() {
        let t = now();
        assert_eq!(
            place_on_create(Some(t + chrono::Duration::hours(1)), None, t),
            (Status::WillDo, None)
        );
        assert_eq!(
            place_on_create(None, None, t),
            (Status::ToDo, Some(Column::Todo))
        );
        assert_eq!(
            place_on_create(Some(t - chrono::Duration::minutes(1)), None, t),
            (Status::ToDo, Some(Column::Todo))
        );
        assert_eq!(
            place_on_create(None, Some(t), t),
            (Status::Overdue, Some(Column::Todo))
        );
    }

    #[test]
    fn scheduler_promotes_will_do_and_can_mark_overdue_same_pass() {
        let t = now();
        let mut task = blank();
        task.status = Status::WillDo;
        task.board_column = None;
        task.start_at = Some(t);
        apply_time_rules(&mut task, t);
        assert_eq!(task.status, Status::ToDo);
        assert_eq!(task.board_column, Some(Column::Todo));

        let mut due = blank();
        due.status = Status::WillDo;
        due.board_column = None;
        due.start_at = Some(t);
        due.end_at = Some(t);
        apply_time_rules(&mut due, t);
        assert_eq!(due.status, Status::Overdue);
        assert_eq!(due.board_column, Some(Column::Todo));
    }

    #[test]
    fn scheduler_marks_board_overdue_without_changing_column() {
        let t = now();
        let mut doing = blank();
        doing.status = Status::Doing;
        doing.board_column = Some(Column::Doing);
        doing.end_at = Some(t);
        apply_time_rules(&mut doing, t);
        assert_eq!(doing.status, Status::Overdue);
        assert_eq!(doing.board_column, Some(Column::Doing));
    }

    #[test]
    fn drag_transitions_match_table() {
        let t = now();
        let mut task = blank();
        assert!(apply_column_move(&mut task, Column::Doing, t).is_ok());
        assert_eq!(task.status, Status::Doing);
        assert_eq!(task.board_column, Some(Column::Doing));
        assert!(task.doing_started_at.is_some());

        assert!(apply_column_move(&mut task, Column::Todo, t).is_ok());
        assert_eq!(task.status, Status::ToDo);
        assert!(task.doing_started_at.is_none());

        task.status = Status::Overdue;
        task.end_at = Some(t);
        assert!(apply_column_move(&mut task, Column::Doing, t).is_ok());
        assert_eq!(task.status, Status::Overdue);
        assert_eq!(task.board_column, Some(Column::Doing));

        assert!(apply_column_move(&mut task, Column::Todo, t).is_ok());
        assert_eq!(task.status, Status::Overdue);
        assert_eq!(task.board_column, Some(Column::Todo));

        assert!(apply_column_move(&mut task, Column::Done, t).is_ok());
        assert_eq!(task.status, Status::Belated);
        assert_eq!(task.board_column, Some(Column::Done));
        assert_eq!(task.completed_at, Some(t));

        assert!(apply_column_move(&mut task, Column::Todo, t).is_ok());
        assert_eq!(task.status, Status::Overdue);
        assert!(task.completed_at.is_none());

        task.status = Status::ToDo;
        task.end_at = None;
        assert!(apply_column_move(&mut task, Column::Done, t).is_ok());
        assert_eq!(task.status, Status::Done);

        assert!(apply_column_move(&mut task, Column::Doing, t).is_ok());
        assert_eq!(task.status, Status::Doing);
        assert!(task.completed_at.is_none());
        assert!(task.doing_started_at.is_some());
    }

    #[test]
    fn save_future_start_leaves_board() {
        let t = now();
        let mut task = blank();
        task.status = Status::Doing;
        task.board_column = Some(Column::Doing);
        task.doing_started_at = Some(t - chrono::Duration::seconds(20));
        task.completed_at = Some(t);
        task.start_at = Some(t + chrono::Duration::hours(2));
        apply_time_rules(&mut task, t);
        assert_eq!(task.status, Status::WillDo);
        assert!(task.board_column.is_none());
        assert!(task.completed_at.is_none());
        assert!(task.doing_started_at.is_none());
        assert!(task.doing_elapsed_seconds >= 20);
    }

    #[test]
    fn archive_now_force_ends_incomplete_and_keeps_done() {
        let t = now();
        let mut open = blank();
        apply_archive_now(&mut open, t);
        assert_eq!(open.status, Status::ForceEnded);
        assert_eq!(open.archived_at, Some(t));
        assert_eq!(open.completed_at, Some(t));

        let mut done = blank();
        done.status = Status::Belated;
        done.board_column = Some(Column::Done);
        done.completed_at = Some(t - chrono::Duration::hours(1));
        apply_archive_now(&mut done, t);
        assert_eq!(done.status, Status::Belated);
        assert_eq!(done.archived_at, Some(t));
        assert_eq!(done.completed_at, Some(t - chrono::Duration::hours(1)));
    }

    #[test]
    fn flush_doing_pauses_on_todo_and_resume_starts_session() {
        let t = now();
        let mut task = blank();
        task.status = Status::Doing;
        task.board_column = Some(Column::Doing);
        task.doing_started_at = Some(t - chrono::Duration::seconds(40));
        assert!(apply_column_move(&mut task, Column::Todo, t).is_ok());
        assert_eq!(task.doing_elapsed_seconds, 40);
        assert!(task.doing_started_at.is_none());

        assert!(apply_column_move(&mut task, Column::Doing, t).is_ok());
        assert_eq!(task.doing_started_at, Some(t));
        assert_eq!(task.doing_elapsed_seconds, 40);
    }

    #[test]
    fn direct_todo_to_done_keeps_zero_duration() {
        let t = now();
        let mut task = blank();
        assert!(apply_column_move(&mut task, Column::Done, t).is_ok());
        assert_eq!(task.doing_elapsed_seconds, 0);
        assert!(task.doing_started_at.is_none());
        assert_eq!(task.status, Status::Done);
    }

    #[test]
    fn force_end_from_doing_includes_open_session() {
        let t = now();
        let mut task = blank();
        task.status = Status::Doing;
        task.board_column = Some(Column::Doing);
        task.doing_elapsed_seconds = 12;
        task.doing_started_at = Some(t - chrono::Duration::seconds(8));
        apply_archive_now(&mut task, t);
        assert_eq!(task.doing_elapsed_seconds, 20);
        assert!(task.doing_started_at.is_none());
        assert_eq!(task.status, Status::ForceEnded);
    }

    #[test]
    fn clock_jump_backward_adds_zero() {
        let t = now();
        let mut task = blank();
        task.doing_elapsed_seconds = 9;
        task.doing_started_at = Some(t + chrono::Duration::hours(1));
        flush_doing(&mut task, t);
        assert_eq!(task.doing_elapsed_seconds, 9);
        assert!(task.doing_started_at.is_none());
    }
}
