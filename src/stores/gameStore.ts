import { create } from "zustand";

/**
 * Tracks the live foreground game-detection state reported by the Rust watcher.
 * The actual show/hide of the overlay window is performed natively in Rust; this
 * store exists so the UI can reflect detection status (e.g. a "Live" indicator).
 */
interface GameState {
  focused: boolean; // Is the game the foreground window right now?
  everSeen: boolean; // Has the game been focused at least once this session?
  enabled: boolean; // Is foreground detection enabled in config?

  setFocused: (focused: boolean) => void;
  setEverSeen: (everSeen: boolean) => void;
  setEnabled: (enabled: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  focused: false,
  everSeen: false,
  enabled: false,

  setFocused: (focused) => set({ focused }),
  setEverSeen: (everSeen) => set({ everSeen }),
  setEnabled: (enabled) => set({ enabled }),
}));
