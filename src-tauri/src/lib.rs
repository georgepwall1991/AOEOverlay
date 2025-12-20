use std::sync::Mutex;

mod audio;
mod commands;
mod config;
mod error;
mod hotkeys;
mod platform;
mod state;
mod tray;
mod tts;
#[cfg(target_os = "windows")]
mod windows;

use commands::*;
use config::{load_build_orders, load_config};
use hotkeys::register_hotkeys;
use state::AppState;
use tray::setup_tray;

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

            // On Windows, apply visibility fixes for transparent overlay window
            #[cfg(target_os = "windows")]
            {
                windows::setup_overlay_window(app.handle().clone());
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
            audio::play_sound,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
