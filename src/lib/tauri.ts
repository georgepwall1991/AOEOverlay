import { invoke } from "@tauri-apps/api/core";
import { emit as tauriEmit, listen as tauriListen, type UnlistenFn } from "@tauri-apps/api/event";
export type { UnlistenFn };
import { LogicalSize, PhysicalSize, Size } from "@tauri-apps/api/dpi";
export { LogicalSize, PhysicalSize, Size };
import { getCurrentWindow as tauriGetCurrentWindow, type Window } from "@tauri-apps/api/window";
import { open as tauriOpen, save as tauriSave } from "@tauri-apps/plugin-dialog";
import type { AppConfig, BuildOrder, WindowPosition, WindowSize } from "@/types";
import { DEFAULT_CONFIG } from "@/types";

// Type for window with Tauri internals
interface WindowWithTauri {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
}

const IS_MOCK =
  import.meta.env.VITE_MOCK_TAURI === "true" ||
  (typeof window !== "undefined" && !(window as WindowWithTauri).__TAURI_INTERNALS__ && !(window as WindowWithTauri).__TAURI__);

export { IS_MOCK };

// Mock event sync for browser testing using BroadcastChannel
const mockChannel = typeof window !== "undefined" ? new BroadcastChannel("tauri-mock-events") : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for storing heterogeneous callbacks
const mockListeners = new Set<EventCallback<any>>();

// Dialog options type for mock implementation
interface DialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  defaultPath?: string;
  multiple?: boolean;
}

// Mock version of tauri-apps/plugin-dialog for browser testing
export const dialog = {
  open: async (options?: DialogOptions): Promise<string | string[] | null> => {
    if (IS_MOCK) {
      console.warn("[Mock] dialog.open called", options);
      return null;
    }
    return tauriOpen(options);
  },
  save: async (options?: DialogOptions): Promise<string | null> => {
    if (IS_MOCK) {
      console.warn("[Mock] dialog.save called", options);
      return null;
    }
    return tauriSave(options);
  }
};

// Event names for cross-window sync
export const BUILD_ORDERS_CHANGED_EVENT = "build-orders-changed";
export const CONFIG_CHANGED_EVENT = "config-changed";

// Mock window interface for browser testing
interface MockWindow {
  label: string;
  setSize: (size: Size) => Promise<void>;
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
      setSize: async () => { },
      startDragging: async () => { },
    };
  }
  return tauriGetCurrentWindow();
}

// Mock implementations for Tauri event APIs
type EventCallback<T> = (event: { payload: T; event: string; id: number }) => void;

// Mock listen - returns a no-op unlisten function
export async function listen<T>(
  event: string,
  handler: EventCallback<T>
): Promise<UnlistenFn> {
  if (IS_MOCK) {
    const wrappedHandler: EventCallback<T> = (ev) => {
      if (ev.event === event) {
        handler(ev);
      }
    };

    mockListeners.add(wrappedHandler);

    if (mockChannel) {
      const channelListener = (msg: MessageEvent) => {
        if (msg.data.event === event) {
          handler({ payload: msg.data.payload, event, id: Date.now() });
        }
      };
      mockChannel.addEventListener("message", channelListener);
      return () => {
        mockListeners.delete(wrappedHandler);
        mockChannel.removeEventListener("message", channelListener);
      };
    }

    return () => {
      mockListeners.delete(wrappedHandler);
    };
  }
  return tauriListen(event, handler);
}

// Mock emit - no-op in mock mode
export async function emit(event: string, payload?: unknown): Promise<void> {
  if (IS_MOCK) {
    const ev = { payload, event, id: Date.now() };
    // Notify local listeners
    mockListeners.forEach((handler) => handler(ev));
    // Notify other windows
    if (mockChannel) {
      mockChannel.postMessage({ event, payload });
    }
    return;
  }
  return tauriEmit(event, payload);
}

