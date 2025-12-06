import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, BuildOrder, WindowPosition, WindowSize } from "@/types";

// Config commands
export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}

export async function saveConfig(config: AppConfig): Promise<void> {
  return invoke("save_config", { config });
}

export async function reloadHotkeys(): Promise<void> {
  return invoke("reload_hotkeys");
}

// Build order commands
export async function getBuildOrders(): Promise<BuildOrder[]> {
  return invoke<BuildOrder[]>("get_build_orders");
}

export async function saveBuildOrder(order: BuildOrder): Promise<void> {
  return invoke("save_build_order", { order });
}

export async function deleteBuildOrder(id: string): Promise<void> {
  return invoke("delete_build_order", { id });
}

export async function importBuildOrder(path: string): Promise<BuildOrder> {
  return invoke<BuildOrder>("import_build_order", { path });
}

export async function exportBuildOrder(order: BuildOrder, path: string): Promise<void> {
  return invoke("export_build_order", { order, path });
}

// Window commands
export async function getWindowPosition(): Promise<WindowPosition> {
  return invoke<WindowPosition>("get_window_position");
}

export async function setWindowPosition(x: number, y: number): Promise<void> {
  return invoke("set_window_position", { x, y });
}

export async function getWindowSize(): Promise<WindowSize> {
  return invoke<WindowSize>("get_window_size");
}

export async function setWindowSize(width: number, height: number): Promise<void> {
  return invoke("set_window_size", { width, height });
}

export async function toggleOverlay(): Promise<void> {
  return invoke("toggle_overlay");
}

export async function showSettings(): Promise<void> {
  return invoke("show_settings");
}

// Click-through and compact mode commands
export async function setClickThrough(enabled: boolean): Promise<void> {
  return invoke("set_click_through", { enabled });
}

export async function toggleClickThrough(): Promise<boolean> {
  return invoke<boolean>("toggle_click_through");
}

export async function toggleCompactMode(): Promise<boolean> {
  return invoke<boolean>("toggle_compact_mode");
}

// TTS commands
export async function speak(text: string, rate: number = 1.0): Promise<void> {
  return invoke("speak", { text, rate });
}

export async function stopSpeaking(): Promise<void> {
  return invoke("tts_stop");
}
