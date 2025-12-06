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
}

export type FontSize = "small" | "medium" | "large";
export type Theme = "dark" | "light" | "system";

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
};
