use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{ErrorKind, Write};
use std::path::PathBuf;

pub const MAX_BUILD_ORDER_STEPS: usize = 200;

// Configuration types
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub overlay_opacity: f64,
    #[serde(default = "default_ui_scale")]
    pub ui_scale: f64,
    pub font_size: String,
    pub theme: String,
    #[serde(default = "default_overlay_preset")]
    pub overlay_preset: String,
    pub hotkeys: HotkeyConfig,
    pub window_position: Option<WindowPosition>,
    pub window_size: Option<WindowSize>,
    pub click_through: bool,
    pub compact_mode: bool,
    #[serde(default)]
    pub coach_only_mode: bool,
    pub auto_advance: AutoAdvanceConfig,
    pub filter_civilization: Option<String>,
    pub filter_difficulty: Option<String>,
    #[serde(default)]
    pub overlay_position: String,
    #[serde(default)]
    pub floating_style: bool,
    #[serde(default)]
    pub voice: Option<VoiceConfig>,
    #[serde(default)]
    pub reminders: Option<ReminderConfig>,
    #[serde(default, rename = "upgradeBadges")]
    pub upgrade_badges: Option<UpgradeBadgesConfig>,
    #[serde(default, rename = "timerDrift")]
    pub timer_drift: Option<TimerDriftConfig>,
    #[serde(default)]
    pub telemetry: Option<TelemetryConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HotkeyConfig {
    pub toggle_overlay: String,
    pub previous_step: String,
    pub next_step: String,
    pub cycle_build_order: String,
    pub toggle_click_through: String,
    pub toggle_compact: String,
    pub reset_build_order: String,
    #[serde(default = "default_toggle_pause")]
    pub toggle_pause: String,
}

fn default_toggle_pause() -> String {
    "F8".to_string()
}

fn default_ui_scale() -> f64 {
    1.0
}

