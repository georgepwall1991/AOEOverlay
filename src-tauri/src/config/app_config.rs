use serde::{Deserialize, Serialize};

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
    #[serde(default = "default_branch_main")]
    pub activate_branch_main: String,
    #[serde(default = "default_branch_1")]
    pub activate_branch_1: String,
    #[serde(default = "default_branch_2")]
    pub activate_branch_2: String,
    #[serde(default = "default_branch_3")]
    pub activate_branch_3: String,
    #[serde(default = "default_branch_4")]
    pub activate_branch_4: String,
    #[serde(default = "default_toggle_counters")]
    pub toggle_counters: String,
}

fn default_branch_main() -> String { "Alt+0".to_string() }
fn default_branch_1() -> String { "Alt+1".to_string() }
fn default_branch_2() -> String { "Alt+2".to_string() }
fn default_branch_3() -> String { "Alt+3".to_string() }
fn default_branch_4() -> String { "Alt+4".to_string() }

fn default_toggle_counters() -> String {
    "TAB".to_string()
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
pub struct MatchupAlertsConfig {
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
    #[serde(default = "default_matchup_alerts")]
    pub matchup_alerts: MatchupAlertsConfig,
}

fn default_macro_check() -> ReminderItemConfig {
    ReminderItemConfig { enabled: false, interval_seconds: 20 }
}

fn default_sacred_sites() -> SacredSitesConfig {
    SacredSitesConfig { enabled: true }
}

fn default_matchup_alerts() -> MatchupAlertsConfig {
    MatchupAlertsConfig { enabled: true }
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
            matchup_alerts: MatchupAlertsConfig { enabled: true },
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
                activate_branch_main: "Alt+0".to_string(),
                activate_branch_1: "Alt+1".to_string(),
                activate_branch_2: "Alt+2".to_string(),
                activate_branch_3: "Alt+3".to_string(),
                activate_branch_4: "Alt+4".to_string(),
                toggle_counters: "TAB".to_string(),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.overlay_opacity, 0.8);
        assert_eq!(config.font_size, "medium");
        assert_eq!(config.theme, "dark");
        assert!(config.click_through);
        assert!(!config.compact_mode);
        assert_eq!(config.hotkeys.toggle_overlay, "F1");
    }

    #[test]
    fn test_voice_config_default() {
        let voice = VoiceConfig::default();
        assert!(voice.enabled);
        assert_eq!(voice.rate, 1.0);
        assert!(voice.speak_steps);
    }

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
        assert!(config.matchup_alerts.enabled);
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
        assert_eq!(config.hotkeys.toggle_counters, "TAB");
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

    #[test]
    fn test_max_build_order_steps_constant() {
        assert_eq!(MAX_BUILD_ORDER_STEPS, 200);
    }

    #[test]
    fn test_window_position_creation() {
        let pos = WindowPosition { x: 100, y: 200 };
        assert_eq!(pos.x, 100);
        assert_eq!(pos.y, 200);
    }

    #[test]
    fn test_window_position_negative_coords() {
        let pos = WindowPosition { x: -500, y: -100 };
        assert_eq!(pos.x, -500);
        assert_eq!(pos.y, -100);
    }

    #[test]
    fn test_window_position_zero() {
        let pos = WindowPosition { x: 0, y: 0 };
        assert_eq!(pos.x, 0);
        assert_eq!(pos.y, 0);
    }

    #[test]
    fn test_window_size_creation() {
        let size = WindowSize { width: 800, height: 600 };
        assert_eq!(size.width, 800);
        assert_eq!(size.height, 600);
    }

    #[test]
    fn test_window_size_minimum() {
        let size = WindowSize { width: 1, height: 1 };
        assert_eq!(size.width, 1);
        assert_eq!(size.height, 1);
    }

    #[test]
    fn test_window_size_large() {
        let size = WindowSize { width: 3840, height: 2160 };
        assert_eq!(size.width, 3840);
        assert_eq!(size.height, 2160);
    }

    #[test]
    fn test_auto_advance_config() {
        let config = AutoAdvanceConfig {
            enabled: true,
            delay_seconds: 30,
        };
        assert!(config.enabled);
        assert_eq!(config.delay_seconds, 30);
    }

    #[test]
    fn test_auto_advance_config_zero_delay() {
        let config = AutoAdvanceConfig {
            enabled: true,
            delay_seconds: 0,
        };
        assert_eq!(config.delay_seconds, 0);
    }

    #[test]
    fn test_hotkey_config_all_fields() {
        let config = HotkeyConfig {
            toggle_overlay: "F1".to_string(),
            previous_step: "F2".to_string(),
            next_step: "F3".to_string(),
            cycle_build_order: "F4".to_string(),
            toggle_click_through: "F5".to_string(),
            toggle_compact: "F6".to_string(),
            reset_build_order: "F7".to_string(),
            toggle_pause: "F8".to_string(),
            activate_branch_main: "F9".to_string(),
            activate_branch_1: "1".to_string(),
            activate_branch_2: "2".to_string(),
            activate_branch_3: "3".to_string(),
            activate_branch_4: "4".to_string(),
            toggle_counters: "TAB".to_string(),
        };
        assert_eq!(config.toggle_overlay, "F1");
        assert_eq!(config.toggle_pause, "F8");
        assert_eq!(config.activate_branch_main, "F9");
        assert_eq!(config.toggle_counters, "TAB");
    }

    #[test]
    fn test_timer_drift_config() {
        let config = TimerDriftConfig { enabled: true };
        assert!(config.enabled);
    }

    #[test]
    fn test_telemetry_config_all_fields() {
        let config = TelemetryConfig {
            enabled: true,
            capture_hotkeys: true,
            capture_actions: false,
            max_events: 500,
        };
        assert!(config.enabled);
        assert!(config.capture_hotkeys);
        assert!(!config.capture_actions);
        assert_eq!(config.max_events, 500);
    }

    #[test]
    fn test_upgrade_badge_config() {
        let badge = UpgradeBadgeConfig {
            id: "wheelbarrow".to_string(),
            name: "Wheelbarrow".to_string(),
            short_name: "WB".to_string(),
            trigger_seconds: 120,
            enabled: true,
        };
        assert_eq!(badge.id, "wheelbarrow");
        assert_eq!(badge.trigger_seconds, 120);
    }

    #[test]
    fn test_reminder_item_config() {
        let item = ReminderItemConfig {
            enabled: true,
            interval_seconds: 30,
        };
        assert!(item.enabled);
        assert_eq!(item.interval_seconds, 30);
    }

    #[test]
    fn test_sacred_sites_config() {
        let config = SacredSitesConfig { enabled: true };
        assert!(config.enabled);
    }

    #[test]
    fn test_default_macro_check() {
        let config = default_macro_check();
        assert!(!config.enabled);
        assert_eq!(config.interval_seconds, 20);
    }

    #[test]
    fn test_default_sacred_sites() {
        let config = default_sacred_sites();
        assert!(config.enabled);
    }
}
