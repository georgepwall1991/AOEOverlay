import { useEffect, useCallback, useRef } from "react";
import {
  useTimerStore,
  useIsTimerRunning,
  useIsTimerPaused,
  useElapsedSeconds,
  useLastDelta,
  formatTime,
  formatDelta,
  formatDeltaCompact,
} from "@/stores";

export function useTimer() {
  const isRunning = useIsTimerRunning();
  const isPaused = useIsTimerPaused();
  const elapsedSeconds = useElapsedSeconds();
  const lastDelta = useLastDelta();
  const rafRef = useRef<number | null>(null);
  const carryRef = useRef<number>(0);
  const lastTsRef = useRef<number | null>(null);
  // Track if the loop should continue - prevents stale RAF callbacks from scheduling new frames
  const isLoopActiveRef = useRef(false);

  const { startTimer, stopTimer, resetTimer, pauseTimer, resumeTimer, togglePause, tick, recordStepTime } =
    useTimerStore();

  // High-resolution, drift-corrected loop (guards against tab throttling)
  useEffect(() => {
    const target = 1000; // 1s
    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : ((cb: FrameRequestCallback) =>
            (typeof window !== "undefined"
              ? window.setTimeout(cb, 16)
              : setTimeout(cb, 16)) as unknown as number);
    const cancel =
      typeof cancelAnimationFrame === "function"
        ? cancelAnimationFrame
        : ((id: number) => clearTimeout(id));

    const loop = () => {
      // Check if loop should continue (prevents stale RAF callbacks from running)
      if (!isLoopActiveRef.current) {
        return;
      }

      const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
      if (lastTsRef.current === null) {
        lastTsRef.current = now;
      }
      const delta = now - lastTsRef.current;
      lastTsRef.current = now;
      carryRef.current += delta;

      // Catch up if the tab was throttled
      while (carryRef.current >= target) {
        tick();
        carryRef.current -= target;
      }

      // Only schedule next frame if loop is still active AND timer is running
      if (isLoopActiveRef.current && useTimerStore.getState().isRunning) {
        rafRef.current = schedule(loop);
      }
    };

    if (isRunning) {
      // Mark loop as active before scheduling
      isLoopActiveRef.current = true;
      lastTsRef.current = null;
      carryRef.current = 0;
      rafRef.current = schedule(loop);
    } else {
      // Mark loop as inactive first to prevent any pending RAF from scheduling new frames
      isLoopActiveRef.current = false;
      if (rafRef.current !== null) {
        cancel(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
      carryRef.current = 0;
    }

    return () => {
      // Mark loop as inactive on cleanup
      isLoopActiveRef.current = false;
      if (rafRef.current !== null) {
        cancel(rafRef.current);
      }
      rafRef.current = null;
      lastTsRef.current = null;
      carryRef.current = 0;
    };
  }, [isRunning, tick]);

  const start = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  const pause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const resume = useCallback(() => {
    resumeTimer();
  }, [resumeTimer]);

  const toggle = useCallback(() => {
    togglePause();
  }, [togglePause]);

  const reset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const recordStep = useCallback(
    (suggestedTiming: string | undefined) => {
      recordStepTime(suggestedTiming);
    },
    [recordStepTime]
  );

  // Formatted display values
  const timerDisplay = formatTime(elapsedSeconds);
  const deltaDisplay = lastDelta !== null ? formatDelta(lastDelta) : null;
  const deltaCompact =
    lastDelta !== null ? formatDeltaCompact(lastDelta) : null;

  // Delta status: 'ahead', 'behind', 'on-pace'
  const deltaStatus =
    lastDelta === null
      ? null
      : lastDelta < -10
        ? "ahead"
        : lastDelta > 10
          ? "behind"
          : "on-pace";

  return {
    isRunning,
    isPaused,
    elapsedSeconds,
    lastDelta,
    timerDisplay,
    deltaDisplay,
    deltaCompact,
    deltaStatus,
    start,
    stop,
    pause,
    resume,
    toggle,
    reset,
    recordStep,
  };
}
