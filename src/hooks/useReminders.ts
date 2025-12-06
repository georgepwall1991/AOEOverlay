import { useEffect, useRef, useCallback } from "react";
import { useConfigStore, useIsTimerRunning } from "@/stores";
import { useTTS } from "./useTTS";
import { DEFAULT_REMINDER_CONFIG } from "@/types";

type ReminderKey =
  | "villagerQueue"
  | "scout"
  | "houses"
  | "military"
  | "mapControl";

const REMINDER_MESSAGES: Record<ReminderKey, string> = {
  villagerQueue: "Keep queuing villagers",
  scout: "Check your scout",
  houses: "Don't get supply blocked",
  military: "Build more military",
  mapControl: "Control the map",
};

interface ReminderState {
  lastSpoken: number;
}

export function useReminders() {
  const isTimerRunning = useIsTimerRunning();
  const { speakReminder, isSpeaking } = useTTS();
  const reminderStates = useRef<Record<ReminderKey, ReminderState>>({
    villagerQueue: { lastSpoken: 0 },
    scout: { lastSpoken: 0 },
    houses: { lastSpoken: 0 },
    military: { lastSpoken: 0 },
    mapControl: { lastSpoken: 0 },
  });
  const intervalRef = useRef<number | null>(null);

  const getReminderConfig = useCallback(() => {
    const config = useConfigStore.getState().config;
    return config.reminders ?? DEFAULT_REMINDER_CONFIG;
  }, []);

  const checkReminders = useCallback(async () => {
    const reminderConfig = getReminderConfig();

    // Don't run if reminders are disabled or timer isn't running
    if (!reminderConfig.enabled || !isTimerRunning) {
      return;
    }

    // Don't speak if TTS is already speaking
    if (isSpeaking()) {
      return;
    }

    const now = Date.now();
    const reminderKeys: ReminderKey[] = [
      "villagerQueue",
      "scout",
      "houses",
      "military",
      "mapControl",
    ];

    for (const key of reminderKeys) {
      const itemConfig = reminderConfig[key];
      if (!itemConfig.enabled) continue;

      const state = reminderStates.current[key];
      const intervalMs = itemConfig.intervalSeconds * 1000;

      if (now - state.lastSpoken >= intervalMs) {
        // Speak the reminder
        await speakReminder(REMINDER_MESSAGES[key]);
        reminderStates.current[key].lastSpoken = now;
        // Only speak one reminder per interval check
        break;
      }
    }
  }, [getReminderConfig, isTimerRunning, isSpeaking, speakReminder]);

  // Start/stop the reminder interval based on timer state
  useEffect(() => {
    if (isTimerRunning) {
      // Reset lastSpoken times when timer starts
      const now = Date.now();
      Object.keys(reminderStates.current).forEach((key) => {
        reminderStates.current[key as ReminderKey].lastSpoken = now;
      });

      // Check reminders every second
      intervalRef.current = window.setInterval(checkReminders, 1000);
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
  }, [isTimerRunning, checkReminders]);

  // Reset all reminder timers
  const resetReminders = useCallback(() => {
    const now = Date.now();
    Object.keys(reminderStates.current).forEach((key) => {
      reminderStates.current[key as ReminderKey].lastSpoken = now;
    });
  }, []);

  return { resetReminders };
}
