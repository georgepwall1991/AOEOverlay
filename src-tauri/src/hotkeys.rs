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

fn register_single_hotkey(
    app: &AppHandle,
    key_str: &str,
    event_name: &'static str,
) -> Result<(), String> {
    if let Some(code) = string_to_code(key_str) {
        let app_handle = app.clone();
        let shortcut = Shortcut::new(None, code);
        let key_owned = key_str.to_string(); // Own the string for the closure
        println!("[Hotkeys] Registering {} -> {}", key_str, event_name);
        app.global_shortcut()
            .on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    println!("[Hotkeys] {} pressed, emitting {}", key_owned, event_name);
                    let _ = app_handle.emit(event_name, ());
                }
            })
            .map_err(|e| format!("Failed to register {}: {}", event_name, e))?;
    } else {
        eprintln!("[Hotkeys] Warning: Unknown key '{}' for {}", key_str, event_name);
    }
    Ok(())
}

pub fn register_hotkeys(app: &AppHandle) -> Result<(), String> {
    // Unregister all existing shortcuts
    if let Err(e) = app.global_shortcut().unregister_all() {
        eprintln!("Warning: Failed to unregister existing hotkeys: {}", e);
    }

    let hotkey_config = {
        let state = app.state::<AppState>();
        let config = state.config.lock().map_err(|e| e.to_string())?;
        config.hotkeys.clone()
    };

    // Register all hotkeys using helper
    let hotkeys: [(&str, &'static str); 8] = [
        (&hotkey_config.toggle_overlay, "hotkey-toggle-overlay"),
        (&hotkey_config.previous_step, "hotkey-previous-step"),
        (&hotkey_config.next_step, "hotkey-next-step"),
        (&hotkey_config.cycle_build_order, "hotkey-cycle-build-order"),
        (&hotkey_config.toggle_click_through, "hotkey-toggle-click-through"),
        (&hotkey_config.toggle_compact, "hotkey-toggle-compact"),
        (&hotkey_config.reset_build_order, "hotkey-reset-build-order"),
        (&hotkey_config.toggle_pause, "hotkey-toggle-pause"),
    ];

    for (key_str, event_name) in hotkeys {
        register_single_hotkey(app, key_str, event_name)?;
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

    #[test]
    fn test_all_function_keys() {
        assert_eq!(string_to_code("F1"), Some(Code::F1));
        assert_eq!(string_to_code("F2"), Some(Code::F2));
        assert_eq!(string_to_code("F3"), Some(Code::F3));
        assert_eq!(string_to_code("F4"), Some(Code::F4));
        assert_eq!(string_to_code("F5"), Some(Code::F5));
        assert_eq!(string_to_code("F6"), Some(Code::F6));
        assert_eq!(string_to_code("F7"), Some(Code::F7));
        assert_eq!(string_to_code("F8"), Some(Code::F8));
        assert_eq!(string_to_code("F9"), Some(Code::F9));
        assert_eq!(string_to_code("F10"), Some(Code::F10));
        assert_eq!(string_to_code("F11"), Some(Code::F11));
        assert_eq!(string_to_code("F12"), Some(Code::F12));
    }

    #[test]
    fn test_all_digits() {
        assert_eq!(string_to_code("0"), Some(Code::Digit0));
        assert_eq!(string_to_code("1"), Some(Code::Digit1));
        assert_eq!(string_to_code("2"), Some(Code::Digit2));
        assert_eq!(string_to_code("3"), Some(Code::Digit3));
        assert_eq!(string_to_code("4"), Some(Code::Digit4));
        assert_eq!(string_to_code("5"), Some(Code::Digit5));
        assert_eq!(string_to_code("6"), Some(Code::Digit6));
        assert_eq!(string_to_code("7"), Some(Code::Digit7));
        assert_eq!(string_to_code("8"), Some(Code::Digit8));
        assert_eq!(string_to_code("9"), Some(Code::Digit9));
    }

    #[test]
    fn test_all_letters() {
        let letters = [
            ("A", Code::KeyA), ("B", Code::KeyB), ("C", Code::KeyC),
            ("D", Code::KeyD), ("E", Code::KeyE), ("F", Code::KeyF),
            ("G", Code::KeyG), ("H", Code::KeyH), ("I", Code::KeyI),
            ("J", Code::KeyJ), ("K", Code::KeyK), ("L", Code::KeyL),
            ("M", Code::KeyM), ("N", Code::KeyN), ("O", Code::KeyO),
            ("P", Code::KeyP), ("Q", Code::KeyQ), ("R", Code::KeyR),
            ("S", Code::KeyS), ("T", Code::KeyT), ("U", Code::KeyU),
            ("V", Code::KeyV), ("W", Code::KeyW), ("X", Code::KeyX),
            ("Y", Code::KeyY), ("Z", Code::KeyZ),
        ];
        for (letter, code) in letters {
            assert_eq!(string_to_code(letter), Some(code), "Failed for {}", letter);
        }
    }

    #[test]
    fn test_special_keys() {
        assert_eq!(string_to_code("SPACE"), Some(Code::Space));
        assert_eq!(string_to_code("ESCAPE"), Some(Code::Escape));
        assert_eq!(string_to_code("ESC"), Some(Code::Escape));
        assert_eq!(string_to_code("ENTER"), Some(Code::Enter));
        assert_eq!(string_to_code("RETURN"), Some(Code::Enter));
        assert_eq!(string_to_code("TAB"), Some(Code::Tab));
        assert_eq!(string_to_code("BACKSPACE"), Some(Code::Backspace));
        assert_eq!(string_to_code("INSERT"), Some(Code::Insert));
        assert_eq!(string_to_code("DELETE"), Some(Code::Delete));
        assert_eq!(string_to_code("DEL"), Some(Code::Delete));
    }

    #[test]
    fn test_navigation_keys() {
        assert_eq!(string_to_code("HOME"), Some(Code::Home));
        assert_eq!(string_to_code("END"), Some(Code::End));
        assert_eq!(string_to_code("PAGEUP"), Some(Code::PageUp));
        assert_eq!(string_to_code("PGUP"), Some(Code::PageUp));
        assert_eq!(string_to_code("PAGEDOWN"), Some(Code::PageDown));
        assert_eq!(string_to_code("PGDN"), Some(Code::PageDown));
    }

    #[test]
    fn test_arrow_keys() {
        assert_eq!(string_to_code("UP"), Some(Code::ArrowUp));
        assert_eq!(string_to_code("DOWN"), Some(Code::ArrowDown));
        assert_eq!(string_to_code("LEFT"), Some(Code::ArrowLeft));
        assert_eq!(string_to_code("RIGHT"), Some(Code::ArrowRight));
    }

    #[test]
    fn test_case_insensitivity() {
        assert_eq!(string_to_code("space"), Some(Code::Space));
        assert_eq!(string_to_code("SPACE"), Some(Code::Space));
        assert_eq!(string_to_code("Space"), Some(Code::Space));
        assert_eq!(string_to_code("sPaCe"), Some(Code::Space));
        assert_eq!(string_to_code("escape"), Some(Code::Escape));
        assert_eq!(string_to_code("Escape"), Some(Code::Escape));
    }

    #[test]
    fn test_invalid_keys() {
        assert_eq!(string_to_code(""), None);
        assert_eq!(string_to_code("F13"), None);
        assert_eq!(string_to_code("F0"), None);
        assert_eq!(string_to_code("CTRL"), None);
        assert_eq!(string_to_code("ALT"), None);
        assert_eq!(string_to_code("SHIFT"), None);
        assert_eq!(string_to_code("META"), None);
        assert_eq!(string_to_code("COMMAND"), None);
        assert_eq!(string_to_code("WINDOWS"), None);
        assert_eq!(string_to_code("invalid"), None);
        assert_eq!(string_to_code("123"), None);
        assert_eq!(string_to_code("AB"), None);
    }

    #[test]
    fn test_whitespace_handling() {
        // Note: current implementation doesn't trim whitespace
        assert_eq!(string_to_code(" F1"), None);
        assert_eq!(string_to_code("F1 "), None);
        assert_eq!(string_to_code(" F1 "), None);
    }
}
