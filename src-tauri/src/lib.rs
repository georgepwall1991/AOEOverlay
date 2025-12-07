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
            get_window_size,
            set_window_size,
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