import { Clock, Volume2, VolumeX, ChevronUp, ChevronDown, Pause } from "lucide-react";
import { useTimer, useTTS } from "@/hooks";
import { useConfigStore } from "@/stores";
import { cn } from "@/lib/utils";
import { DEFAULT_VOICE_CONFIG } from "@/types";
import type { VoiceConfig } from "@/types";
import type { ReactNode } from "react";

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
  const voiceConfig = config.voice ?? DEFAULT_VOICE_CONFIG;
  const voiceEnabled = voiceConfig.enabled;

  const toggleVoice = async () => {
    const newVoiceConfig: VoiceConfig = {
      ...voiceConfig,
      enabled: !voiceEnabled,
    };
    updateConfig({ voice: newVoiceConfig });

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
          <span className={cn("flex items-center font-mono", deltaStyles.colorClass)}>
            {deltaStyles.icon}
            {deltaDisplay}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10">
      {/* Timer display */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isPaused ? (
            <Pause className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Clock className={cn(
              "w-4 h-4",
              isRunning ? "text-amber-400" : "text-white/40"
            )} />
          )}
          <span className={cn(
            "font-mono font-bold text-sm",
            isPaused ? "text-amber-400 animate-pulse" : isRunning ? "text-white" : "text-white/60"
          )}>
            {isPaused ? `PAUSED ${timerDisplay}` : timerDisplay}
          </span>
        </div>

        {/* Delta indicator */}
        {!isPaused && deltaDisplay && (
          <div className={cn(
            "flex items-center gap-0.5 font-mono text-sm font-medium",
            deltaStyles.colorClass
          )}>
            {deltaStyles.icon}
            <span>{deltaDisplay}</span>
          </div>
        )}
      </div>

      {/* Right side: target timing + mute button */}
      <div className="flex items-center gap-3">
        {targetTiming && (
          <span className="text-xs text-white/40">
            Target: <span className="font-mono text-white/60">{targetTiming}</span>
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
  );
}
