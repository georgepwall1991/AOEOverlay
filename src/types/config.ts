export interface HotkeyConfig {
  toggle_overlay: string;
  previous_step: string;
  next_step: string;
  cycle_build_order: string;
  toggle_click_through: string;
  toggle_compact: string;
  reset_build_order: string;
  toggle_pause: string;
  activate_branch_main: string;
  activate_branch_1: string;
  activate_branch_2: string;
  activate_branch_3: string;
  activate_branch_4: string;
  toggle_counters: string;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface AutoAdvanceConfig {
  enabled: boolean;
  delay_seconds: number; // Extra delay after timing before auto-advance
}

export interface VoiceConfig {
  enabled: boolean;
  rate: number; // 0.5 - 2.0 (1.0 = normal)
  speakSteps: boolean; // Read step descriptions aloud
  speakReminders: boolean; // Speak periodic reminders
  speakDelta: boolean; // Announce when behind pace
}

export interface ReminderItemConfig {
  enabled: boolean;
  intervalSeconds: number;
}

export interface ReminderConfig {
  enabled: boolean; // Master toggle
  villagerQueue: ReminderItemConfig;
  scout: ReminderItemConfig;
  houses: ReminderItemConfig;
  military: ReminderItemConfig;
  mapControl: ReminderItemConfig;
  macroCheck: ReminderItemConfig; // "Check your production" metronome
  sacredSites: { enabled: boolean }; // One-time alerts at 4:30 and 5:00
  matchupAlerts: { enabled: boolean }; // Proactive intel alerts from matchups
  calmMode?: {
    enabled: boolean;
    untilSeconds: number; // Delay non-critical reminders until this time
  };
}

// Upgrade badge that appears at a specific game time
export interface UpgradeBadgeConfig {
  id: string;
  name: string;
  shortName: string; // For compact display
  triggerSeconds: number; // Game time to show badge
  enabled: boolean;
}

export interface UpgradeBadgesConfig {
  enabled: boolean;
  badges: UpgradeBadgeConfig[];
}

export interface TimerDriftConfig {
  enabled: boolean; // Auto-adjust step timings when behind pace
}

export type OverlayPreset = "minimal" | "info_dense";

export interface TelemetryConfig {
  enabled: boolean;
  captureHotkeys: boolean;
  captureActions: boolean;
  maxEvents: number;
}

export interface MetronomeConfig {
  enabled: boolean;
  intervalSeconds: number;
  volume: number;
  coachLoop: boolean; // Cycle through core macro tasks (TC, minimap, etc.)
}

export interface CoachPackConfig {
  enabled: boolean;
  basePath: string; // Directory containing sound files
  files: {
    stepAdvance?: string;
    reminderVillager?: string;
    reminderScout?: string;
    reminderHouse?: string;
    behindPace?: string;
    ageUp?: string;
    metronomeTick?: string;
  };
}

export type OverlayPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom";

export interface AppConfig {
  overlay_opacity: number;
  ui_scale?: number;
  font_size: FontSize;
  theme: Theme;
  overlay_preset?: OverlayPreset;
  hotkeys: HotkeyConfig;
  window_position?: WindowPosition;
  window_size?: WindowSize;
  click_through: boolean;
  compact_mode: boolean;
  coach_only_mode?: boolean;
  auto_advance: AutoAdvanceConfig;
  filter_civilization?: string;
  filter_difficulty?: string;
  overlay_position: OverlayPosition;
  floating_style: boolean; // minimal background, floating look
  voice?: VoiceConfig;
  reminders?: ReminderConfig;
  upgradeBadges?: UpgradeBadgesConfig;
  timerDrift?: TimerDriftConfig;
  telemetry?: TelemetryConfig;
  metronome?: MetronomeConfig;
  coach_pack?: CoachPackConfig;
  show_clock?: boolean;
}

export type FontSize = "small" | "medium" | "large";
export type Theme = "dark" | "light" | "system";

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  enabled: true,
  rate: 1.0,
  speakSteps: true,
  speakReminders: true,
  speakDelta: true,
};

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: false,
  villagerQueue: { enabled: true, intervalSeconds: 25 },
  scout: { enabled: true, intervalSeconds: 45 },
  houses: { enabled: true, intervalSeconds: 40 },
  military: { enabled: true, intervalSeconds: 60 },
  mapControl: { enabled: true, intervalSeconds: 90 },
  macroCheck: { enabled: false, intervalSeconds: 20 }, // Pro-level macro cycle
  sacredSites: { enabled: true }, // Sacred site spawn alerts
  matchupAlerts: { enabled: true }, // Proactive intel alerts from matchups
  calmMode: { enabled: false, untilSeconds: 180 },
};

export const DEFAULT_UPGRADE_BADGES_CONFIG: UpgradeBadgesConfig = {
  enabled: true,
  badges: [
    { id: "wheelbarrow", name: "Wheelbarrow", shortName: "Wheel", triggerSeconds: 180, enabled: true }, // 3:00
    { id: "blacksmith_attack", name: "Blacksmith +1 Attack", shortName: "+1 Atk", triggerSeconds: 300, enabled: true }, // 5:00
    { id: "double_broadaxe", name: "Double Broadaxe", shortName: "Broadaxe", triggerSeconds: 360, enabled: true }, // 6:00
    { id: "textiles", name: "Textiles", shortName: "Textiles", triggerSeconds: 480, enabled: true }, // 8:00
  ],
};

export const DEFAULT_TIMER_DRIFT_CONFIG: TimerDriftConfig = {
  enabled: true, // Default to enabled - adjust timings when behind
};

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: false,
  captureHotkeys: true,
  captureActions: true,
  maxEvents: 200,
};

export const DEFAULT_METRONOME_CONFIG: MetronomeConfig = {
  enabled: false,
  intervalSeconds: 20,
  volume: 0.5,
  coachLoop: true,
};

export const DEFAULT_COACH_PACK_CONFIG: CoachPackConfig = {
  enabled: false,
  basePath: "",
  files: {},
};

export const DEFAULT_CONFIG: AppConfig = {
  overlay_opacity: 0.95,
  ui_scale: 1,
  font_size: "medium",
  theme: "dark",
  overlay_preset: "info_dense",
  hotkeys: {
    toggle_overlay: "F1",
    previous_step: "F2",
    next_step: "F3",
    cycle_build_order: "F4",
    toggle_click_through: "F5",
    toggle_compact: "F6",
    reset_build_order: "F7",
    toggle_pause: "F8",
    activate_branch_main: "Alt+0",
    activate_branch_1: "Alt+1",
    activate_branch_2: "Alt+2",
    activate_branch_3: "Alt+3",
    activate_branch_4: "Alt+4",
    toggle_counters: "TAB",
  },
  click_through: true,
  compact_mode: false, // Default to expanded mode (more info visible)
  coach_only_mode: false,
  auto_advance: {
    enabled: false,
    delay_seconds: 0,
  },
  overlay_position: "top-right",
  floating_style: true, // Default to floating/minimal style
  voice: DEFAULT_VOICE_CONFIG,
  reminders: DEFAULT_REMINDER_CONFIG,
  timerDrift: DEFAULT_TIMER_DRIFT_CONFIG,
  upgradeBadges: DEFAULT_UPGRADE_BADGES_CONFIG,
  telemetry: DEFAULT_TELEMETRY_CONFIG,
  metronome: DEFAULT_METRONOME_CONFIG,
  coach_pack: DEFAULT_COACH_PACK_CONFIG,
  show_clock: true,
};
