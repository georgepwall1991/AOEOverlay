import { Clock, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimerDisplay } from "./useTimerDisplay";

interface FullTimerProps {
  targetTiming?: string;
}

export function FullTimer({ targetTiming }: FullTimerProps) {
  const {
    isRunning,
    isPaused,
    timerDisplay,
    deltaStyles,
    showDelta,
    deltaPulse,
    deltaDisplay,
    voiceEnabled,
    adjustedTarget,
    toggleVoice,
  } = useTimerDisplay(targetTiming);

  return (
    <div data-testid="timer-bar" className="px-3 py-1.5 border-b border-white/10">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
        {/* Timer display */}
        <div className="flex items-center gap-1.5">
          {isPaused ? (
            <Pause className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Clock
              className={cn(
                "w-4 h-4",
                isRunning ? "text-amber-400" : "text-white/40"
              )}
            />
          )}
          <span
            className={cn(
              "font-mono font-bold text-sm tabular-nums",
              isPaused
                ? "text-amber-400 animate-pulse"
                : isRunning
                  ? "text-white"
                  : "text-white/60"
            )}
          >
            {isPaused ? `PAUSED ${timerDisplay}` : timerDisplay}
          </span>
        </div>

        {/* Delta indicator */}
        <div
          className={cn(
            "flex items-center gap-1 font-mono text-sm font-medium tabular-nums justify-end min-w-[80px]",
            showDelta ? deltaStyles.colorClass : "text-white/30",
            deltaPulse && showDelta && "animate-pulse"
          )}
          aria-live="polite"
        >
          {showDelta && deltaStyles.icon}
          <span>{showDelta ? deltaDisplay : "—"}</span>
        </div>

        {/* Right side: target timing + mute button */}
        <div className="flex items-center gap-2 justify-end">
          {targetTiming && (
            <span
              className="text-xs text-white/40 whitespace-nowrap"
              title={adjustedTarget ? `Original: ${targetTiming}` : undefined}
            >
              Target:{" "}
              <span className="font-mono text-white/60 tabular-nums">
                {adjustedTarget ? `~${adjustedTarget}` : targetTiming}
              </span>
            </span>
          )}

          {/* Mute/unmute button */}
          <button
            onClick={toggleVoice}
            className={cn(
              "p-1 rounded hover:bg-white/10 transition-colors",
              voiceEnabled ? "text-white/80" : "text-white/40"
            )}
            title={voiceEnabled ? "Mute voice coaching" : "Enable voice coaching"}
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
