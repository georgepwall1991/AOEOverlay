use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager, Runtime,
};

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
                    if let Some(window) = app.get_webview_window("overlay") {
                        let _ = window.show();
                        let _ = window.set_always_on_top(true);
                    }
                    // Emit event to frontend to show overlay UI
                    if let Err(e) = app.emit("tray-show-overlay", ()) {
                        eprintln!("Failed to emit show overlay event: {}", e);
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("overlay") {
                        let _ = window.hide();
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
                if let Some(window) = app.get_webview_window("overlay") {
                    if window.is_visible().unwrap_or(true) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_always_on_top(true);
                    }
                }
                if let Err(e) = app.emit("tray-toggle-overlay", ()) {
                    eprintln!("Failed to emit toggle overlay event: {}", e);
                }
            }
        })
        .build(app)?;

    Ok(())
}
