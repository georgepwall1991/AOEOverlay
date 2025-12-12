use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager, Runtime,
};

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{SetLayeredWindowAttributes, LWA_ALPHA};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;

#[cfg(target_os = "windows")]
fn force_layered_alpha_opaque<R: Runtime>(window: &tauri::WebviewWindow<R>) {
    // See src-tauri/src/lib.rs for context: transparent windows can occasionally end up fully invisible (alpha=0).
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let hwnd = HWND(hwnd.0 as *mut _);
            let _ = SetLayeredWindowAttributes(hwnd, windows::Win32::Foundation::COLORREF(0), 255, LWA_ALPHA);
        }
    }
}

pub fn setup_tray<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let show_i = MenuItem::with_id(app, "show", "Show Overlay", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "Hide Overlay", true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_i, &hide_i, &settings_i, &quit_i])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("AoE4 Overlay")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    // Ensure native overlay window is visible (Windows can start hidden/off-screen).
                    let window = app
                        .get_webview_window("overlay")
                        .or_else(|| app.get_webview_window("main"));
                    if let Some(window) = window {
                        // Proper sequencing: show → focus → always_on_top
                        let _ = window.unminimize();
                        if let Err(e) = window.show() {
                            eprintln!("[Tray] Failed to show overlay window: {}", e);
                        }

                        #[cfg(target_os = "windows")]
                        force_layered_alpha_opaque(&window);
                        
                        // Focus is critical on Windows for transparent overlay windows
                        #[cfg(target_os = "windows")]
                        {
                            if let Err(e) = window.set_focus() {
                                eprintln!("[Tray] Failed to focus overlay window: {}", e);
                            }
                        }
                        
                        if let Err(e) = window.set_always_on_top(true) {
                            eprintln!("[Tray] Failed to set overlay window always on top: {}", e);
                        }
                    } else {
                        eprintln!("[Tray] Overlay window not found (labels: overlay/main)");
                    }
                    // Emit event to frontend to show overlay UI
                    if let Err(e) = app.emit("tray-show-overlay", ()) {
                        eprintln!("Failed to emit show overlay event: {}", e);
                    }
                }
                "hide" => {
                    let window = app
                        .get_webview_window("overlay")
                        .or_else(|| app.get_webview_window("main"));
                    if let Some(window) = window {
                        let _ = window.hide();
                    } else {
                        eprintln!("[Tray] Overlay window not found for hide (labels: overlay/main)");
                    }
                    // Emit event to frontend to hide overlay UI
                    if let Err(e) = app.emit("tray-hide-overlay", ()) {
                        eprintln!("Failed to emit hide overlay event: {}", e);
                    }
                }
                "settings" => {
                    if let Some(window) = app.get_webview_window("settings") {
                        if let Err(e) = window.show() {
                            eprintln!("Failed to show settings: {}", e);
                        }
                        if let Err(e) = window.set_focus() {
                            eprintln!("Failed to focus settings: {}", e);
                        }
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                // Toggle native window visibility and keep frontend in sync.
                let window = app
                    .get_webview_window("overlay")
                    .or_else(|| app.get_webview_window("main"));
                if let Some(window) = window {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        // Proper sequencing: show → focus → always_on_top
                        let _ = window.unminimize();
                        if let Err(e) = window.show() {
                            eprintln!("[Tray] Failed to show overlay window (toggle): {}", e);
                        }

                        #[cfg(target_os = "windows")]
                        force_layered_alpha_opaque(&window);
                        
                        // Focus is critical on Windows for transparent overlay windows
                        #[cfg(target_os = "windows")]
                        {
                            if let Err(e) = window.set_focus() {
                                eprintln!("[Tray] Failed to focus overlay window (toggle): {}", e);
                            }
                        }
                        
                        if let Err(e) = window.set_always_on_top(true) {
                            eprintln!("[Tray] Failed to set overlay window always on top (toggle): {}", e);
                        }
                    }
                } else {
                    eprintln!("[Tray] Overlay window not found for toggle (labels: overlay/main)");
                }
                if let Err(e) = app.emit("tray-toggle-overlay", ()) {
                    eprintln!("Failed to emit toggle overlay event: {}", e);
                }
            }
        })
        .build(app)?;

    Ok(())
}
