import { Clock, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimerDisplay } from "./useTimerDisplay";

interface CompactTimerProps {
  targetTiming?: string;
}

export function CompactTimer({ targetTiming }: CompactTimerProps) {
  const {
    isPaused,
    timerDisplay,
    deltaDisplay,
    deltaStyles,
    deltaPulse,
  } = useTimerDisplay(targetTiming);

  return (
    <div className="flex items-center gap-2 text-xs">
      {isPaused ? (
        <Pause className="w-3 h-3 text-amber-400" />
      ) : (
        <Clock className="w-3 h-3 text-white/60" />
      )}
      <span className={cn("font-mono", isPaused ? "text-amber-400" : "text-white/80")}>
        {isPaused ? "PAUSED" : timerDisplay}
      </span>
      {!isPaused && deltaDisplay && (
        <span
          className={cn(
            "flex items-center font-mono",
            deltaStyles.colorClass,
            deltaPulse && "animate-pulse"
          )}
        >
          {deltaStyles.icon}
          {deltaDisplay}
        </span>
      )}
    </div>
  );
}
