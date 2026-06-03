//! Foreground-window game detection (Windows).
//!
//! Polls the active foreground window and resolves its process image name. When
//! the configured game (default `RelicCardinal.exe`, the AoE4 binary) becomes the
//! foreground window the overlay is made visible; when you alt-tab to any other
//! app it is hidden — so the overlay is present in-game and gone everywhere else.
//!
//! Visibility is applied with the same `SetLayeredWindowAttributes` alpha trick
//! the rest of the Windows module uses (alpha 255 = shown, 0 = hidden) plus
//! `set_ignore_cursor_events`, so a hidden overlay never blocks clicks on the app
//! you tabbed to. The game never loses focus — we never call `set_focus` here.

use crate::state::AppState;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use windows::core::PWSTR;
use windows::Win32::Foundation::{CloseHandle, COLORREF, HWND};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowThreadProcessId, SetLayeredWindowAttributes, LWA_ALPHA,
};

const GAME_FOCUS_EVENT: &str = "game-focus-changed";

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct GameFocusPayload {
    focused: bool,
    process_name: Option<String>,
    ever_seen: bool,
}

/// Resolves the foreground window's (process id, executable basename).
///
/// Returns `None` when the foreground window can't be inspected (e.g. the secure
/// desktop during a UAC prompt) — callers treat that as "no change".
fn foreground_process() -> Option<(u32, String)> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }

        let mut pid: u32 = 0;
        let thread_id = GetWindowThreadProcessId(hwnd, Some(&mut pid as *mut u32));
        if thread_id == 0 || pid == 0 {
            return None;
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        if handle.is_invalid() {
            return None;
        }

        let mut buf = [0u16; 260];
        let mut len = buf.len() as u32;
        let result = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            PWSTR(buf.as_mut_ptr()),
            &mut len,
        );
        let _ = CloseHandle(handle);

        if result.is_err() || len == 0 {
            return None;
        }

        let full_path = String::from_utf16_lossy(&buf[..len as usize]);
        let basename = full_path
            .rsplit(|c| c == '\\' || c == '/')
            .next()
            .unwrap_or(&full_path)
            .to_string();
        Some((pid, basename))
    }
}

/// Gets the overlay window, tolerating the occasional "main" label on Windows.
fn overlay_window(app: &AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("overlay")
        .or_else(|| app.get_webview_window("main"))
}

/// Sets the whole-window alpha via the layered-window API (0 = invisible, 255 = opaque).
fn set_overlay_alpha(window: &tauri::WebviewWindow, alpha: u8) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let raw = HWND(hwnd.0 as isize as *mut std::ffi::c_void);
            let _ = SetLayeredWindowAttributes(raw, COLORREF(0), alpha, LWA_ALPHA);
        }
    }
}

/// Reveals the overlay without stealing focus from the game.
fn show_overlay(window: &tauri::WebviewWindow, click_through: bool) {
    let _ = window.set_always_on_top(true);
    set_overlay_alpha(window, 255);
    // Restore the user's click-through preference now that the overlay is live.
    let _ = window.set_ignore_cursor_events(click_through);
}

/// Hides the overlay and makes it click-through so it can't block the app you tabbed to.
fn hide_overlay(window: &tauri::WebviewWindow) {
    set_overlay_alpha(window, 0);
    let _ = window.set_ignore_cursor_events(true);
}

/// Public entry point used by the manual show/hide command (the toggle-overlay
/// hotkey and tray menu) so it shares the exact same alpha + click-through path
/// as the automatic game-focus watcher.
pub fn apply_overlay_visibility(window: &tauri::WebviewWindow, visible: bool, click_through: bool) {
    if visible {
        show_overlay(window, click_through);
    } else {
        hide_overlay(window);
    }
}

/// Reads the user's configured click-through preference (defaults to false).
fn current_click_through(app: &AppHandle) -> bool {
    app.try_state::<AppState>()
        .and_then(|s| s.config.lock().ok().map(|c| c.click_through))
        .unwrap_or(false)
}