fn default_overlay_preset() -> String {
    "info_dense".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AutoAdvanceConfig {
    pub enabled: bool,
    pub delay_seconds: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VoiceConfig {
    pub enabled: bool,
    pub rate: f32,
    pub speak_steps: bool,
    pub speak_reminders: bool,
    pub speak_delta: bool,
}

impl Default for VoiceConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            rate: 1.0,
            speak_steps: true,
            speak_reminders: true,
            speak_delta: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReminderItemConfig {
    pub enabled: bool,
    pub interval_seconds: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SacredSitesConfig {
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReminderConfig {
    pub enabled: bool,
    pub villager_queue: ReminderItemConfig,
    pub scout: ReminderItemConfig,
    pub houses: ReminderItemConfig,
    pub military: ReminderItemConfig,
    pub map_control: ReminderItemConfig,
    #[serde(default = "default_macro_check")]
    pub macro_check: ReminderItemConfig,
    #[serde(default = "default_sacred_sites")]
    pub sacred_sites: SacredSitesConfig,
}

fn default_macro_check() -> ReminderItemConfig {
    ReminderItemConfig { enabled: false, interval_seconds: 20 }
}

fn default_sacred_sites() -> SacredSitesConfig {
    SacredSitesConfig { enabled: true }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpgradeBadgeConfig {
    pub id: String,
    pub name: String,
    pub short_name: String,
    pub trigger_seconds: u32,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpgradeBadgesConfig {
    pub enabled: bool,
    pub badges: Vec<UpgradeBadgeConfig>,
}

impl Default for UpgradeBadgesConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            badges: Vec::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TimerDriftConfig {
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryConfig {
    pub enabled: bool,
    pub capture_hotkeys: bool,
    pub capture_actions: bool,
    pub max_events: u32,
}

impl Default for ReminderConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            villager_queue: ReminderItemConfig { enabled: true, interval_seconds: 25 },
            scout: ReminderItemConfig { enabled: true, interval_seconds: 45 },
            houses: ReminderItemConfig { enabled: true, interval_seconds: 40 },
            military: ReminderItemConfig { enabled: true, interval_seconds: 60 },
            map_control: ReminderItemConfig { enabled: true, interval_seconds: 90 },
            macro_check: ReminderItemConfig { enabled: false, interval_seconds: 20 },
            sacred_sites: SacredSitesConfig { enabled: true },
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            overlay_opacity: 0.8,
            ui_scale: default_ui_scale(),
            font_size: "medium".to_string(),
            theme: "dark".to_string(),
            overlay_preset: default_overlay_preset(),
            hotkeys: HotkeyConfig {
                toggle_overlay: "F1".to_string(),
                previous_step: "F2".to_string(),
                next_step: "F3".to_string(),
                cycle_build_order: "F4".to_string(),
                toggle_click_through: "F5".to_string(),
                toggle_compact: "F6".to_string(),
                reset_build_order: "F7".to_string(),
                toggle_pause: "F8".to_string(),
            },
            window_position: None,
            window_size: None,
            click_through: true,
            compact_mode: false,
            coach_only_mode: false,
            auto_advance: AutoAdvanceConfig {
                enabled: false,
                delay_seconds: 0,
            },
            filter_civilization: None,
            filter_difficulty: None,
            overlay_position: "top-right".to_string(),
            floating_style: true,
            voice: Some(VoiceConfig::default()),
            reminders: Some(ReminderConfig::default()),
            upgrade_badges: Some(UpgradeBadgesConfig::default()),
            timer_drift: Some(TimerDriftConfig { enabled: true }),
            telemetry: Some(TelemetryConfig {
                enabled: false,
                capture_actions: true,
                capture_hotkeys: true,
                max_events: 200,
            }),
        }
    }
}

// Build order types
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuildOrderBranch {
    pub id: String,
    pub name: String,
    pub trigger: Option<String>,
    #[serde(default = "default_branch_start")]
    pub start_step_index: u32,
    pub steps: Vec<BuildOrderStep>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildOrder {
    pub id: String,
    pub name: String,
    pub civilization: String,
    pub description: String,
    pub difficulty: String,
    pub steps: Vec<BuildOrderStep>,
    pub enabled: bool,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub favorite: bool,
    #[serde(default)]
    pub branches: Option<Vec<BuildOrderBranch>>,
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

pub fn validate_build_order_id(id: &str) -> Result<(), String> {
    const MAX_ID_LEN: usize = 64;
    if id.is_empty() {
        return Err("Build order id is required".to_string());
    }
    if id.len() > MAX_ID_LEN {
        return Err(format!(
            "Build order id exceeds max length of {} characters",
            MAX_ID_LEN
        ));
    }
    if !id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Build order id may only contain letters, numbers, '-' or '_'".to_string());
    }
    Ok(())
}

pub fn validate_build_order(order: &BuildOrder) -> Result<(), String> {
    validate_build_order_id(&order.id)?;

    let step_count = order.steps.len();
    if step_count == 0 {
        return Err("Build order must contain at least one step".to_string());
    }
    if step_count > MAX_BUILD_ORDER_STEPS {
        return Err(format!(
            "Build order exceeds maximum of {} steps (has {})",
            MAX_BUILD_ORDER_STEPS, step_count
        ));
    }

    for (idx, step) in order.steps.iter().enumerate() {
        if step.id.trim().is_empty() {
            return Err(format!("Step {} is missing an id", idx + 1));
        }
        if step.description.trim().is_empty() {
            return Err(format!("Step {} is missing a description", idx + 1));
        }
    }

    if let Some(branches) = &order.branches {
        for branch in branches {
            if branch.steps.len() > MAX_BUILD_ORDER_STEPS {
                return Err(format!(
                    "Branch \"{}\" exceeds maximum of {} steps (has {})",
                    branch.name,
                    MAX_BUILD_ORDER_STEPS,
                    branch.steps.len()
                ));
            }
            for (idx, step) in branch.steps.iter().enumerate() {
                if step.id.trim().is_empty() {
                    return Err(format!("Branch {} step {} is missing an id", branch.name, idx + 1));
                }
                if step.description.trim().is_empty() {
                    return Err(format!("Branch {} step {} is missing a description", branch.name, idx + 1));
                }
            }
        }
    }

    Ok(())
}

fn default_branch_start() -> u32 {
    0
}

pub fn get_config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aoe4-overlay");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("config.json")
}

pub fn get_build_orders_dir() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aoe4-overlay")
        .join("build-orders");
    fs::create_dir_all(&config_dir).ok();
    config_dir
}

pub fn load_config() -> AppConfig {
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

pub fn atomic_write<P: AsRef<std::path::Path>, C: AsRef<[u8]>>(path: P, content: C) -> std::io::Result<()> {
    let path = path.as_ref();
    // Create a temp file in the same directory to ensure we can rename it (atomic move)
    let tmp_path = path.with_extension("tmp");
    
    {
        let mut file = fs::File::create(&tmp_path)?;
        file.write_all(content.as_ref())?;
        file.sync_all()?; // Ensure data is on disk
    }

    // On Windows, rename fails if the destination exists; remove it first.
    let rename_result = fs::rename(&tmp_path, path);
    if rename_result.is_ok() {
        return Ok(());
    }

    let err = rename_result.unwrap_err();
    if cfg!(target_os = "windows") && (err.kind() == ErrorKind::AlreadyExists || err.kind() == ErrorKind::PermissionDenied) {
        // Best-effort cleanup before retry
        if path.exists() {
            fs::remove_file(path)?;
        }
        fs::rename(&tmp_path, path)?;
        return Ok(());
    }

    // Cleanup temp file on failure
    let _ = fs::remove_file(&tmp_path);
    Err(err)
}

pub fn load_build_orders() -> Vec<BuildOrder> {
    let dir = get_build_orders_dir();
    let mut orders = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if entry.path().extension().is_some_and(|e| e == "json") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    match serde_json::from_str::<BuildOrder>(&content) {
                        Ok(order) => {
                            if let Err(err) = validate_build_order(&order) {
                                eprintln!(
                                    "Skipping invalid build order {:?}: {}",
                                    entry.path(),
                                    err
                                );
                                continue;
                            }
                            orders.push(order);
                        }
                        Err(err) => {
                            eprintln!("Skipping invalid build order {:?}: {}", entry.path(), err);
                        }
                    };
                }
            }
        }
    }
    orders
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.overlay_opacity, 0.8);
        assert_eq!(config.font_size, "medium");
        assert_eq!(config.theme, "dark");
        assert!(config.click_through); // Default is now true
        assert!(!config.compact_mode);
        assert_eq!(config.hotkeys.toggle_overlay, "F1");
    }

    #[test]
    fn test_voice_config_default() {
        let voice = VoiceConfig::default();
        assert!(voice.enabled); // Default is now true
        assert_eq!(voice.rate, 1.0);
        assert!(voice.speak_steps);
    }

    #[test]
    fn test_validate_build_order_id() {
        assert!(validate_build_order_id("valid-id_123").is_ok());
        assert!(validate_build_order_id("").is_err());
        assert!(validate_build_order_id("bad id").is_err());
        let long_id = "a".repeat(65);
        assert!(validate_build_order_id(&long_id).is_err());
    }
}
