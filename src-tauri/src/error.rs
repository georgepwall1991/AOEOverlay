use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("State lock poisoned: {context}")]
    MutexPoisoned { context: &'static str },

    #[error("File validation failed: {0}")]
    FileValidation(String),

    #[error("TTS error: {0}")]
    Tts(String),

    #[error("Hotkey error: {0}")]
    Hotkey(String),
}

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
