use std::sync::Mutex;

mod commands;
mod config;
mod hotkeys;
mod state;
mod tray;
mod tts;

use config::{load_config, load_build_orders};
use state::AppState;

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
            if let Err(e) = tray::setup_tray(app) {
                eprintln!("Failed to setup tray: {}", e);
            }

            // Setup global hotkeys from config
            if let Err(e) = hotkeys::register_hotkeys(app.handle()) {
                eprintln!("Failed to register hotkeys: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::reload_hotkeys,
            commands::get_build_orders,
            commands::save_build_order,
            commands::delete_build_order,
            commands::get_window_position,
            commands::set_window_position,
            commands::get_window_size,
            commands::set_window_size,
            commands::toggle_overlay,
            commands::show_settings,
            commands::set_click_through,
            commands::toggle_click_through,
            commands::toggle_compact_mode,
            commands::import_build_order,
            commands::export_build_order,
            tts::speak,
            tts::tts_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}