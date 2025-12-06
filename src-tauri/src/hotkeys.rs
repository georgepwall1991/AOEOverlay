use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut, ShortcutState};
use crate::state::AppState;

// Map string hotkey name to Code enum
fn string_to_code(key: &str) -> Option<Code> {
    match key.to_uppercase().as_str() {
        "F1" => Some(Code::F1),
        "F2" => Some(Code::F2),
        "F3" => Some(Code::F3),
        "F4" => Some(Code::F4),
        "F5" => Some(Code::F5),
        "F6" => Some(Code::F6),
        "F7" => Some(Code::F7),
        "F8" => Some(Code::F8),
        "F9" => Some(Code::F9),
        "F10" => Some(Code::F10),
        "F11" => Some(Code::F11),
        "F12" => Some(Code::F12),
        "SPACE" => Some(Code::Space),
        "ESCAPE" | "ESC" => Some(Code::Escape),
        "ENTER" | "RETURN" => Some(Code::Enter),
        "TAB" => Some(Code::Tab),
        "BACKSPACE" => Some(Code::Backspace),
        "INSERT" => Some(Code::Insert),
        "DELETE" | "DEL" => Some(Code::Delete),
        "HOME" => Some(Code::Home),
        "END" => Some(Code::End),
        "PAGEUP" | "PGUP" => Some(Code::PageUp),
        "PAGEDOWN" | "PGDN" => Some(Code::PageDown),
        "UP" => Some(Code::ArrowUp),
        "DOWN" => Some(Code::ArrowDown),
        "LEFT" => Some(Code::ArrowLeft),
        "RIGHT" => Some(Code::ArrowRight),
        "A" => Some(Code::KeyA),
        "B" => Some(Code::KeyB),
        "C" => Some(Code::KeyC),
        "D" => Some(Code::KeyD),
        "E" => Some(Code::KeyE),
        "F" => Some(Code::KeyF),
        "G" => Some(Code::KeyG),
        "H" => Some(Code::KeyH),
        "I" => Some(Code::KeyI),
        "J" => Some(Code::KeyJ),
        "K" => Some(Code::KeyK),
        "L" => Some(Code::KeyL),
        "M" => Some(Code::KeyM),
        "N" => Some(Code::KeyN),
        "O" => Some(Code::KeyO),
        "P" => Some(Code::KeyP),
        "Q" => Some(Code::KeyQ),
        "R" => Some(Code::KeyR),
        "S" => Some(Code::KeyS),
        "T" => Some(Code::KeyT),
        "U" => Some(Code::KeyU),
        "V" => Some(Code::KeyV),
        "W" => Some(Code::KeyW),
        "X" => Some(Code::KeyX),
        "Y" => Some(Code::KeyY),
        "Z" => Some(Code::KeyZ),
        "0" => Some(Code::Digit0),
        "1" => Some(Code::Digit1),
        "2" => Some(Code::Digit2),
        "3" => Some(Code::Digit3),
        "4" => Some(Code::Digit4),
        "5" => Some(Code::Digit5),
        "6" => Some(Code::Digit6),
        "7" => Some(Code::Digit7),
        "8" => Some(Code::Digit8),
        "9" => Some(Code::Digit9),
        _ => None,
    }
}

// Helper to register hotkeys
pub fn register_hotkeys(app: &AppHandle) -> Result<(), String> {
    let _ = app.global_shortcut().unregister_all();

    let hotkey_config = {
        let state = app.state::<AppState>();
        let config = state.config.lock().map_err(|e| e.to_string())?;
        config.hotkeys.clone()
    };

    // Toggle Overlay
    if let Some(code) = string_to_code(&hotkey_config.toggle_overlay) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-toggle-overlay", ());
                if let Some(window) = app_handle.get_webview_window("overlay") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                    }
                }
            }
        }).map_err(|e| e.to_string())?;
    }

    // Previous Step
    if let Some(code) = string_to_code(&hotkey_config.previous_step) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-previous-step", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    // Next Step
    if let Some(code) = string_to_code(&hotkey_config.next_step) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-next-step", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    // Cycle Build Order
    if let Some(code) = string_to_code(&hotkey_config.cycle_build_order) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-cycle-build-order", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    // Toggle Click-Through
    if let Some(code) = string_to_code(&hotkey_config.toggle_click_through) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-toggle-click-through", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    // Toggle Compact Mode
    if let Some(code) = string_to_code(&hotkey_config.toggle_compact) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-toggle-compact", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    // Reset Build Order
    if let Some(code) = string_to_code(&hotkey_config.reset_build_order) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-reset-build-order", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    // Toggle Pause
    if let Some(code) = string_to_code(&hotkey_config.toggle_pause) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app_handle.emit("hotkey-toggle-pause", ());
            }
        }).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri_plugin_global_shortcut::Code;

    #[test]
    fn test_string_to_code() {
        assert_eq!(string_to_code("F1"), Some(Code::F1));
        assert_eq!(string_to_code("f1"), Some(Code::F1)); // Case insensitive
        assert_eq!(string_to_code("F12"), Some(Code::F12));
        assert_eq!(string_to_code("A"), Some(Code::KeyA));
        assert_eq!(string_to_code("a"), Some(Code::KeyA));
        assert_eq!(string_to_code("0"), Some(Code::Digit0));
        assert_eq!(string_to_code("Space"), Some(Code::Space));
        assert_eq!(string_to_code("UnknownKey"), None);
        assert_eq!(string_to_code(""), None);
    }
}
