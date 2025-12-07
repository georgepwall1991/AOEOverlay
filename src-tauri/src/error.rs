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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_error_display() {
        let err = AppError::Config("invalid value".to_string());
        assert_eq!(err.to_string(), "Configuration error: invalid value");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let app_err = AppError::from(io_err);
        assert!(app_err.to_string().contains("file not found"));
    }

    #[test]
    fn test_json_error_conversion() {
        // Create an invalid JSON scenario
        let json_result: Result<String, serde_json::Error> = serde_json::from_str("invalid json");
        let json_err = json_result.unwrap_err();
        let app_err = AppError::from(json_err);
        assert!(app_err.to_string().starts_with("JSON error:"));
    }

    #[test]
    fn test_mutex_poisoned_error() {
        let err = AppError::MutexPoisoned { context: "config lock" };
        assert_eq!(err.to_string(), "State lock poisoned: config lock");
    }

    #[test]
    fn test_file_validation_error() {
        let err = AppError::FileValidation("file too large".to_string());
        assert_eq!(err.to_string(), "File validation failed: file too large");
    }

    #[test]
    fn test_tts_error() {
        let err = AppError::Tts("speech synthesis failed".to_string());
        assert_eq!(err.to_string(), "TTS error: speech synthesis failed");
    }

    #[test]
    fn test_hotkey_error() {
        let err = AppError::Hotkey("invalid key combination".to_string());
        assert_eq!(err.to_string(), "Hotkey error: invalid key combination");
    }

    #[test]
    fn test_error_to_string_conversion() {
        let err = AppError::Config("test".to_string());
        let string: String = err.into();
        assert_eq!(string, "Configuration error: test");
    }

    #[test]
    fn test_error_debug_format() {
        let err = AppError::Config("debug test".to_string());
        let debug_str = format!("{:?}", err);
        assert!(debug_str.contains("Config"));
        assert!(debug_str.contains("debug test"));
    }

    // OS-specific error tests
    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_path_in_error() {
        let err = AppError::FileValidation("C:\\Users\\test\\file.json".to_string());
        assert!(err.to_string().contains("C:\\Users"));
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    #[test]
    fn test_unix_path_in_error() {
        let err = AppError::FileValidation("/home/user/file.json".to_string());
        assert!(err.to_string().contains("/home/user"));
    }
}
