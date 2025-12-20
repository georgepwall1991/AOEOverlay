use crate::config::{WindowPosition, WindowSize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, Window};

#[tauri::command]
pub fn get_window_position(window: Window) -> Result<WindowPosition, String> {
    let position = window.outer_position().map_err(|e| e.to_string())?;
    Ok(WindowPosition {
        x: position.x,
        y: position.y,
    })
}

#[tauri::command]
pub fn set_window_position(window: Window, x: i32, y: i32) -> Result<(), String> {
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_window_position(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        // Force basic properties
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // Reset to default size
        window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: 500,
                height: 600,
            }))
            .map_err(|e| e.to_string())?;

        // Reset position
        window
            .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: 50,
                y: 50,
            }))
            .map_err(|e| e.to_string())?;

        // Force window state
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window
            .set_ignore_cursor_events(false)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_window_size(window: Window) -> Result<WindowSize, String> {
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(WindowSize {
        width: size.width,
        height: size.height,
    })
}

#[tauri::command]
pub fn set_window_size(window: Window, width: u32, height: u32) -> Result<(), String> {
    window
        .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn recreate_overlay_window(app: AppHandle) -> Result<(), String> {
    // 1. Close existing window if it exists
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.close();
    }

    // 2. Re-create the window with default settings
    // This matches the config in tauri.conf.json
    let url = if cfg!(debug_assertions) {
        WebviewUrl::External("http://localhost:1420/".parse().unwrap())
    } else {
        WebviewUrl::App("index.html".into())
    };

    let window = WebviewWindowBuilder::new(&app, "overlay", url)
        .title("AoE4 Overlay")
        .inner_size(500.0, 600.0)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .shadow(false) // Critical for Windows WebView2 transparency
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(false) // Start hidden to position first
        .build()
        .map_err(|e| e.to_string())?;

    // Position explicitly using PhysicalPosition for consistency across platforms
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: 50,
            y: 50,
        }))
        .map_err(|e| e.to_string())?;

    // Force verify visibility just in case
    window.show().map_err(|e| e.to_string())?;

    // Windows-specific: force alpha channel and focus for transparent windows
    #[cfg(target_os = "windows")]
    {
        crate::force_layered_alpha_opaque(&window);
        let _ = window.set_focus();
    }

    Ok(())
}

#[tauri::command]
pub fn show_settings(app: AppHandle) -> Result<(), String> {
    // Check if window already exists
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Window doesn't exist, create it
    // The app is a single-page bundle; load the SPA root for settings as well.
    let url = if cfg!(debug_assertions) {
        WebviewUrl::External("http://localhost:1420/".parse().unwrap())
    } else {
        WebviewUrl::App("index.html".into())
    };

    let window = WebviewWindowBuilder::new(&app, "settings", url)
        .title("AoE4 Overlay - Settings")
        .inner_size(800.0, 600.0)
        .resizable(true)
        .decorations(true)
        .transparent(false)
        .always_on_top(false)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}
