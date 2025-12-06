use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State, Window};
use crate::config::{AppConfig, BuildOrder, WindowPosition, WindowSize, get_config_path, get_build_orders_dir, atomic_write};
use crate::state::AppState;
use crate::hotkeys::register_hotkeys;

const MAX_IMPORT_SIZE: u64 = 1024 * 1024; // 1MB limit

#[tauri::command]
pub fn get_config(state: State<AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
pub fn save_config(config: AppConfig, state: State<AppState>) -> Result<(), String> {
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

    let mut current = state.config.lock().map_err(|e| e.to_string())?;
    *current = config;
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
pub fn save_build_order(order: BuildOrder, state: State<AppState>) -> Result<(), String> {
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
    
    Ok(())
}

#[tauri::command]
pub fn delete_build_order(id: String, state: State<AppState>) -> Result<(), String> {
    // Delete from file
    let dir = get_build_orders_dir();
    let path = dir.join(format!("{}.json", id));
    // If file doesn't exist, that's fine, we still want to remove from cache
    if let Err(e) = fs::remove_file(&path) {
        if e.kind() != std::io::ErrorKind::NotFound {
            eprintln!("Warning: Failed to delete build order file: {}", e);
        }
    }

    // Update cache
    let mut orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    orders.retain(|o| o.id != id);

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
pub fn toggle_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        if window.is_visible().unwrap_or(false) {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn show_settings(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
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

    Ok(new_state)
}

#[tauri::command]
pub fn toggle_compact_mode(state: State<AppState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.compact_mode = !config.compact_mode;
    let new_state = config.compact_mode;

    // Save to file
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

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
pub fn import_build_order(path: String, state: State<AppState>) -> Result<BuildOrder, String> {
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

    // Save to build orders directory
    let dir = get_build_orders_dir();
    let save_path = dir.join(format!("{}.json", order.id));
    let json = serde_json::to_string_pretty(&order).map_err(|e| e.to_string())?;
    atomic_write(save_path, json).map_err(|e| e.to_string())?;

    // Update cache
    let mut orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    if let Some(index) = orders.iter().position(|o| o.id == order.id) {
        orders[index] = order.clone();
    } else {
        orders.push(order.clone());
    }

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
}
