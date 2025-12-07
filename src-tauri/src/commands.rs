use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State, Window, WebviewUrl, WebviewWindowBuilder, Emitter};
use crate::config::{AppConfig, BuildOrder, WindowPosition, WindowSize, get_config_path, get_build_orders_dir, atomic_write};
use crate::state::AppState;
use crate::hotkeys::register_hotkeys;

const MAX_IMPORT_SIZE: u64 = 1024 * 1024; // 1MB limit
const MAX_BUILD_ORDER_STEPS: usize = 200;
const CONFIG_CHANGED_EVENT: &str = "config-changed";
const BUILD_ORDERS_CHANGED_EVENT: &str = "build-orders-changed";

fn validate_build_order(order: &BuildOrder) -> Result<(), String> {
    let step_count = order.steps.len();
    if step_count == 0 {
        return Err("Build order must contain at least one step".to_string());
    }
    if step_count > MAX_BUILD_ORDER_STEPS {
        return Err(format!(
            "Build order exceeds maximum of {} steps (has {})",
            MAX_BUILD_ORDER_STEPS, step_count
        ));
    }

    for (idx, step) in order.steps.iter().enumerate() {
        if step.id.trim().is_empty() {
            return Err(format!("Step {} is missing an id", idx + 1));
        }
        if step.description.trim().is_empty() {
            return Err(format!("Step {} is missing a description", idx + 1));
        }
    }

    if let Some(branches) = &order.branches {
        for branch in branches {
            if branch.steps.len() > MAX_BUILD_ORDER_STEPS {
                return Err(format!(
                    "Branch \"{}\" exceeds maximum of {} steps (has {})",
                    branch.name,
                    MAX_BUILD_ORDER_STEPS,
                    branch.steps.len()
                ));
            }
            for (idx, step) in branch.steps.iter().enumerate() {
                if step.id.trim().is_empty() {
                    return Err(format!("Branch {} step {} is missing an id", branch.name, idx + 1));
                }
                if step.description.trim().is_empty() {
                    return Err(format!("Branch {} step {} is missing a description", branch.name, idx + 1));
                }
            }
        }
    }

    Ok(())
}

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
    let url = if cfg!(debug_assertions) {
        WebviewUrl::External("http://localhost:1420/settings.html".parse().unwrap())
    } else {
        WebviewUrl::App("settings.html".into())
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
}
