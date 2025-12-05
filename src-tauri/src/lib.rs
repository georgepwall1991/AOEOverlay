use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
    menu::{Menu, MenuItem},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut, ShortcutState};

// Configuration types
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub overlay_opacity: f64,
    pub font_size: String,
    pub theme: String,
    pub hotkeys: HotkeyConfig,
    pub window_position: Option<WindowPosition>,
    pub click_through: bool,
    pub compact_mode: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HotkeyConfig {
    pub toggle_overlay: String,
    pub previous_step: String,
    pub next_step: String,
    pub cycle_build_order: String,
    pub toggle_click_through: String,
    pub toggle_compact: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            overlay_opacity: 0.8,
            font_size: "medium".to_string(),
            theme: "dark".to_string(),
            hotkeys: HotkeyConfig {
                toggle_overlay: "F1".to_string(),
                previous_step: "F2".to_string(),
                next_step: "F3".to_string(),
                cycle_build_order: "F4".to_string(),
                toggle_click_through: "F5".to_string(),
                toggle_compact: "F6".to_string(),
            },
            window_position: None,
            click_through: false,
            compact_mode: false,
        }
    }
}

// Build order types
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildOrder {
    pub id: String,
    pub name: String,
    pub civilization: String,
    pub description: String,
    pub difficulty: String,
    pub steps: Vec<BuildOrderStep>,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildOrderStep {
    pub id: String,
    pub description: String,
    pub timing: Option<String>,
    pub resources: Option<Resources>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Resources {
    pub food: Option<i32>,
    pub wood: Option<i32>,
    pub gold: Option<i32>,
    pub stone: Option<i32>,
}

// App state
struct AppState {
    config: Mutex<AppConfig>,
}

fn get_config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aoe4-overlay");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("config.json")
}

fn get_build_orders_dir() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aoe4-overlay")
        .join("build-orders");
    fs::create_dir_all(&config_dir).ok();
    config_dir
}

// Tauri commands
#[tauri::command]
fn get_config(state: tauri::State<AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[tauri::command]
fn save_config(config: AppConfig, state: tauri::State<AppState>) -> Result<(), String> {
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, json).map_err(|e| e.to_string())?;

    let mut current = state.config.lock().map_err(|e| e.to_string())?;
    *current = config;
    Ok(())
}

#[tauri::command]
fn get_build_orders() -> Result<Vec<BuildOrder>, String> {
    let dir = get_build_orders_dir();
    let mut orders = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if entry.path().extension().map_or(false, |e| e == "json") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if let Ok(order) = serde_json::from_str::<BuildOrder>(&content) {
                        orders.push(order);
                    }
                }
            }
        }
    }

    Ok(orders)
}

#[tauri::command]
fn save_build_order(order: BuildOrder) -> Result<(), String> {
    let dir = get_build_orders_dir();
    let path = dir.join(format!("{}.json", order.id));
    let json = serde_json::to_string_pretty(&order).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_build_order(id: String) -> Result<(), String> {
    let dir = get_build_orders_dir();
    let path = dir.join(format!("{}.json", id));
    fs::remove_file(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_window_position(window: tauri::Window) -> Result<WindowPosition, String> {
    let position = window.outer_position().map_err(|e| e.to_string())?;
    Ok(WindowPosition {
        x: position.x,
        y: position.y,
    })
}

#[tauri::command]
fn set_window_position(window: tauri::Window, x: i32, y: i32) -> Result<(), String> {
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        if window.is_visible().unwrap_or(false) {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn show_settings(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_click_through(window: tauri::Window, enabled: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_click_through(app: tauri::AppHandle, state: tauri::State<AppState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.click_through = !config.click_through;
    let new_state = config.click_through;

    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(new_state).map_err(|e| e.to_string())?;
    }

    // Save to file
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    fs::write(&config_path, json).map_err(|e| e.to_string())?;

    Ok(new_state)
}

#[tauri::command]
fn toggle_compact_mode(state: tauri::State<AppState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.compact_mode = !config.compact_mode;
    let new_state = config.compact_mode;

    // Save to file
    let config_path = get_config_path();
    let json = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    fs::write(&config_path, json).map_err(|e| e.to_string())?;

    Ok(new_state)
}

fn load_config() -> AppConfig {
    let config_path = get_config_path();
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str(&content) {
                return config;
            }
        }
    }
    AppConfig::default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = load_config();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState {
            config: Mutex::new(config),
        })
        .setup(|app| {
            // Setup system tray
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
                            if let Some(window) = app.get_webview_window("overlay") {
                                let _ = window.show();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("overlay") {
                                let _ = window.hide();
                            }
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("settings") {
                                let _ = window.show();
                                let _ = window.set_focus();
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
                        if let Some(window) = app.get_webview_window("overlay") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Setup global hotkeys
            let app_handle = app.handle().clone();

            // F1 - Toggle Overlay
            let toggle_shortcut = Shortcut::new(None, Code::F1);
            app.global_shortcut().on_shortcut(toggle_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app_handle.emit("hotkey-toggle-overlay", ());
                    if let Some(window) = app_handle.get_webview_window("overlay") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                        }
                    }
                }
            })?;

            // F2 - Previous Step
            let app_handle = app.handle().clone();
            let prev_shortcut = Shortcut::new(None, Code::F2);
            app.global_shortcut().on_shortcut(prev_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app_handle.emit("hotkey-previous-step", ());
                }
            })?;

            // F3 - Next Step
            let app_handle = app.handle().clone();
            let next_shortcut = Shortcut::new(None, Code::F3);
            app.global_shortcut().on_shortcut(next_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app_handle.emit("hotkey-next-step", ());
                }
            })?;

            // F4 - Cycle Build Order
            let app_handle = app.handle().clone();
            let cycle_shortcut = Shortcut::new(None, Code::F4);
            app.global_shortcut().on_shortcut(cycle_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app_handle.emit("hotkey-cycle-build-order", ());
                }
            })?;

            // F5 - Toggle Click-Through
            let app_handle = app.handle().clone();
            let click_through_shortcut = Shortcut::new(None, Code::F5);
            app.global_shortcut().on_shortcut(click_through_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app_handle.emit("hotkey-toggle-click-through", ());
                }
            })?;

            // F6 - Toggle Compact Mode
            let app_handle = app.handle().clone();
            let compact_shortcut = Shortcut::new(None, Code::F6);
            app.global_shortcut().on_shortcut(compact_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = app_handle.emit("hotkey-toggle-compact", ());
                }
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            get_build_orders,
            save_build_order,
            delete_build_order,
            get_window_position,
            set_window_position,
            toggle_overlay,
            show_settings,
            set_click_through,
            toggle_click_through,
            toggle_compact_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
