use super::config_commands::CONFIG_CHANGED_EVENT;
use crate::config::{atomic_write, get_config_path, AppConfig};
use crate::state::AppState;
use tauri::{AppHandle, Emitter, Manager, State, Window};

#[tauri::command]
pub fn set_click_through(window: Window, enabled: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(enabled)
        .map_err(|e| e.to_string())
}

/// Helper to toggle a boolean config field, save to disk, and broadcast the change.
/// Returns the new value of the field.
fn toggle_config_bool<F>(
    state: &State<AppState>,
    app: &AppHandle,
    toggle_field: F,
) -> Result<bool, String>
where
    F: FnOnce(&mut AppConfig) -> &mut bool,
{
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    let field = toggle_field(&mut config);
    *field = !*field;
    let new_state = *field;

    // Save to file
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    atomic_write(&config_path, json).map_err(|e| e.to_string())?;

    // Broadcast config change
    app.emit(CONFIG_CHANGED_EVENT, &*config)
        .map_err(|e| e.to_string())?;

    Ok(new_state)
}

#[tauri::command]
pub fn toggle_click_through(app: AppHandle, state: State<AppState>) -> Result<bool, String> {
    let new_state = toggle_config_bool(&state, &app, |c| &mut c.click_through)?;

    // Apply to window
    if let Some(window) = app.get_webview_window("overlay") {
        window
            .set_ignore_cursor_events(new_state)
            .map_err(|e| e.to_string())?;
    }

    Ok(new_state)
}

#[tauri::command]
pub fn toggle_compact_mode(app: AppHandle, state: State<AppState>) -> Result<bool, String> {
    toggle_config_bool(&state, &app, |c| &mut c.compact_mode)
}

/// Snapshot of the foreground game-detection state, for the UI to sync on mount.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameDetectionState {
    pub focused: bool,
    pub ever_seen: bool,
    pub enabled: bool,
}

/// Shows or hides the overlay window (manual toggle-overlay hotkey + tray menu).
///
/// Uses the same layered-window alpha + click-through path as the game-focus
/// watcher on Windows; falls back to native show/hide elsewhere.
#[tauri::command]
pub fn set_overlay_visible(
    app: AppHandle,
    state: State<AppState>,
    visible: bool,
) -> Result<(), String> {
    let click_through = state
        .config
        .lock()
        .map_err(|e| e.to_string())?
        .click_through;

    if let Some(window) = app.get_webview_window("overlay") {
        #[cfg(target_os = "windows")]
        {
            crate::windows::apply_overlay_visibility(&window, visible, click_through);
        }
        #[cfg(not(target_os = "windows"))]
        {
            if visible {
                window.show().map_err(|e| e.to_string())?;
                window
                    .set_ignore_cursor_events(click_through)
                    .map_err(|e| e.to_string())?;
            } else {
                window.hide().map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_game_detection_state(state: State<AppState>) -> Result<GameDetectionState, String> {
    let runtime = state.game_detection.lock().map_err(|e| e.to_string())?;
    let enabled = state
        .config
        .lock()
        .map_err(|e| e.to_string())?
        .game_detection
        .as_ref()
        .map(|g| g.enabled)
        .unwrap_or(false);
    Ok(GameDetectionState {
        focused: runtime.focused,
        ever_seen: runtime.ever_seen,
        enabled,
    })
}
