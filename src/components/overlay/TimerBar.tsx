import { Clock, Volume2, VolumeX, ChevronUp, ChevronDown, Pause } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTimer, useTTS } from "@/hooks";
import { useAccumulatedDrift, useConfigStore } from "@/stores";
import { cn, logTelemetryEvent } from "@/lib/utils";
import { DEFAULT_TIMER_DRIFT_CONFIG, DEFAULT_VOICE_CONFIG } from "@/types";
import type { VoiceConfig } from "@/types";
import type { ReactNode } from "react";
import { parseTimingToSeconds, formatTime } from "@/stores/timerStore";
import { saveConfig } from "@/lib/tauri";

interface TimerBarProps {
  compact?: boolean;
  targetTiming?: string;
}

interface DeltaStyles {
  icon: ReactNode;
  colorClass: string;
}

export function TimerBar({ compact = false, targetTiming }: TimerBarProps) {
  const { isRunning, isPaused, timerDisplay, deltaDisplay, deltaStatus } = useTimer();
  const { stopSpeaking } = useTTS();
  const { config, updateConfig } = useConfigStore();
  const accumulatedDrift = useAccumulatedDrift();
  const voiceConfig = config.voice ?? DEFAULT_VOICE_CONFIG;
  const voiceEnabled = voiceConfig.enabled;
  const driftConfig = config.timerDrift ?? DEFAULT_TIMER_DRIFT_CONFIG;

  const toggleVoice = async () => {
    const newVoiceConfig: VoiceConfig = {
      ...voiceConfig,
      enabled: !voiceEnabled,
    };
    const nextConfig = { ...config, voice: newVoiceConfig };
    updateConfig({ voice: newVoiceConfig });
    try {
      await saveConfig(nextConfig);
    } catch (error) {
      console.error("Failed to persist voice toggle:", error);
    }
    logTelemetryEvent("action:voice:toggle", {
      source: "timer-bar",
      meta: { enabled: newVoiceConfig.enabled },
    });

    if (voiceEnabled) {
      await stopSpeaking();
    }
  };

  // Delta icon and color
  const getDeltaStyles = (): DeltaStyles => {
    if (!deltaStatus) return { icon: null, colorClass: "text-white/40" };

    switch (deltaStatus) {
      case "ahead":
        return {
          icon: <ChevronUp className="w-3 h-3" />,
          colorClass: "text-green-400",
        };
      case "behind":
        return {
          icon: <ChevronDown className="w-3 h-3" />,
          colorClass: "text-red-400",
        };
      case "on-pace":
        return { icon: null, colorClass: "text-white/60" };
      default:
        return { icon: null, colorClass: "text-white/40" };
    }
  };

  const deltaStyles = getDeltaStyles();
  const showDelta = !isPaused && Boolean(deltaDisplay);

  const adjustedTarget = useMemo(() => {
    if (!targetTiming || !driftConfig.enabled) return null;
    const baseSeconds = parseTimingToSeconds(targetTiming);
    if (baseSeconds === null) return null;
    const shifted = baseSeconds + accumulatedDrift;
    if (shifted <= 0) return "0:00";
    return formatTime(shifted);
  }, [accumulatedDrift, driftConfig.enabled, targetTiming]);

  const [deltaPulse, setDeltaPulse] = useState(false);
  const lastDeltaRef = useRef<string | null>(null);

  useEffect(() => {
    if (deltaDisplay && deltaDisplay !== lastDeltaRef.current) {
      setDeltaPulse(true);
      lastDeltaRef.current = deltaDisplay;
      const id = window.setTimeout(() => setDeltaPulse(false), 300);
      return () => clearTimeout(id);
    }
    lastDeltaRef.current = deltaDisplay;
    setDeltaPulse(false);
    return undefined;
  }, [deltaDisplay]);

  if (compact) {
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
          <span className={cn("flex items-center font-mono", deltaStyles.colorClass, deltaPulse && "animate-pulse")}>
            {deltaStyles.icon}
            {deltaDisplay}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 border-b border-white/10">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
        {/* Timer display (fixed position to avoid jump) */}
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

        {/* Delta indicator (reserved width so layout stays stable) */}
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
