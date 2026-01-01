import { useMemo } from "react";
import type { BuildOrderStep } from "@/types";
import { DEFAULT_TIMER_DRIFT_CONFIG } from "@/types";
import { useConfigStore, useAccumulatedDrift } from "@/stores";
import { parseTimingToSeconds, formatTime, sanitizeTiming } from "@/stores/timerStore";

interface AdjustedTimingResult {
  displayTiming: string | undefined;
  showDriftIndicator: boolean;
}

/**
 * Hook to calculate adjusted step timing based on accumulated drift.
 * Returns the display timing (adjusted or original) and whether to show drift indicator.
 */
export function useAdjustedTiming(
  step: BuildOrderStep,
  isActive: boolean,
  isPast: boolean
): AdjustedTimingResult {
  const { config } = useConfigStore();
  const accumulatedDrift = useAccumulatedDrift();
  const driftConfig = config.timerDrift ?? DEFAULT_TIMER_DRIFT_CONFIG;

  const adjustedTiming = useMemo(() => {
    if (!step.timing || !driftConfig.enabled || accumulatedDrift === 0) {
      return null;
    }
    // Only adjust for future steps (not current or past)
    if (isActive || isPast) {
      return null;
    }
    const timingSeconds = parseTimingToSeconds(step.timing);
    if (timingSeconds === null) {
      return null;
    }
    // Add drift to timing (positive drift = behind, so add to timing)
    const adjustedSeconds = timingSeconds + accumulatedDrift;
    if (adjustedSeconds <= 0) {
      return null;
    }
    return formatTime(adjustedSeconds);
  }, [step.timing, driftConfig.enabled, accumulatedDrift, isActive, isPast]);

  return {
    displayTiming: adjustedTiming || sanitizeTiming(step.timing),
    showDriftIndicator: adjustedTiming !== null,
  };
}
