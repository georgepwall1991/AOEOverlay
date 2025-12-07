use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State, Window, WebviewUrl, WebviewWindowBuilder, Emitter};
use crate::config::{
    AppConfig,
    BuildOrder,
    WindowPosition,
    WindowSize,
    atomic_write,
    get_build_orders_dir,
    get_config_path,
    validate_build_order,
    validate_build_order_id,
};
use crate::state::AppState;
use crate::hotkeys::register_hotkeys;

const MAX_IMPORT_SIZE: u64 = 1024 * 1024; // 1MB limit
const CONFIG_CHANGED_EVENT: &str = "config-changed";
const BUILD_ORDERS_CHANGED_EVENT: &str = "build-orders-changed";

#[tauri::command]
pub fn get_config(state: State<AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
pub fn save_config(config: AppConfig, state: State<AppState>, app: AppHandle) -> Result<(), String> {
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

    let mut current = state.config.lock().map_err(|e| e.to_string())?;
    *current = config;

    // Notify all windows that config changed so they can refresh state
    app.emit(CONFIG_CHANGED_EVENT, &*current).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reload_hotkeys(app: AppHandle) -> Result<(), String> {
    register_hotkeys(&app)
}

#[tauri::command]
pub fn get_build_orders(state: State<AppState>) -> Result<Vec<BuildOrder>, String> {
    let orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    Ok(orders.clone())
}

#[tauri::command]
pub fn save_build_order(order: BuildOrder, state: State<AppState>, app: AppHandle) -> Result<(), String> {
    validate_build_order(&order)?;
    validate_build_order_id(&order.id)?;

    // Save to file
    let dir = get_build_orders_dir();
    let path = dir.join(format!("{}.json", order.id));
    let json = serde_json::to_string_pretty(&order).map_err(|e| e.to_string())?;
    atomic_write(path, json).map_err(|e| e.to_string())?;

    // Update cache
    let mut orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    if let Some(index) = orders.iter().position(|o| o.id == order.id) {
        orders[index] = order;
    } else {
        orders.push(order);
    }

    // Broadcast build order change to all windows
    app.emit(BUILD_ORDERS_CHANGED_EVENT, &*orders).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_build_order(id: String, state: State<AppState>, app: AppHandle) -> Result<(), String> {
    validate_build_order_id(&id)?;

    // Delete from file
    let dir = get_build_orders_dir();
    let path = dir.join(format!("{}.json", id));
    // If file doesn't exist, that's fine, we still want to remove from cache
    if let Err(e) = fs::remove_file(&path) {
        if e.kind() != std::io::ErrorKind::NotFound {
            return Err(format!("Failed to delete build order file: {}", e));
        }
    }

    // Update cache
    let mut orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    orders.retain(|o| o.id != id);

    // Broadcast build order change to all windows
    app.emit(BUILD_ORDERS_CHANGED_EVENT, &*orders).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_window_position(window: Window) -> Result<WindowPosition, String> {
    let position = window.outer_position().map_err(|e| e.to_string())?;
    Ok(WindowPosition {
        x: position.x,
        y: position.y,
    })
}

#[tauri::command]
pub fn set_window_position(window: Window, x: i32, y: i32) -> Result<(), String> {
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn show_settings(app: AppHandle) -> Result<(), String> {
    // Check if window already exists
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Window doesn't exist, create it
    // The app is a single-page bundle; load the SPA root for settings as well.
    let url = if cfg!(debug_assertions) {
        WebviewUrl::External("http://localhost:1420/".parse().unwrap())
    } else {
        WebviewUrl::App("index.html".into())
    };

    let window = WebviewWindowBuilder::new(&app, "settings", url)
        .title("AoE4 Overlay - Settings")
        .inner_size(800.0, 600.0)
        .resizable(true)
        .decorations(true)
        .transparent(false)
        .always_on_top(false)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_click_through(window: Window, enabled: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_click_through(app: AppHandle, state: State<AppState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.click_through = !config.click_through;
    let new_state = config.click_through;

    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(new_state).map_err(|e| e.to_string())?;
    }

    // Save to file
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

    // Broadcast config change
    app.emit(CONFIG_CHANGED_EVENT, &*config).map_err(|e| e.to_string())?;

    Ok(new_state)
}

#[tauri::command]
pub fn toggle_compact_mode(app: AppHandle, state: State<AppState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.compact_mode = !config.compact_mode;
    let new_state = config.compact_mode;

    // Save to file
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

    // Broadcast config change
    app.emit(CONFIG_CHANGED_EVENT, &*config).map_err(|e| e.to_string())?;

    Ok(new_state)
}

#[tauri::command]
pub fn get_window_size(window: Window) -> Result<WindowSize, String> {
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(WindowSize {
        width: size.width,
        height: size.height,
    })
}

#[tauri::command]
pub fn set_window_size(window: Window, width: u32, height: u32) -> Result<(), String> {
    window
        .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_build_order(path: String, state: State<AppState>, app: AppHandle) -> Result<BuildOrder, String> {
    let path = PathBuf::from(&path);

    // Validate file exists and get metadata
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Cannot access file: {}", e))?;

    // Validate it's a regular file
    if !metadata.is_file() {
        return Err("Path must be a regular file".to_string());
    }

    // Validate file size
    if metadata.len() > MAX_IMPORT_SIZE {
        return Err(format!(
            "File too large: {} bytes (max {} bytes)",
            metadata.len(),
            MAX_IMPORT_SIZE
        ));
    }

    // Read and parse
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    let order: BuildOrder = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid build order format: {}", e))?;

    validate_build_order_id(&order.id)?;
    validate_build_order(&order)?;

    // Validate duplicate against in-memory cache before writing to disk
    let mut orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    if orders.iter().any(|o| o.id == order.id) {
        return Err(format!(
            "A build order with id \"{}\" already exists. Delete or rename it before importing.",
            order.id
        ));
    }

    // Save to build orders directory
    let dir = get_build_orders_dir();
    let save_path = dir.join(format!("{}.json", order.id));
    let json = serde_json::to_string_pretty(&order).map_err(|e| e.to_string())?;
    atomic_write(save_path, json).map_err(|e| e.to_string())?;

    orders.push(order.clone());

    // Broadcast build order change to all windows
    app.emit(BUILD_ORDERS_CHANGED_EVENT, &*orders).map_err(|e| e.to_string())?;

    Ok(order)
}

#[tauri::command]
pub fn export_build_order(order: BuildOrder, path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&order).map_err(|e| e.to_string())?;
    atomic_write(&path, json).map_err(|e| format!("Failed to write file: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_max_import_size_constant() {
        // Verify the import size limit is 1MB
        assert_eq!(MAX_IMPORT_SIZE, 1024 * 1024);
        assert_eq!(MAX_IMPORT_SIZE, 1_048_576);
    }

    #[test]
    fn test_pathbuf_from_string() {
        // Verify PathBuf conversion works correctly
        let path_str = "/some/path/to/file.json";
        let path = PathBuf::from(path_str);
        assert_eq!(path.to_str().unwrap(), path_str);
    }

    #[test]
    fn test_config_changed_event_name() {
        assert_eq!(CONFIG_CHANGED_EVENT, "config-changed");
    }

    #[test]
    fn test_build_orders_changed_event_name() {
        assert_eq!(BUILD_ORDERS_CHANGED_EVENT, "build-orders-changed");
    }

    #[test]
    fn test_max_import_size_is_reasonable() {
        // Import size should be at least 1KB and at most 10MB
        assert!(MAX_IMPORT_SIZE >= 1024);
        assert!(MAX_IMPORT_SIZE <= 10 * 1024 * 1024);
    }

    // OS-specific path tests
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
        assert_eq!(path.file_name().and_then(|s| s.to_str()), Some("my_build.json"));
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
    fn test_format_build_order_filename() {
        let id = "english-rush-v1";
        let filename = format!("{}.json", id);
        assert_eq!(filename, "english-rush-v1.json");
    }

    #[test]
    fn test_format_file_size_error_message() {
        let file_size = 2_000_000u64;
        let error_msg = format!(
            "File too large: {} bytes (max {} bytes)",
            file_size,
            MAX_IMPORT_SIZE
        );
        assert!(error_msg.contains("2000000"));
        assert!(error_msg.contains("1048576"));
    }
}
