//! Windows-specific overlay window setup and visibility fixes.
//!
//! On Windows, transparent Tauri windows can occasionally start invisible due to:
//! - WS_EX_LAYERED alpha set to 0
//! - Window ending up minimized
//! - WebView2 needing time to initialize
//!
//! This module provides workarounds for these issues.

use tauri::Manager;
use windows::Win32::Foundation::{COLORREF, HWND};
use windows::Win32::UI::WindowsAndMessaging::{SetLayeredWindowAttributes, LWA_ALPHA};

/// Forces the layered window alpha to 255 (fully opaque).
///
/// On some Windows setups, transparent Tauri windows can end up with WS_EX_LAYERED alpha = 0,
/// making the window fully invisible even though it's "visible" and not minimized.
/// Forcing alpha back to 255 fixes that while still allowing per-pixel transparency from the webview.
pub fn force_layered_alpha_opaque(window: &tauri::WebviewWindow) {
    match window.hwnd() {
        Ok(hwnd) => unsafe {
            let raw_hwnd = HWND(hwnd.0 as isize as *mut std::ffi::c_void);
            if cfg!(debug_assertions) {
                eprintln!(
                    "[Windows] Attempting SetLayeredWindowAttributes on HWND: {:?}",
                    hwnd.0
                );
            }
            if let Err(e) = SetLayeredWindowAttributes(raw_hwnd, COLORREF(0), 255, LWA_ALPHA) {
                eprintln!("[Windows] Failed to force layered alpha=255: {:?}", e);
                if cfg!(debug_assertions) {
                    eprintln!(
                        "[Windows] Window may not have WS_EX_LAYERED style - overlay might still work"
                    );
                }
            }
        },
        Err(e) => eprintln!("[Windows] Failed to get HWND for overlay window: {}", e),
    }
}

/// Gets the overlay window, checking both "overlay" and "main" labels.
///
/// Some Windows builds can report the main window label as "main" briefly/incorrectly.
fn get_overlay_window(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("overlay")
        .or_else(|| app.get_webview_window("main"))
}

/// Applies proper window state for overlay visibility.
///
/// Includes: unminimize, show, alpha fix, positioning, size check, focus, always-on-top.
fn apply_overlay_window_state(window: &tauri::WebviewWindow) {
    let debug = cfg!(debug_assertions);

    // Unminimize first (common cause for "invisible" window on Windows)
    if let Err(e) = window.unminimize() {
        eprintln!("[Windows] Failed to unminimize overlay window: {}", e);
    }

    // Proper sequencing: show → position → focus → always_on_top
    if let Err(e) = window.show() {
        eprintln!("[Windows] Failed to show overlay window: {}", e);
    }

    // Force alpha to 255 to fix invisible window issue
    force_layered_alpha_opaque(window);

    // If the window ended up tiny (e.g., from a bad restore), force a sane size
    match window.outer_size() {
        Ok(size) => {
            if debug {
                eprintln!(
                    "[Windows] Overlay window size: {}x{}",
                    size.width, size.height
                );
            }
            if size.width < 200 || size.height < 150 {
                if debug {
                    eprintln!(
                        "[Windows] Overlay window too small; resetting to 500x600 (was {}x{})",
                        size.width, size.height
                    );
                }
                if let Err(e) = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: 500,
                    height: 600,
                })) {
                    eprintln!("[Windows] Failed to resize overlay window: {}", e);
                }
            }
        }
        Err(e) => eprintln!("[Windows] Failed to query overlay window size: {}", e),
    }

    if debug {
        match window.outer_position() {
            Ok(pos) => eprintln!("[Windows] Overlay window position: {},{}", pos.x, pos.y),
            Err(e) => eprintln!("[Windows] Failed to query overlay window position: {}", e),
        }
    }

    // Focus is critical on Windows for transparent overlay windows
    if let Err(e) = window.set_focus() {
        eprintln!("[Windows] Failed to focus overlay window: {}", e);
    }

    if let Err(e) = window.set_always_on_top(true) {
        eprintln!("[Windows] Failed to set overlay window always on top: {}", e);
    }

    if debug {
        match window.is_visible() {
            Ok(v) => eprintln!("[Windows] Overlay window visible after apply: {}", v),
            Err(e) => eprintln!("[Windows] Failed to query overlay window visibility: {}", e),
        }
    }
}

/// Sets up the overlay window with Windows-specific visibility fixes.
///
/// This function:
/// 1. Applies initial window state fixes
/// 2. Spawns a background thread that retries at increasing intervals
///    (WebView2 can take several seconds to fully initialize on cold start)
pub fn setup_overlay_window(app_handle: tauri::AppHandle) {
    // Try to show the window immediately if it exists
    if let Some(window) = get_overlay_window(&app_handle) {
        apply_overlay_window_state(&window);
    } else {
        eprintln!(
            "[Windows] Overlay window not found at setup (labels: overlay/main); will retry"
        );
    }

    // WebView2 on Windows needs time to fully initialize before the content renders.
    // We apply window state multiple times at increasing intervals to ensure it sticks.
    let app_handle_delayed = app_handle.clone();
    std::thread::spawn(move || {
        use std::{thread, time::Duration};

        // Multiple retry attempts at increasing intervals
        // WebView2 can take several seconds to fully initialize on cold start
        let delays = [500, 1000, 2000, 3000, 5000, 7000, 10000];

        for (i, delay) in delays.iter().enumerate() {
            thread::sleep(Duration::from_millis(*delay));
            if cfg!(debug_assertions) {
                eprintln!("[Windows] Retry attempt {} after {}ms", i + 1, delay);
            }

            if let Some(window) = get_overlay_window(&app_handle_delayed) {
                // Re-apply visibility fixes
                let _ = window.unminimize();
                let _ = window.show();
                force_layered_alpha_opaque(&window);
                let _ = window.set_focus();
                let _ = window.set_always_on_top(true);

                if cfg!(debug_assertions) {
                    eprintln!("[Windows] Applied window state on retry {}", i + 1);
                }
            }
        }
    });
}
