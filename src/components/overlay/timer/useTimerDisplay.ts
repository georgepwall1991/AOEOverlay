import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTimer, useTTS } from "@/hooks";
import { useAccumulatedDrift, useConfigStore } from "@/stores";
import { logTelemetryEvent } from "@/lib/utils";
import { DEFAULT_TIMER_DRIFT_CONFIG, DEFAULT_VOICE_CONFIG } from "@/types";
import type { VoiceConfig } from "@/types";
import type { ReactNode } from "react";
import { parseTimingToSeconds, formatTime } from "@/stores/timerStore";
import { saveConfig } from "@/lib/tauri";
import React from "react";

export interface DeltaStyles {
  icon: ReactNode;
  colorClass: string;
}

export interface UseTimerDisplayResult {
  isRunning: boolean;
  isPaused: boolean;
  timerDisplay: string;
  deltaDisplay: string | null;
  deltaStatus: string | null;
  deltaStyles: DeltaStyles;
  showDelta: boolean;
  deltaPulse: boolean;
  voiceEnabled: boolean;
  adjustedTarget: string | null;
  toggleVoice: () => Promise<void>;
}

export function useTimerDisplay(targetTiming?: string): UseTimerDisplayResult {
  const { isRunning, isPaused, timerDisplay, deltaDisplay, deltaStatus } = useTimer();
  const { stopSpeaking } = useTTS();
  const { config, updateConfig } = useConfigStore();
  const accumulatedDrift = useAccumulatedDrift();
  const voiceConfig = config.voice ?? DEFAULT_VOICE_CONFIG;
  const voiceEnabled = voiceConfig.enabled;
  const driftConfig = config.timerDrift ?? DEFAULT_TIMER_DRIFT_CONFIG;

  const [deltaPulse, setDeltaPulse] = useState(false);
  const lastDeltaRef = useRef<string | null>(null);

  const toggleVoice = useCallback(async () => {
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
  }, [config, voiceConfig, voiceEnabled, updateConfig, stopSpeaking]);

  const getDeltaStyles = useCallback((): DeltaStyles => {
    if (!deltaStatus) return { icon: null, colorClass: "text-white/40" };

    switch (deltaStatus) {
      case "ahead":
        return {
          icon: React.createElement(ChevronUp, { className: "w-3 h-3" }),
          colorClass: "text-green-400",
        };
      case "behind":
        return {
          icon: React.createElement(ChevronDown, { className: "w-3 h-3" }),
          colorClass: "text-red-400",
        };
      case "on-pace":
        return { icon: null, colorClass: "text-white/60" };
      default:
        return { icon: null, colorClass: "text-white/40" };
    }
  }, [deltaStatus]);

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

  return {
    isRunning,
    isPaused,
    timerDisplay,
    deltaDisplay,
    deltaStatus,
    deltaStyles,
    showDelta,
    deltaPulse,
    voiceEnabled,
    adjustedTarget,
    toggleVoice,
  };
}
