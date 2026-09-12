use chrono::{DateTime, SecondsFormat, TimeZone, Timelike, Utc};

use crate::error::AppError;

pub fn now_utc() -> DateTime<Utc> {
    Utc::now()
}

pub fn format_rfc3339(dt: DateTime<Utc>) -> String {
    dt.to_rfc3339_opts(SecondsFormat::Secs, true)
}

pub fn format_minute(dt: DateTime<Utc>) -> String {
    let truncated = dt
        .with_second(0)
        .and_then(|value| value.with_nanosecond(0))
        .unwrap_or(dt);
    format_rfc3339(truncated)
}

pub fn parse_optional_utc(value: &Option<String>) -> Result<Option<DateTime<Utc>>, AppError> {
    match value.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        None => Ok(None),
        Some(raw) => parse_utc(raw).map(Some),
    }
}

pub fn parse_utc(raw: &str) -> Result<DateTime<Utc>, AppError> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(raw) {
        return Ok(dt.with_timezone(&Utc));
    }
    let naive = chrono::NaiveDateTime::parse_from_str(raw, "%Y-%m-%dT%H:%M")
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(raw, "%Y-%m-%dT%H:%M:%S"))
        .map_err(|_| AppError::Validation {
            message_key: "error.validation.times".into(),
        })?;
    Utc.from_local_datetime(&naive).single().ok_or_else(|| AppError::Validation {
        message_key: "error.validation.times".into(),
    })
}
