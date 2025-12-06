import { vi } from "vitest";

// Mock @tauri-apps/api/core
export const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

// Mock @tauri-apps/api/event
export const mockListen = vi.fn(() => Promise.resolve(() => {}));
export const mockEmit = vi.fn();

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
  emit: mockEmit,
}));

// Mock @tauri-apps/api/window
export const mockGetCurrentWindow = vi.fn(() => ({
  label: "overlay",
  setPosition: vi.fn(),
  setSize: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  startDragging: vi.fn(),
  onMoved: vi.fn(() => Promise.resolve(() => {})),
  onResized: vi.fn(() => Promise.resolve(() => {})),
  innerSize: vi.fn(() => Promise.resolve({ width: 400, height: 600 })),
  outerPosition: vi.fn(() => Promise.resolve({ x: 100, y: 100 })),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: mockGetCurrentWindow,
  Window: vi.fn(),
  PhysicalPosition: vi.fn((x: number, y: number) => ({ x, y })),
  PhysicalSize: vi.fn((width: number, height: number) => ({ width, height })),
}));

// Mock @tauri-apps/plugin-global-shortcut
vi.mock("@tauri-apps/plugin-global-shortcut", () => ({
  register: vi.fn(),
  unregister: vi.fn(),
  isRegistered: vi.fn(() => Promise.resolve(false)),
}));

// Helper: Reset all Tauri mocks
export function resetTauriMocks() {
  mockInvoke.mockReset();
  mockListen.mockReset().mockImplementation(() => Promise.resolve(() => {}));
  mockEmit.mockReset();
  mockGetCurrentWindow.mockClear();
}
