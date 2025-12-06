import { create } from "zustand";

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number | null;
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

// Parse timing string like "3:30" or "10:45" to seconds
export function parseTimingToSeconds(timing: string | undefined): number | null {
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
        startedAt: Date.now(),
        elapsedSeconds: 0,
        lastStepTime: null,
        lastDelta: null,
      });
    } else {
      // Resuming from pause
      set({
        isRunning: true,
        isPaused: false,
        startedAt: Date.now(),
      });
    }
  },

  stopTimer: () =>
    set({
      isRunning: false,
    }),

  pauseTimer: () => {
    const { isRunning, startedAt, accumulatedTime } = get();
    if (!isRunning || !startedAt) return;

    // Save accumulated time and mark as paused
    set({
      isRunning: false,
      isPaused: true,
      startedAt: null,
      accumulatedTime: accumulatedTime + (Date.now() - startedAt),
    });
  },

  resumeTimer: () => {
    const { isPaused } = get();
    if (!isPaused) return;

    set({
      isRunning: true,
      isPaused: false,
      startedAt: Date.now(),
    });
  },

  togglePause: () => {
    const { isRunning, isPaused } = get();
    if (isRunning) {
      get().pauseTimer();
    } else if (isPaused) {
      get().resumeTimer();
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
    const elapsed = Math.floor((accumulatedTime + (Date.now() - startedAt)) / 1000);
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
        // Update accumulated drift to track total time behind/ahead
        accumulatedDrift: delta,
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
