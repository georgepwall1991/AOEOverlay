export interface HotkeyConfig {
  toggle_overlay: string;
  previous_step: string;
  next_step: string;
  cycle_build_order: string;
  toggle_click_through: string;
  toggle_compact: string;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface AppConfig {
  overlay_opacity: number;
  font_size: FontSize;
  theme: Theme;
  hotkeys: HotkeyConfig;
  window_position?: WindowPosition;
  click_through: boolean;
  compact_mode: boolean;
}

export type FontSize = "small" | "medium" | "large";
export type Theme = "dark" | "light" | "auto";

export const DEFAULT_CONFIG: AppConfig = {
  overlay_opacity: 0.8,
  font_size: "medium",
  theme: "dark",
  hotkeys: {
    toggle_overlay: "F1",
    previous_step: "F2",
    next_step: "F3",
    cycle_build_order: "F4",
    toggle_click_through: "F5",
    toggle_compact: "F6",
  },
  click_through: false,
  compact_mode: false,
};