const MOCK_BUILD_ORDERS: BuildOrder[] = [
  {
    id: "test-order-1",
    name: "English Longbow Rush",
    civilization: "English",
    description: "Basic English aggression into [icon:feudal_age] Feudal Age.",
    difficulty: "Beginner",
    enabled: true,
    steps: [
      { id: "s1", description: "Build [icon:house] House and send 6 to [icon:sheep] sheep.", timing: "0:00", resources: { food: 6, villagers: 6 } },
      { id: "s2", description: "Build [icon:council_hall] Council Hall! Use 2 [icon:villager] builders.", timing: "2:30", resources: { food: 8, wood: 2, gold: 2, villagers: 14, builders: 2 } },
      { id: "s3", description: "Train [icon:longbowman] Longbowmen to harass the enemy wood line.", timing: "4:00", resources: { food: 10, wood: 4, gold: 2, villagers: 18 } },
      { id: "s4", description: "Move your [icon:scout] to find the enemy base and place a [icon:rally] rally point.", timing: "5:00", resources: { food: 12, wood: 6, gold: 4, villagers: 22 } }
    ]
  },
  {
    id: "test-order-2",
    name: "French 2TC Boom",
    civilization: "French",
    description: "Advanced boom with [icon:town_center] Second TC.",
    difficulty: "Advanced",
    enabled: true,
    steps: [
      { id: "f1", description: "Start by sending 6 [icon:villager] vills to [icon:sheep] food and queueing 3 more vills to [icon:gold] gold.", timing: "0:00", resources: { food: 6, gold: 3, villagers: 9 } },
      { id: "f2", description: "Build [icon:town_center] SECOND TOWN CENTER near the [icon:berries] berries or [icon:deer] deer. Use 4 builders.", timing: "5:30", resources: { food: 12, wood: 8, gold: 4, stone: 0, villagers: 24, builders: 4 } },
      { id: "f3", description: "Maintain constant [icon:villager] production from both centers while researching [icon:wheelbarrow] Wheelbarrow.", timing: "7:00", resources: { food: 16, wood: 10, gold: 6, villagers: 32 } }
    ]
  }
];

const MOCK_CONFIG_KEY = "aoe4-overlay-config-mock";
const MOCK_BUILDS_KEY = "aoe4-overlay-builds-mock";

// Debounce timer for config saving
let saveConfigTimeout: number | null = null;
const SAVE_DEBOUNCE_MS = 500;

// Config commands
export async function getConfig(): Promise<AppConfig> {
  if (IS_MOCK) {
    const saved = localStorage.getItem(MOCK_CONFIG_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse mock config", e);
      }
    }
    return Promise.resolve(DEFAULT_CONFIG);
  }
  return invoke<AppConfig>("get_config");
}

export async function saveConfig(config: AppConfig): Promise<void> {
  // Always emit immediately so other windows update UI instantly
  await emit(CONFIG_CHANGED_EVENT, config);

  if (IS_MOCK) {
    localStorage.setItem(MOCK_CONFIG_KEY, JSON.stringify(config));
    return;
  }

  // Debounce the actual disk/native save
  return new Promise((resolve, reject) => {
    if (saveConfigTimeout !== null) {
      clearTimeout(saveConfigTimeout);
    }

    saveConfigTimeout = window.setTimeout(async () => {
      try {
        await invoke("save_config", { config });
        saveConfigTimeout = null;
        resolve();
      } catch (error) {
        saveConfigTimeout = null;
        reject(error);
      }
    }, SAVE_DEBOUNCE_MS);
  });
}

export async function reloadHotkeys(): Promise<void> {
  if (IS_MOCK) return Promise.resolve();
  return invoke("reload_hotkeys");
}

// Build order commands
export async function getBuildOrders(): Promise<BuildOrder[]> {
  if (IS_MOCK) {
    const saved = localStorage.getItem(MOCK_BUILDS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse mock build orders", e);
      }
    }
    return Promise.resolve(MOCK_BUILD_ORDERS);
  }
  return invoke<BuildOrder[]>("get_build_orders");
}

export async function saveBuildOrder(order: BuildOrder): Promise<void> {
  if (IS_MOCK) {
    const current = await getBuildOrders();
    const existing = current.findIndex(o => o.id === order.id);
    const next = [...current];
    if (existing >= 0) {
      next[existing] = order;
    } else {
      next.push(order);
    }
    localStorage.setItem(MOCK_BUILDS_KEY, JSON.stringify(next));
    await emit(BUILD_ORDERS_CHANGED_EVENT);
    return;
  }
  await invoke("save_build_order", { order });
  // Emit event to notify other windows
  await emit(BUILD_ORDERS_CHANGED_EVENT);
}

export async function deleteBuildOrder(id: string): Promise<void> {
  if (IS_MOCK) {
    const current = await getBuildOrders();
    const next = current.filter(o => o.id !== id);
    localStorage.setItem(MOCK_BUILDS_KEY, JSON.stringify(next));
    await emit(BUILD_ORDERS_CHANGED_EVENT);
    return;
  }
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
  if (IS_MOCK) {
    const config = await getConfig();
    await saveConfig({ ...config, click_through: enabled });
    return;
  }
  return invoke("set_click_through", { enabled });
}

export async function toggleClickThrough(): Promise<boolean> {
  if (IS_MOCK) {
    const config = await getConfig();
    const next = !config.click_through;
    await saveConfig({ ...config, click_through: next });
    return next;
  }
  return invoke<boolean>("toggle_click_through");
}

export async function toggleCompactMode(): Promise<boolean> {
  if (IS_MOCK) {
    const config = await getConfig();
    const next = !config.compact_mode;
    await saveConfig({ ...config, compact_mode: next });
    return next;
  }
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
