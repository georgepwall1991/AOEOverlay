import { useEffect, useCallback, useRef } from "react";
import {
  useTimerStore,
  useIsTimerRunning,
  useElapsedSeconds,
  useLastDelta,
  formatTime,
  formatDelta,
  formatDeltaCompact,
} from "@/stores";

export function useTimer() {
  const isRunning = useIsTimerRunning();
  const elapsedSeconds = useElapsedSeconds();
  const lastDelta = useLastDelta();
  const intervalRef = useRef<number | null>(null);

  const { startTimer, stopTimer, resetTimer, tick, recordStepTime } =
    useTimerStore();

  // Start the 1-second interval when timer is running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  const start = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

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
    elapsedSeconds,
    lastDelta,
    timerDisplay,
    deltaDisplay,
    deltaCompact,
    deltaStatus,
    start,
    stop,
    reset,
    recordStep,
  };
}