/// Spawns the background watcher thread. Cheap: one `GetForegroundWindow` poll
/// every ~700ms with a short `OpenProcess`/`QueryFullProcessImageNameW` lookup.
pub fn start_game_detection(app: AppHandle) {
    thread::spawn(move || {
        let our_pid = std::process::id();
        // None = no decision emitted yet this session.
        let mut last_focused: Option<bool> = None;
        let mut ever_seen = false;
        // Whether the watcher is currently responsible for the overlay being hidden.
        let mut we_hid = false;

        loop {
            // Re-read config each tick so enabling/disabling takes effect live.
            let (enabled, auto_hide, process_names, poll_ms) = match app.try_state::<AppState>() {
                Some(state) => match state.config.lock() {
                    Ok(cfg) => {
                        let gd = cfg.game_detection.clone().unwrap_or_default();
                        (
                            gd.enabled,
                            gd.auto_hide,
                            gd.process_names,
                            gd.poll_interval_ms,
                        )
                    }
                    Err(_) => (false, false, Vec::new(), 700),
                },
                None => (false, false, Vec::new(), 700),
            };
            let sleep_ms = u64::from(poll_ms.clamp(200, 5000));

            // Feature off (or auto-hide off): make sure we never leave the overlay
            // stuck hidden, then idle until it's turned back on.
            if !enabled || !auto_hide {
                if we_hid {
                    if let Some(win) = overlay_window(&app) {
                        show_overlay(&win, current_click_through(&app));
                    }
                    we_hid = false;
                }
                last_focused = None;
                thread::sleep(Duration::from_millis(sleep_ms));
                continue;
            }

            let foreground = foreground_process();
            let (decision, process_name): (Option<bool>, Option<String>) = match &foreground {
                Some((pid, exe)) => {
                    if process_names.iter().any(|n| n.eq_ignore_ascii_case(exe)) {
                        ever_seen = true;
                        (Some(true), Some(exe.clone()))
                    } else if *pid == our_pid {
                        // Our own settings/overlay window is focused: stay as-is.
                        (last_focused, Some(exe.clone()))
                    } else if ever_seen {
                        // A different real app is focused after we've seen the game.
                        (Some(false), Some(exe.clone()))
                    } else {
                        // Never seen the game yet — keep the overlay visible so the
                        // user isn't greeted by a blank screen before they launch.
                        (last_focused, Some(exe.clone()))
                    }
                }
                None => (last_focused, None),
            };

            if let Some(focused) = decision {
                if last_focused != Some(focused) {
                    last_focused = Some(focused);

                    if let Some(win) = overlay_window(&app) {
                        if focused {
                            show_overlay(&win, current_click_through(&app));
                            we_hid = false;
                        } else {
                            hide_overlay(&win);
                            we_hid = true;
                        }
                    }

                    if let Some(state) = app.try_state::<AppState>() {
                        if let Ok(mut rt) = state.game_detection.lock() {
                            rt.focused = focused;
                            rt.ever_seen = ever_seen;
                        }
                    }

                    let _ = app.emit(
                        GAME_FOCUS_EVENT,
                        GameFocusPayload {
                            focused,
                            process_name: process_name.clone(),
                            ever_seen,
                        },
                    );
                }
            }

            thread::sleep(Duration::from_millis(sleep_ms));
        }
    });
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_basename_extraction_matches_game() {
        // Simulate what foreground_process() builds from a full image path.
        let full = "C:\\Program Files\\Age of Empires IV\\RelicCardinal.exe";
        let basename = full
            .rsplit(|c| c == '\\' || c == '/')
            .next()
            .unwrap()
            .to_string();
        assert_eq!(basename, "RelicCardinal.exe");
        assert!(basename.eq_ignore_ascii_case("reliccardinal.exe"));
    }

    #[test]
    fn test_basename_extraction_unix_separator() {
        let full = "/mnt/games/RelicCardinal.exe";
        let basename = full
            .rsplit(|c| c == '\\' || c == '/')
            .next()
            .unwrap()
            .to_string();
        assert_eq!(basename, "RelicCardinal.exe");
    }
}
