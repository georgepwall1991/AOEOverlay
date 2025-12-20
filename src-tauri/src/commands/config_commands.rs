use crate::config::{atomic_write, get_config_path, AppConfig};
use crate::hotkeys::register_hotkeys;
use crate::state::AppState;
use tauri::{AppHandle, Emitter, State};

pub(super) const CONFIG_CHANGED_EVENT: &str = "config-changed";

#[tauri::command]
pub fn get_config(state: State<AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
pub fn save_config(
    config: AppConfig,
    state: State<AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

    let mut current = state.config.lock().map_err(|e| e.to_string())?;
    *current = config;

    // Notify all windows that config changed so they can refresh state
    app.emit(CONFIG_CHANGED_EVENT, &*current)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reload_hotkeys(app: AppHandle) -> Result<(), String> {
    register_hotkeys(&app)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_changed_event_name() {
        assert_eq!(CONFIG_CHANGED_EVENT, "config-changed");
    }
}
