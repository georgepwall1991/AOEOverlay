import { create } from "zustand";

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number | null; // Monotonic ms (performance.now fallback)
  accumulatedTime: number; // Track time from previous sessions (for pause/resume)
  elapsedSeconds: number;
  lastStepTime: number | null;
  lastDelta: number | null; // Seconds ahead (-) or behind (+)
  accumulatedDrift: number; // Total drift for adjusting future step timings

  // Actions
  startTimer: () => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  togglePause: () => void;
  resetTimer: () => void;
  tick: () => void;
  recordStepTime: (suggestedTiming: string | undefined) => void;
}

// Parse timing string like "3:30", "10:45", or "1:30:00" to seconds
// Supports both mm:ss and hh:mm:ss formats
export function parseTimingToSeconds(timing: string | undefined): number | null {
  if (!timing) return null;
  const parts = timing.split(":");

  if (parts.length === 2) {
    // mm:ss format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    // hh:mm:ss format
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
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

const nowMs = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  startedAt: null,
  accumulatedTime: 0,
  elapsedSeconds: 0,
  lastStepTime: null,
  lastDelta: null,
  accumulatedDrift: 0,

  startTimer: () => {
    const { isRunning, accumulatedTime } = get();
    if (isRunning) return;

    // If starting fresh (not resuming from pause), reset everything
    if (accumulatedTime === 0) {
      set({
        isRunning: true,
        isPaused: false,
        startedAt: nowMs(),
        elapsedSeconds: 0,
        lastStepTime: null,
        lastDelta: null,
      });
    } else {
      // Resuming from pause
      set({
        isRunning: true,
        isPaused: false,
        startedAt: nowMs(),
      });
    }
  },

  stopTimer: () =>
    set({
      isRunning: false,
      isPaused: false,
      startedAt: null,
      accumulatedTime: 0,
      elapsedSeconds: 0,
      lastStepTime: null,
      lastDelta: null,
      accumulatedDrift: 0,
    }),

  pauseTimer: () => {
    const { isRunning, startedAt, accumulatedTime } = get();
    // Guard: only pause if actually running with valid startedAt
    if (!isRunning || startedAt === null) return;

    // Capture values before state change to avoid race conditions
    const elapsed = accumulatedTime + (nowMs() - startedAt);

    // Atomic state update - set all values in single update
    set({
      isRunning: false,
      isPaused: true,
      startedAt: null,
      accumulatedTime: elapsed,
    });
  },

  resumeTimer: () => {
    const { isPaused, isRunning } = get();
    // Guard: only resume if paused and not already running
    if (!isPaused || isRunning) return;

    set({
      isRunning: true,
      isPaused: false,
      startedAt: nowMs(),
    });
  },

  togglePause: () => {
    const { isRunning, isPaused } = get();
    // Use direct state mutation through set() to ensure atomicity
    if (isRunning) {
      // Inline pause logic to avoid potential race between get() calls
      const { startedAt, accumulatedTime } = get();
      if (startedAt !== null) {
        const elapsed = accumulatedTime + (nowMs() - startedAt);
        set({
          isRunning: false,
          isPaused: true,
          startedAt: null,
          accumulatedTime: elapsed,
        });
      }
    } else if (isPaused) {
      set({
        isRunning: true,
        isPaused: false,
        startedAt: nowMs(),
      });
    }
    // If not running and not paused, do nothing (timer hasn't started)
  },

  resetTimer: () =>
    set({
      isRunning: false,
      isPaused: false,
      startedAt: null,
      accumulatedTime: 0,
      elapsedSeconds: 0,
      lastStepTime: null,
      lastDelta: null,
      accumulatedDrift: 0,
    }),

  tick: () => {
    const { isRunning, startedAt, accumulatedTime } = get();
    if (!isRunning || !startedAt) return;
    const elapsed = Math.floor((accumulatedTime + (nowMs() - startedAt)) / 1000);
    set({ elapsedSeconds: elapsed });
  },

  recordStepTime: (suggestedTiming: string | undefined) => {
    const { elapsedSeconds } = get();
    const suggestedSeconds = parseTimingToSeconds(suggestedTiming);

    set({ lastStepTime: elapsedSeconds });

    if (suggestedSeconds !== null) {
      // Delta: positive means behind, negative means ahead
      const delta = elapsedSeconds - suggestedSeconds;
      set({
        lastDelta: delta,
        // Update accumulated drift to track total time behind/ahead across steps
        accumulatedDrift: (get().accumulatedDrift ?? 0) + delta,
      });
    }
  },
}));

// Selectors
export const useIsTimerRunning = () =>
  useTimerStore((state) => state.isRunning);

export const useIsTimerPaused = () =>
  useTimerStore((state) => state.isPaused);

export const useElapsedSeconds = () =>
  useTimerStore((state) => state.elapsedSeconds);

export const useLastDelta = () => useTimerStore((state) => state.lastDelta);

export const useTimerDisplay = () =>
  useTimerStore((state) => formatTime(state.elapsedSeconds));

export const useDeltaDisplay = () =>
  useTimerStore((state) =>
    state.lastDelta !== null ? formatDelta(state.lastDelta) : null
  );

export const useAccumulatedDrift = () =>
  useTimerStore((state) => state.accumulatedDrift);
