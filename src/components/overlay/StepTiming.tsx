import { cn } from "@/lib/utils";

interface StepTimingProps {
  timing: string | undefined;
  displayTiming: string | undefined;
  originalTiming: string | undefined;
  isActive: boolean;
  showDriftIndicator: boolean;
  compact?: boolean;
}

/**
 * Timing badge for build order steps.
 * Shows the step timing with optional drift indicator.
 */
export function StepTiming({
  timing,
  displayTiming,
  originalTiming,
  isActive,
  showDriftIndicator,
  compact = false,
}: StepTimingProps) {
  if (!timing) {
    return null;
  }

  if (compact) {
    return (
      <span
        className={cn(
          "flex-shrink-0 text-sm px-2 py-0.5 rounded font-mono font-bold",
          isActive
            ? "bg-amber-500/40 text-amber-200 border border-amber-400/50"
            : showDriftIndicator
              ? "bg-amber-500/20 text-amber-300/80 border border-amber-400/30"
              : "bg-black/40 text-white/60 border border-white/20"
        )}
        style={
          isActive
            ? { textShadow: "0 0 8px rgba(251, 191, 36, 0.8)" }
            : undefined
        }
        title={showDriftIndicator ? `Adjusted from ${originalTiming}` : undefined}
      >
        {showDriftIndicator ? "~" : ""}
        {displayTiming}
      </span>
    );
  }

  return (
    <span
      className={cn(
        isActive ? "timing-badge-glow" : "timing-badge",
        showDriftIndicator &&
          !isActive &&
          "!bg-amber-500/20 !text-amber-300/80 !border-amber-400/30"
      )}
      title={showDriftIndicator ? `Adjusted from ${originalTiming}` : undefined}
    >
      {showDriftIndicator ? "~" : ""}
      {displayTiming}
    </span>
  );
}
