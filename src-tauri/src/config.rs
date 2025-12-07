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

    // Edge case tests for validate_build_order_id
    #[test]
    fn test_validate_build_order_id_exact_max_length() {
        let exact_max = "a".repeat(64);
        assert!(validate_build_order_id(&exact_max).is_ok());
    }

    #[test]
    fn test_validate_build_order_id_single_char() {
        assert!(validate_build_order_id("a").is_ok());
        assert!(validate_build_order_id("1").is_ok());
        assert!(validate_build_order_id("-").is_ok());
        assert!(validate_build_order_id("_").is_ok());
    }

    #[test]
    fn test_validate_build_order_id_special_chars_rejected() {
        assert!(validate_build_order_id("test@id").is_err());
        assert!(validate_build_order_id("test#id").is_err());
        assert!(validate_build_order_id("test.id").is_err());
        assert!(validate_build_order_id("test/id").is_err());
        assert!(validate_build_order_id("test\\id").is_err());
        assert!(validate_build_order_id("test:id").is_err());
    }

    #[test]
    fn test_validate_build_order_id_unicode_rejected() {
        assert!(validate_build_order_id("テスト").is_err());
        assert!(validate_build_order_id("test-émoji").is_err());
        assert!(validate_build_order_id("test🎮").is_err());
    }

    #[test]
    fn test_validate_build_order_id_whitespace() {
        assert!(validate_build_order_id(" ").is_err());
        assert!(validate_build_order_id("\t").is_err());
        assert!(validate_build_order_id("\n").is_err());
        assert!(validate_build_order_id("test id").is_err());
        assert!(validate_build_order_id(" test").is_err());
        assert!(validate_build_order_id("test ").is_err());
    }

    #[test]
    fn test_validate_build_order_id_mixed_case() {
        assert!(validate_build_order_id("TestID").is_ok());
        assert!(validate_build_order_id("ALLCAPS").is_ok());
        assert!(validate_build_order_id("alllower").is_ok());
        assert!(validate_build_order_id("Mixed-Case_123").is_ok());
    }

    // Helper to create a minimal valid build order
    fn create_valid_build_order() -> BuildOrder {
        BuildOrder {
            id: "test-order".to_string(),
            name: "Test Order".to_string(),
            civilization: "English".to_string(),
            description: "A test build order".to_string(),
            difficulty: "Easy".to_string(),
            steps: vec![BuildOrderStep {
                id: "step-1".to_string(),
                description: "First step".to_string(),
                timing: Some("0:00".to_string()),
                resources: None,
            }],
            enabled: true,
            pinned: false,
            favorite: false,
            branches: None,
        }
    }

    #[test]
    fn test_validate_build_order_valid() {
        let order = create_valid_build_order();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_empty_steps() {
        let mut order = create_valid_build_order();
        order.steps = vec![];
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("at least one step"));
    }

    #[test]
    fn test_validate_build_order_max_steps() {
        let mut order = create_valid_build_order();
        order.steps = (0..MAX_BUILD_ORDER_STEPS)
            .map(|i| BuildOrderStep {
                id: format!("step-{}", i),
                description: format!("Step {}", i),
                timing: None,
                resources: None,
            })
            .collect();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_exceeds_max_steps() {
        let mut order = create_valid_build_order();
        order.steps = (0..=MAX_BUILD_ORDER_STEPS)
            .map(|i| BuildOrderStep {
                id: format!("step-{}", i),
                description: format!("Step {}", i),
                timing: None,
                resources: None,
            })
            .collect();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds maximum"));
    }

    #[test]
    fn test_validate_build_order_step_empty_id() {
        let mut order = create_valid_build_order();
        order.steps[0].id = "".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing an id"));
    }

    #[test]
    fn test_validate_build_order_step_whitespace_id() {
        let mut order = create_valid_build_order();
        order.steps[0].id = "   ".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing an id"));
    }

    #[test]
    fn test_validate_build_order_step_empty_description() {
        let mut order = create_valid_build_order();
        order.steps[0].description = "".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing a description"));
    }

    #[test]
    fn test_validate_build_order_step_whitespace_description() {
        let mut order = create_valid_build_order();
        order.steps[0].description = "\t\n".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing a description"));
    }

    #[test]
    fn test_validate_build_order_invalid_id() {
        let mut order = create_valid_build_order();
        order.id = "invalid id with spaces".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("only contain letters"));
    }

    #[test]
    fn test_validate_build_order_with_branches() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Branch One".to_string(),
            trigger: Some("Age up".to_string()),
            start_step_index: 0,
            steps: vec![BuildOrderStep {
                id: "branch-step-1".to_string(),
                description: "Branch step".to_string(),
                timing: None,
                resources: None,
            }],
        }]);
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_branch_exceeds_max_steps() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Big Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: (0..=MAX_BUILD_ORDER_STEPS)
                .map(|i| BuildOrderStep {
                    id: format!("step-{}", i),
                    description: format!("Step {}", i),
                    timing: None,
                    resources: None,
                })
                .collect(),
        }]);
        let result = validate_build_order(&order);
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Branch"));
        assert!(err_msg.contains("exceeds maximum"));
    }

    #[test]
    fn test_validate_build_order_branch_empty_step_id() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Test Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: vec![BuildOrderStep {
                id: "".to_string(),
                description: "Valid description".to_string(),
                timing: None,
                resources: None,
            }],
        }]);
        let result = validate_build_order(&order);
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Branch"));
        assert!(err_msg.contains("missing an id"));
    }

    #[test]
    fn test_validate_build_order_branch_empty_step_description() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Test Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: vec![BuildOrderStep {
                id: "valid-id".to_string(),
                description: "".to_string(),
                timing: None,
                resources: None,
            }],
        }]);
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing a description"));
    }

    #[test]
    fn test_validate_build_order_multiple_branches() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![
            BuildOrderBranch {
                id: "branch-1".to_string(),
                name: "Branch One".to_string(),
                trigger: Some("Feudal".to_string()),
                start_step_index: 0,
                steps: vec![BuildOrderStep {
                    id: "b1-step".to_string(),
                    description: "Branch 1 step".to_string(),
                    timing: None,
                    resources: None,
                }],
            },
            BuildOrderBranch {
                id: "branch-2".to_string(),
                name: "Branch Two".to_string(),
                trigger: Some("Castle".to_string()),
                start_step_index: 5,
                steps: vec![BuildOrderStep {
                    id: "b2-step".to_string(),
                    description: "Branch 2 step".to_string(),
                    timing: None,
                    resources: None,
                }],
            },
        ]);
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_empty_branches_vec() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![]);
        assert!(validate_build_order(&order).is_ok());
    }

    // Tests for default functions
    #[test]
    fn test_default_toggle_pause() {
        assert_eq!(default_toggle_pause(), "F8");
    }

    #[test]
    fn test_default_ui_scale() {
        assert_eq!(default_ui_scale(), 1.0);
    }

    #[test]
    fn test_default_overlay_preset() {
        assert_eq!(default_overlay_preset(), "info_dense");
    }

    #[test]
    fn test_default_branch_start() {
        assert_eq!(default_branch_start(), 0);
    }

    // Tests for Default implementations
    #[test]
    fn test_reminder_config_default() {
        let config = ReminderConfig::default();
        assert!(!config.enabled);
        assert!(config.villager_queue.enabled);
        assert_eq!(config.villager_queue.interval_seconds, 25);
        assert!(config.scout.enabled);
        assert_eq!(config.scout.interval_seconds, 45);
        assert!(config.houses.enabled);
        assert_eq!(config.houses.interval_seconds, 40);
        assert!(config.military.enabled);
        assert_eq!(config.military.interval_seconds, 60);
        assert!(config.map_control.enabled);
        assert_eq!(config.map_control.interval_seconds, 90);
        assert!(!config.macro_check.enabled);
        assert_eq!(config.macro_check.interval_seconds, 20);
        assert!(config.sacred_sites.enabled);
    }

    #[test]
    fn test_upgrade_badges_config_default() {
        let config = UpgradeBadgesConfig::default();
        assert!(config.enabled);
        assert!(config.badges.is_empty());
    }

    #[test]
    fn test_app_config_default_telemetry() {
        let config = AppConfig::default();
        let telemetry = config.telemetry.unwrap();
        assert!(!telemetry.enabled);
        assert!(telemetry.capture_actions);
        assert!(telemetry.capture_hotkeys);
        assert_eq!(telemetry.max_events, 200);
    }

    #[test]
    fn test_app_config_default_hotkeys() {
        let config = AppConfig::default();
        assert_eq!(config.hotkeys.toggle_overlay, "F1");
        assert_eq!(config.hotkeys.previous_step, "F2");
        assert_eq!(config.hotkeys.next_step, "F3");
        assert_eq!(config.hotkeys.cycle_build_order, "F4");
        assert_eq!(config.hotkeys.toggle_click_through, "F5");
        assert_eq!(config.hotkeys.toggle_compact, "F6");
        assert_eq!(config.hotkeys.reset_build_order, "F7");
        assert_eq!(config.hotkeys.toggle_pause, "F8");
    }

    #[test]
    fn test_app_config_default_auto_advance() {
        let config = AppConfig::default();
        assert!(!config.auto_advance.enabled);
        assert_eq!(config.auto_advance.delay_seconds, 0);
    }

    #[test]
    fn test_app_config_default_window() {
        let config = AppConfig::default();
        assert!(config.window_position.is_none());
        assert!(config.window_size.is_none());
    }

    #[test]
    fn test_app_config_default_filters() {
        let config = AppConfig::default();
        assert!(config.filter_civilization.is_none());
        assert!(config.filter_difficulty.is_none());
    }

    // Test MAX_BUILD_ORDER_STEPS constant
    #[test]
    fn test_max_build_order_steps_constant() {
        assert_eq!(MAX_BUILD_ORDER_STEPS, 200);
    }
}
