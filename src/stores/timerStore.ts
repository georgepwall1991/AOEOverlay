import { create } from "zustand";

interface TimerState {
  isRunning: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  lastStepTime: number | null;
  lastDelta: number | null; // Seconds ahead (-) or behind (+)

  // Actions
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  recordStepTime: (suggestedTiming: string | undefined) => void;
}

// Parse timing string like "3:30" or "10:45" to seconds
function parseTimingToSeconds(timing: string | undefined): number | null {
  if (!timing) return null;
  const parts = timing.split(":");
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

// Format seconds to MM:SS display
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Format delta seconds to display like "-0:15" or "+0:30"
export function formatDelta(deltaSeconds: number): string {
  const sign = deltaSeconds <= 0 ? "" : "+";
  const absSeconds = Math.abs(deltaSeconds);
  const minutes = Math.floor(absSeconds / 60);
  const seconds = absSeconds % 60;
  return `${sign}${deltaSeconds < 0 ? "-" : ""}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Format delta for compact mode like "-15s" or "+30s"
export function formatDeltaCompact(deltaSeconds: number): string {
  const sign = deltaSeconds <= 0 ? "" : "+";
  return `${sign}${deltaSeconds}s`;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  startedAt: null,
  elapsedSeconds: 0,
  lastStepTime: null,
  lastDelta: null,

  startTimer: () =>
    set({
      isRunning: true,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      lastStepTime: null,
      lastDelta: null,
    }),

  stopTimer: () =>
    set({
      isRunning: false,
    }),

  resetTimer: () =>
    set({
      isRunning: false,
      startedAt: null,
      elapsedSeconds: 0,
      lastStepTime: null,
      lastDelta: null,
    }),

  tick: () => {
    const { isRunning, startedAt } = get();
    if (!isRunning || !startedAt) return;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    set({ elapsedSeconds: elapsed });
  },

  recordStepTime: (suggestedTiming: string | undefined) => {
    const { elapsedSeconds } = get();
    const suggestedSeconds = parseTimingToSeconds(suggestedTiming);

    set({ lastStepTime: elapsedSeconds });

    if (suggestedSeconds !== null) {
      // Delta: positive means behind, negative means ahead
      const delta = elapsedSeconds - suggestedSeconds;
      set({ lastDelta: delta });
    }
  },
}));

// Selectors
export const useIsTimerRunning = () =>
  useTimerStore((state) => state.isRunning);

export const useElapsedSeconds = () =>
  useTimerStore((state) => state.elapsedSeconds);

export const useLastDelta = () => useTimerStore((state) => state.lastDelta);

export const useTimerDisplay = () =>
  useTimerStore((state) => formatTime(state.elapsedSeconds));

export const useDeltaDisplay = () =>
  useTimerStore((state) =>
    state.lastDelta !== null ? formatDelta(state.lastDelta) : null
  );
