use std::sync::Mutex;

mod commands;
mod config;
mod error;
mod hotkeys;
mod state;
mod tray;
mod tts;

use config::load_config;
use state::AppState;
use commands::*;
use hotkeys::register_hotkeys;
use config::load_build_orders;
use tray::setup_tray;
#[cfg(target_os = "windows")]
use tauri::Manager;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{SetLayeredWindowAttributes, LWA_ALPHA};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;

#[cfg(target_os = "windows")]
pub(crate) fn force_layered_alpha_opaque(window: &tauri::WebviewWindow) {
    // On some Windows setups, transparent Tauri windows can end up with WS_EX_LAYERED alpha = 0,
    // making the window fully invisible even though it's "visible" and not minimized.
    // Forcing alpha back to 255 (opaque) fixes that while still allowing per-pixel transparency from the webview.
    match window.hwnd() {
        Ok(hwnd) => unsafe {
            // LWA_ALPHA = 0x2; alpha=255 means "fully visible".
            let raw_hwnd = HWND(hwnd.0 as isize as *mut std::ffi::c_void);
            if cfg!(debug_assertions) {
                eprintln!("[Windows] Attempting SetLayeredWindowAttributes on HWND: {:?}", hwnd.0);
            }
            if let Err(e) = SetLayeredWindowAttributes(raw_hwnd, windows::Win32::Foundation::COLORREF(0), 255, LWA_ALPHA) {
                eprintln!(
                    "[Windows] Failed to force layered alpha=255: {:?}", e
                );
                // Try without COLORREF parameter (just alpha)
                if cfg!(debug_assertions) {
                    eprintln!("[Windows] Window may not have WS_EX_LAYERED style - overlay might still work");
                }
            }
        },
        Err(e) => eprintln!("[Windows] Failed to get HWND for overlay window: {}", e),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = load_config();
    let build_orders = load_build_orders();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState {
            config: Mutex::new(config),
            build_orders: Mutex::new(build_orders),
            tts_process: Mutex::new(None),
        })
        .setup(|app| {
            // Setup system tray
            setup_tray(app)?;

            // Setup global hotkeys from config
            if let Err(e) = register_hotkeys(app.handle()) {
                eprintln!("Failed to register hotkeys: {}", e);
            }

            // On Windows, the main transparent window can occasionally start hidden/invisible.
            // Force-show it with proper sequencing: show → position → focus → always_on_top
            #[cfg(target_os = "windows")]
            {
                let app_handle = app.handle().clone();

                // Some Windows builds can report the main window label as "main" briefly/incorrectly.
                // Treat both "overlay" and "main" as the overlay window label for native window ops.
                let get_overlay_window = |app: &tauri::AppHandle| {
                    app.get_webview_window("overlay")
                        .or_else(|| app.get_webview_window("main"))
                };

                let apply_overlay_window_state = |window: &tauri::WebviewWindow| {
                    let debug = cfg!(debug_assertions);
                    // Unminimize first (common cause for "invisible" window on Windows)
                    if let Err(e) = window.unminimize() {
                        eprintln!("[Windows] Failed to unminimize overlay window: {}", e);
                    }

                    // Proper sequencing: show → position → focus → always_on_top
                    if let Err(e) = window.show() {
                        eprintln!("[Windows] Failed to show overlay window: {}", e);
                    }

                    // Workaround: sometimes the window ends up fully invisible because its WS_EX_LAYERED alpha is 0.
                    // Forcing alpha back to 255 makes it visible again.
                    force_layered_alpha_opaque(window);

                    if let Err(e) = window.set_position(tauri::Position::Physical(
                        tauri::PhysicalPosition { x: 50, y: 50 },
                    )) {
                        eprintln!("[Windows] Failed to position overlay window: {}", e);
                    }

                    // If the window ended up tiny (e.g., from a bad restore), force a sane size.
                    match window.outer_size() {
                        Ok(size) => {
                            if debug {
                                eprintln!("[Windows] Overlay window size: {}x{}", size.width, size.height);
                            }
                            if size.width < 200 || size.height < 150 {
                                if debug {
                                    eprintln!(
                                        "[Windows] Overlay window too small; resetting to 500x600 (was {}x{})",
                                        size.width, size.height
                                    );
                                }
                                if let Err(e) = window.set_size(tauri::Size::Physical(
                                    tauri::PhysicalSize {
                                        width: 500,
                                        height: 600,
                                    },
                                )) {
                                    eprintln!("[Windows] Failed to resize overlay window: {}", e);
                                }
                            }
                        }
                        Err(e) => eprintln!("[Windows] Failed to query overlay window size: {}", e),
                    }

                    match window.outer_position() {
                        Ok(pos) => {
                            if debug {
                                eprintln!("[Windows] Overlay window position: {},{}", pos.x, pos.y)
                            }
                        }
                        Err(e) => eprintln!("[Windows] Failed to query overlay window position: {}", e),
                    }

                    // Focus is critical on Windows for transparent overlay windows
                    if let Err(e) = window.set_focus() {
                        eprintln!("[Windows] Failed to focus overlay window: {}", e);
                    }

                    if let Err(e) = window.set_always_on_top(true) {
                        eprintln!("[Windows] Failed to set overlay window always on top: {}", e);
                    }

                    match window.is_visible() {
                        Ok(v) => {
                            if debug {
                                eprintln!("[Windows] Overlay window visible after apply: {}", v)
                            }
                        }
                        Err(e) => eprintln!("[Windows] Failed to query overlay window visibility: {}", e),
                    }
                };

                // Try to show the window immediately if it exists
                if let Some(window) = get_overlay_window(&app_handle) {
                    apply_overlay_window_state(&window);
                } else {
                    eprintln!("[Windows] Overlay window not found at setup (labels: overlay/main); will retry");
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

                        let maybe_window = app_handle_delayed
                            .get_webview_window("overlay")
                            .or_else(|| app_handle_delayed.get_webview_window("main"));

                        if let Some(window) = maybe_window {
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            reload_hotkeys,
            get_build_orders,
            save_build_order,
            delete_build_order,
            get_window_position,
            set_window_position,
            reset_window_position,
            get_window_size,
            set_window_size,
            recreate_overlay_window,
            show_settings,
            set_click_through,
            toggle_click_through,
            toggle_compact_mode,
            import_build_order,
            export_build_order,
            tts::speak,
            tts::tts_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
