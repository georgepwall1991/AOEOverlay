import { invoke } from "@tauri-apps/api/core";
import { emit as tauriEmit, listen as tauriListen, type UnlistenFn } from "@tauri-apps/api/event";
export type { UnlistenFn };
import { LogicalSize, PhysicalSize, Size } from "@tauri-apps/api/dpi";
export { LogicalSize, PhysicalSize, Size };
import { getCurrentWindow as tauriGetCurrentWindow, type Window } from "@tauri-apps/api/window";
import type { AppConfig, BuildOrder, WindowPosition, WindowSize } from "@/types";
import { DEFAULT_CONFIG } from "@/types";

// Event names for cross-window sync
export const BUILD_ORDERS_CHANGED_EVENT = "build-orders-changed";
export const CONFIG_CHANGED_EVENT = "config-changed";

const IS_MOCK = import.meta.env.VITE_MOCK_TAURI === 'true';

// Mock window interface for browser testing
interface MockWindow {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSize: (size: any) => Promise<void>;
  startDragging: () => Promise<void>;
}

// Mock getCurrentWindow for browser testing
export function getCurrentWindow(): Window | MockWindow {
  if (IS_MOCK) {
    // Check for test override via window property or URL parameter
    const testLabel = typeof window !== 'undefined'
      ? (window as unknown as { __TEST_WINDOW_LABEL__?: string }).__TEST_WINDOW_LABEL__
        || new URLSearchParams(window.location.search).get('window')
      : null;

    return {
      label: testLabel || "overlay",
      setSize: async () => {},
      startDragging: async () => {},
    };
  }
  return tauriGetCurrentWindow();
}

// Mock implementations for Tauri event APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback<T> = (event: { payload: T; event: string; id: number }) => void;

// Mock listen - returns a no-op unlisten function
export async function listen<T>(
  event: string,
  handler: EventCallback<T>
): Promise<UnlistenFn> {
  if (IS_MOCK) {
    // In mock mode, just return a no-op unlisten function
    // We don't actually listen to anything since Tauri isn't available
    void event;
    void handler;
    return () => {};
  }
  return tauriListen(event, handler);
}

// Mock emit - no-op in mock mode
export async function emit(event: string, payload?: unknown): Promise<void> {
  if (IS_MOCK) {
    void event;
    void payload;
    return;
  }
  return tauriEmit(event, payload);
}

const MOCK_BUILD_ORDERS: BuildOrder[] = [
  {
    id: "test-order-1",
    name: "English Longbow Rush",
    civilization: "English",
    description: "Basic English aggression",
    difficulty: "Beginner",
    enabled: true,
    steps: [
      { id: "s1", description: "Build House", timing: "0:00", resources: { wood: 50 } },
      { id: "s2", description: "Build Council Hall", timing: "2:30", resources: { food: 400, gold: 200 } },
      { id: "s3", description: "Train Longbows", timing: "4:00" },
      { id: "s4", description: "Attack", timing: "5:00" }
    ]
  }
];

// Config commands
export async function getConfig(): Promise<AppConfig> {
  if (IS_MOCK) return Promise.resolve(DEFAULT_CONFIG);
  return invoke<AppConfig>("get_config");
}

export async function saveConfig(config: AppConfig): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("save_config", { config });
}

export async function reloadHotkeys(): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("reload_hotkeys");
}

// Build order commands
export async function getBuildOrders(): Promise<BuildOrder[]> {
  if (IS_MOCK) return Promise.resolve(MOCK_BUILD_ORDERS);
  return invoke<BuildOrder[]>("get_build_orders");
}

export async function saveBuildOrder(order: BuildOrder): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  await invoke("save_build_order", { order });
  // Emit event to notify other windows
  await emit(BUILD_ORDERS_CHANGED_EVENT);
}

export async function deleteBuildOrder(id: string): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  await invoke("delete_build_order", { id });
  // Emit event to notify other windows
  await emit(BUILD_ORDERS_CHANGED_EVENT);
}

export async function importBuildOrder(path: string): Promise<BuildOrder> {
  if (IS_MOCK) {
    // Return a dummy order for testing import
    return Promise.resolve({
      ...MOCK_BUILD_ORDERS[0],
      id: "imported-order",
      name: "Imported Order"
    });
  }
  return invoke<BuildOrder>("import_build_order", { path });
}

export async function exportBuildOrder(order: BuildOrder, path: string): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("export_build_order", { order, path });
}

// Window commands
export async function getWindowPosition(): Promise<WindowPosition> {
  if (IS_MOCK) return Promise.resolve({ x: 100, y: 100 });
  return invoke<WindowPosition>("get_window_position");
}

export async function setWindowPosition(x: number, y: number): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("set_window_position", { x, y });
}

export async function getWindowSize(): Promise<WindowSize> {
  if (IS_MOCK) return Promise.resolve({ width: 800, height: 600 });
  return invoke<WindowSize>("get_window_size");
}

export async function setWindowSize(width: number, height: number): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("set_window_size", { width, height });
}

export async function resetOverlayWindow(): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("reset_window_position");
}

export async function recreateOverlayWindow(): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("recreate_overlay_window");
}

export async function showSettings(): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("show_settings");
}

// Click-through and compact mode commands
export async function setClickThrough(enabled: boolean): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("set_click_through", { enabled });
}

export async function toggleClickThrough(): Promise<boolean> {
  if (IS_MOCK) return Promise.resolve(true);
  return invoke<boolean>("toggle_click_through");
}

export async function toggleCompactMode(): Promise<boolean> {
  if (IS_MOCK) return Promise.resolve(true);
  return invoke<boolean>("toggle_compact_mode");
}

// TTS commands
export async function speak(text: string, rate: number = 1.0): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("speak", { text, rate });
}

export async function stopSpeaking(): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("tts_stop");
}
