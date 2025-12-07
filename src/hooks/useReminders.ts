import { useEffect, useRef, useCallback } from "react";
import { useConfigStore, useIsTimerRunning, useTimerStore } from "@/stores";
import { useTTS } from "./useTTS";
import { DEFAULT_REMINDER_CONFIG } from "@/types";

type ReminderKey =
  | "villagerQueue"
  | "scout"
  | "houses"
  | "military"
  | "mapControl"
  | "macroCheck";

const REMINDER_MESSAGES: Record<ReminderKey, string> = {
  villagerQueue: "Keep queuing villagers",
  scout: "Check your scout",
  houses: "Don't get supply blocked",
  military: "Build more military",
  mapControl: "Control the map",
  macroCheck: "Check your production",
};

interface ReminderState {
  lastSpoken: number;
}

interface SacredSiteState {
  spawnWarningSpoken: boolean; // 4:30 - "Sacred sites spawn in 30 seconds"
  activeSpoken: boolean; // 5:00 - "Sacred sites are active!"
}

export function useReminders() {
  const isTimerRunning = useIsTimerRunning();
  const { speakReminder, isSpeaking } = useTTS();
  const busyCooldownUntil = useRef<number>(0);

  const reminderStates = useRef<Record<ReminderKey, ReminderState>>({
    villagerQueue: { lastSpoken: 0 },
    scout: { lastSpoken: 0 },
    houses: { lastSpoken: 0 },
    military: { lastSpoken: 0 },
    mapControl: { lastSpoken: 0 },
    macroCheck: { lastSpoken: 0 },
  });

  const sacredSiteState = useRef<SacredSiteState>({
    spawnWarningSpoken: false,
    activeSpoken: false,
  });

  const intervalRef = useRef<number | null>(null);

  const getReminderConfig = useCallback(() => {
    const config = useConfigStore.getState().config;
    return config.reminders ?? DEFAULT_REMINDER_CONFIG;
  }, []);

  const checkReminders = useCallback(async () => {
    const reminderConfig = getReminderConfig();
    const { isRunning, elapsedSeconds } = useTimerStore.getState();
    const calmMode = reminderConfig.calmMode ?? { enabled: false, untilSeconds: 180 };
    const isCalmWindow = calmMode.enabled && elapsedSeconds < calmMode.untilSeconds;
    const now = Date.now();

    // Don't run if reminders are disabled or timer isn't running
    // Read isRunning from store directly to avoid stale closure
    if (!reminderConfig.enabled || !isRunning) {
      return;
    }

    // Don't speak if TTS is already speaking; add short backoff to reduce contention
    if (busyCooldownUntil.current > now) {
      return;
    }

    if (isSpeaking()) {
      busyCooldownUntil.current = now + 1500;
      return;
    }

    // Sacred Site Alerts (one-time, time-based)
    if (reminderConfig.sacredSites?.enabled) {
      // 4:30 (270 seconds) - Warning
      if (elapsedSeconds >= 270 && elapsedSeconds < 275 && !sacredSiteState.current.spawnWarningSpoken) {
        await speakReminder("Sacred sites spawn in 30 seconds");
        sacredSiteState.current.spawnWarningSpoken = true;
        busyCooldownUntil.current = Date.now() + 1500;
        return; // Don't speak other reminders this tick
      }

      // 5:00 (300 seconds) - Active
      if (elapsedSeconds >= 300 && elapsedSeconds < 305 && !sacredSiteState.current.activeSpoken) {
        await speakReminder("Sacred sites are active!");
        sacredSiteState.current.activeSpoken = true;
        busyCooldownUntil.current = Date.now() + 1500;
        return; // Don't speak other reminders this tick
      }
    }

    // Regular interval-based reminders
    const reminderKeys: ReminderKey[] = [
      "villagerQueue",
      "scout",
      "houses",
      "military",
      "mapControl",
      "macroCheck",
    ];

    for (const key of reminderKeys) {
      const itemConfig = reminderConfig[key];
      if (!itemConfig?.enabled) continue;
      if (isCalmWindow && (key === "military" || key === "mapControl" || key === "macroCheck")) {
        continue; // hold off on non-critical reminders during calm window
      }

      const state = reminderStates.current[key];
      const intervalMs = itemConfig.intervalSeconds * 1000;

      if (now - state.lastSpoken >= intervalMs) {
        // Speak the reminder
        await speakReminder(REMINDER_MESSAGES[key]);
        reminderStates.current[key].lastSpoken = now;
        busyCooldownUntil.current = Date.now() + 1500;
        // Only speak one reminder per interval check
        break;
      }
    }
  }, [getReminderConfig, isSpeaking, speakReminder]);

  // Start/stop the reminder interval based on timer state
  useEffect(() => {
    if (isTimerRunning) {
      // Only reset cadence on a fresh run (not resume)
      const now = Date.now();
      const { elapsedSeconds } = useTimerStore.getState();
      if (elapsedSeconds === 0) {
        Object.keys(reminderStates.current).forEach((key) => {
          reminderStates.current[key as ReminderKey].lastSpoken = now;
        });
        sacredSiteState.current = {
          spawnWarningSpoken: false,
          activeSpoken: false,
        };
      }

      // Check reminders every second
      intervalRef.current = window.setInterval(checkReminders, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      busyCooldownUntil.current = 0;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      busyCooldownUntil.current = 0;
    };
  }, [isTimerRunning, checkReminders]);

  // Reset all reminder timers
  const resetReminders = useCallback(() => {
    const now = Date.now();
    Object.keys(reminderStates.current).forEach((key) => {
      reminderStates.current[key as ReminderKey].lastSpoken = now;
    });
    // Also reset sacred site state
    sacredSiteState.current = {
      spawnWarningSpoken: false,
      activeSpoken: false,
    };
  }, []);

  return { resetReminders };
}
