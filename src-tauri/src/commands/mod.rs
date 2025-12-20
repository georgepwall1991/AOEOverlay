mod build_order;
mod config_commands;
mod ui;
mod window;

// Re-export all commands
pub use build_order::*;
pub use config_commands::*;
pub use ui::*;
pub use window::*;

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    // Path handling tests that don't belong to a specific command module

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_path_handling() {
        let path_str = "C:\\Users\\test\\build.json";
        let path = PathBuf::from(path_str);
        assert!(path.is_absolute());
        assert_eq!(path.extension().unwrap(), "json");
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    #[test]
    fn test_unix_path_handling() {
        let path_str = "/home/user/build.json";
        let path = PathBuf::from(path_str);
        assert!(path.is_absolute());
        assert_eq!(path.extension().unwrap(), "json");
    }

    #[test]
    fn test_relative_path_handling() {
        let path_str = "build_orders/my_build.json";
        let path = PathBuf::from(path_str);
        assert!(!path.is_absolute());
        assert_eq!(path.file_name().unwrap(), "my_build.json");
    }

    #[test]
    fn test_pathbuf_file_extension() {
        let path = PathBuf::from("/path/to/file.json");
        assert_eq!(path.extension().and_then(|s| s.to_str()), Some("json"));

        let no_ext = PathBuf::from("/path/to/file");
        assert_eq!(no_ext.extension(), None);
    }

    #[test]
    fn test_pathbuf_file_name() {
        let path = PathBuf::from("/path/to/my_build.json");
        assert_eq!(
            path.file_name().and_then(|s| s.to_str()),
            Some("my_build.json")
        );
    }

    #[test]
    fn test_pathbuf_parent() {
        let path = PathBuf::from("/path/to/my_build.json");
        assert_eq!(path.parent().and_then(|p| p.to_str()), Some("/path/to"));
    }

    #[test]
    fn test_pathbuf_join() {
        let base = PathBuf::from("/path/to");
        let full = base.join("my_build.json");
        assert!(full.to_str().unwrap().contains("my_build.json"));
    }

    #[test]
    fn test_pathbuf_empty_string() {
        let path = PathBuf::from("");
        assert_eq!(path.to_str(), Some(""));
        assert_eq!(path.file_name(), None);
    }

    #[test]
    fn test_pathbuf_with_spaces() {
        let path = PathBuf::from("/path/with spaces/my build.json");
        assert_eq!(
            path.file_name().and_then(|s| s.to_str()),
            Some("my build.json")
        );
        assert_eq!(path.extension().and_then(|s| s.to_str()), Some("json"));
    }

    #[test]
    fn test_pathbuf_with_unicode() {
        let path = PathBuf::from("/path/日本語/ビルド.json");
        assert_eq!(path.extension().and_then(|s| s.to_str()), Some("json"));
    }

    #[test]
    fn test_pathbuf_with_dots_in_name() {
        let path = PathBuf::from("/path/build.order.v1.0.json");
        assert_eq!(path.extension().and_then(|s| s.to_str()), Some("json"));
        assert_eq!(
            path.file_stem().and_then(|s| s.to_str()),
            Some("build.order.v1.0")
        );
    }

    #[test]
    fn test_pathbuf_hidden_file() {
        let path = PathBuf::from("/path/.hidden_build.json");
        assert_eq!(
            path.file_name().and_then(|s| s.to_str()),
            Some(".hidden_build.json")
        );
    }

    #[test]
    fn test_format_build_order_filename_with_special_chars() {
        let id = "english_rush-v1_pro";
        let filename = format!("{}.json", id);
        assert_eq!(filename, "english_rush-v1_pro.json");
    }

    #[test]
    fn test_format_build_order_filename_edge_cases() {
        let id = "a";
        assert_eq!(format!("{}.json", id), "a.json");

        let id = "a".repeat(100);
        let filename = format!("{}.json", id);
        assert_eq!(filename.len(), 105);
    }

    #[test]
    fn test_pathbuf_root_only() {
        #[cfg(windows)]
        let path = PathBuf::from("C:\\");
        #[cfg(not(windows))]
        let path = PathBuf::from("/");

        assert!(path.is_absolute());
        assert_eq!(path.file_name(), None);
        assert_eq!(path.parent(), None);
    }

    #[test]
    fn test_pathbuf_double_extension() {
        let path = PathBuf::from("/path/archive.tar.gz");
        assert_eq!(path.extension().and_then(|s| s.to_str()), Some("gz"));
    }

    #[test]
    fn test_pathbuf_no_parent() {
        let path = PathBuf::from("filename.json");
        assert_eq!(path.parent().and_then(|p| p.to_str()), Some(""));
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_path_with_drive_letter() {
        let path = PathBuf::from("D:\\Games\\AoE4\\builds\\english.json");
        assert!(path.is_absolute());
        assert_eq!(
            path.file_name().and_then(|s| s.to_str()),
            Some("english.json")
        );
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_unc_path() {
        let path = PathBuf::from("\\\\server\\share\\builds\\english.json");
        assert_eq!(
            path.file_name().and_then(|s| s.to_str()),
            Some("english.json")
        );
    }
}
