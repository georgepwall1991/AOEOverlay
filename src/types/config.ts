export interface HotkeyConfig {
  toggle_overlay: string;
  previous_step: string;
  next_step: string;
  cycle_build_order: string;
  toggle_click_through: string;
  toggle_compact: string;
  reset_build_order: string;
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
}

export type OverlayPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom";

export interface AppConfig {
  overlay_opacity: number;
  font_size: FontSize;
  theme: Theme;
  hotkeys: HotkeyConfig;
  window_position?: WindowPosition;
  window_size?: WindowSize;
  click_through: boolean;
  compact_mode: boolean;
  auto_advance: AutoAdvanceConfig;
  filter_civilization?: string;
  filter_difficulty?: string;
  overlay_position: OverlayPosition;
  floating_style: boolean; // minimal background, floating look
  voice?: VoiceConfig;
  reminders?: ReminderConfig;
}

export type FontSize = "small" | "medium" | "large";
export type Theme = "dark" | "light" | "system";

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  enabled: false,
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
};

export const DEFAULT_CONFIG: AppConfig = {
  overlay_opacity: 0.95,
  font_size: "medium",
  theme: "dark",
  hotkeys: {
    toggle_overlay: "F1",
    previous_step: "F2",
    next_step: "F3",
    cycle_build_order: "F4",
    toggle_click_through: "F5",
    toggle_compact: "F6",
    reset_build_order: "F7",
  },
  click_through: false,
  compact_mode: false, // Default to expanded mode (more info visible)
  auto_advance: {
    enabled: false,
    delay_seconds: 0,
  },
  overlay_position: "top-right",
  floating_style: true, // Default to floating/minimal style
  voice: DEFAULT_VOICE_CONFIG,
  reminders: DEFAULT_REMINDER_CONFIG,
};
