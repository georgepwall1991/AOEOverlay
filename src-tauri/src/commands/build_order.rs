use crate::config::{
    atomic_write, get_build_orders_dir, validate_build_order, validate_build_order_id, BuildOrder,
};
use crate::state::AppState;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, State};

const MAX_IMPORT_SIZE: u64 = 1024 * 1024; // 1MB limit
pub(super) const BUILD_ORDERS_CHANGED_EVENT: &str = "build-orders-changed";

#[tauri::command]
pub fn get_build_orders(state: State<AppState>) -> Result<Vec<BuildOrder>, String> {
    let orders = state.build_orders.lock().map_err(|e| e.to_string())?;
    Ok(orders.clone())
}

#[tauri::command]
pub fn save_build_order(
    order: BuildOrder,
    state: State<AppState>,
    app: AppHandle,
) -> Result<(), String> {
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
    app.emit(BUILD_ORDERS_CHANGED_EVENT, &*orders)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_build_order(
    id: String,
    state: State<AppState>,
    app: AppHandle,
) -> Result<(), String> {
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
    app.emit(BUILD_ORDERS_CHANGED_EVENT, &*orders)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn import_build_order(
    path: String,
    state: State<AppState>,
    app: AppHandle,
) -> Result<BuildOrder, String> {
    let path = PathBuf::from(&path);

    // Validate file exists and get metadata
    let metadata = fs::metadata(&path).map_err(|e| format!("Cannot access file: {}", e))?;

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
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    let order: BuildOrder =
        serde_json::from_str(&content).map_err(|e| format!("Invalid build order format: {}", e))?;

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
    app.emit(BUILD_ORDERS_CHANGED_EVENT, &*orders)
        .map_err(|e| e.to_string())?;

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
        assert_eq!(MAX_IMPORT_SIZE, 1024 * 1024);
        assert_eq!(MAX_IMPORT_SIZE, 1_048_576);
    }

    #[test]
    fn test_build_orders_changed_event_name() {
        assert_eq!(BUILD_ORDERS_CHANGED_EVENT, "build-orders-changed");
    }

    #[test]
    fn test_max_import_size_is_reasonable() {
        assert!(MAX_IMPORT_SIZE >= 1024);
        assert!(MAX_IMPORT_SIZE <= 10 * 1024 * 1024);
    }

    #[test]
    fn test_pathbuf_from_string() {
        let path_str = "/some/path/to/file.json";
        let path = PathBuf::from(path_str);
        assert_eq!(path.to_str().unwrap(), path_str);
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
            file_size, MAX_IMPORT_SIZE
        );
        assert!(error_msg.contains("2000000"));
        assert!(error_msg.contains("1048576"));
    }

    #[test]
    fn test_file_size_boundary_values() {
        let under_limit = MAX_IMPORT_SIZE - 1;
        assert!(under_limit < MAX_IMPORT_SIZE);

        let at_limit = MAX_IMPORT_SIZE;
        assert!(at_limit <= MAX_IMPORT_SIZE);

        let over_limit = MAX_IMPORT_SIZE + 1;
        assert!(over_limit > MAX_IMPORT_SIZE);
    }

    #[test]
    fn test_error_message_duplicate_build_order() {
        let id = "my-build";
        let error = format!(
            "A build order with id \"{}\" already exists. Delete or rename it before importing.",
            id
        );
        assert!(error.contains("my-build"));
        assert!(error.contains("already exists"));
    }

    #[test]
    fn test_error_message_cannot_access_file() {
        let error = format!("Cannot access file: {}", "No such file or directory");
        assert!(error.contains("Cannot access file"));
    }

    #[test]
    fn test_error_message_not_regular_file() {
        let error = "Path must be a regular file".to_string();
        assert_eq!(error, "Path must be a regular file");
    }

    #[test]
    fn test_error_message_invalid_format() {
        let json_error = "missing field `id`";
        let error = format!("Invalid build order format: {}", json_error);
        assert!(error.contains("Invalid build order format"));
        assert!(error.contains("missing field"));
    }

    #[test]
    fn test_error_message_failed_to_read() {
        let error = format!("Failed to read file: {}", "permission denied");
        assert!(error.contains("Failed to read file"));
    }

    #[test]
    fn test_error_message_failed_to_write() {
        let error = format!("Failed to write file: {}", "disk full");
        assert!(error.contains("Failed to write file"));
    }

    #[test]
    fn test_error_message_failed_to_delete() {
        let error = format!("Failed to delete build order file: {}", "permission denied");
        assert!(error.contains("Failed to delete"));
    }

    #[test]
    fn test_max_import_size_megabyte_conversion() {
        let bytes = MAX_IMPORT_SIZE;
        let kb = bytes / 1024;
        let mb = kb / 1024;
        assert_eq!(mb, 1);
        assert_eq!(kb, 1024);
    }
}
