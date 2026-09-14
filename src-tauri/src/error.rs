use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("storage error")]
    Storage { path: String },
    #[error("validation error")]
    Validation { message_key: String },
    #[error("not found")]
    NotFound,
    #[error("not archived")]
    NotArchived,
    #[error("type in use")]
    TypeInUse,
}

impl AppError {
    pub fn storage(path: impl Into<String>) -> Self {
        Self::Storage { path: path.into() }
    }

    fn code(&self) -> &'static str {
        match self {
            Self::Storage { .. } => "STORAGE",
            Self::Validation { .. } => "VALIDATION",
            Self::NotFound => "NOT_FOUND",
            Self::NotArchived => "NOT_ARCHIVED",
            Self::TypeInUse => "TYPE_IN_USE",
        }
    }

    fn message_key(&self) -> &str {
        match self {
            Self::Storage { .. } => "error.storage.body",
            Self::Validation { message_key } => message_key,
            Self::NotFound => "error.notFound",
            Self::NotArchived => "error.notArchived",
            Self::TypeInUse => "error.typeInUse",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let mut map = serializer.serialize_map(Some(3))?;
        map.serialize_entry("code", self.code())?;
        map.serialize_entry("messageKey", self.message_key())?;
        if let Self::Storage { path } = self {
            map.serialize_entry("path", path)?;
        }
        map.end()
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(value: rusqlite::Error) -> Self {
        let _ = value;
        Self::Storage {
            path: String::new(),
        }
    }
}
