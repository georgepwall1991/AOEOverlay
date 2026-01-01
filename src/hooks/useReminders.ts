import { useEffect, useRef, useCallback } from "react";
import { useConfigStore, useIsTimerRunning, useTimerStore, useMatchupStore, useBuildOrderStore } from "@/stores";
import { parseTimingToSeconds } from "@/stores/timerStore";
import { MATCHUPS } from "@/data/matchups";
import { useTTS } from "./useTTS";
import { useInterval } from "./useInterval";
import { DEFAULT_REMINDER_CONFIG } from "@/types";
import type { SoundEvent } from "./useSound";

// Timing constants
const BUSY_COOLDOWN_MS = 1500; // Cooldown after speaking to prevent contention
const SACRED_SITE_SPAWN_WARNING_SECONDS = 270; // 4:30 - "Sacred sites spawn in 30 seconds"
const SACRED_SITE_ACTIVE_SECONDS = 300; // 5:00 - "Sacred sites are active!"
const REMINDER_CHECK_INTERVAL_MS = 1000; // How often to check reminders

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

const REMINDER_SOUNDS: Record<ReminderKey, SoundEvent | undefined> = {
  villagerQueue: "reminderVillager",
  scout: "reminderScout",
  houses: "reminderHouse",
  military: undefined,
  mapControl: undefined,
  macroCheck: "metronomeTick",
};

interface ReminderState {
  lastSpoken: number;
}

interface SacredSiteState {
  spawnWarningSpoken: boolean; // 4:30 - "Sacred sites spawn in 30 seconds"
  activeSpoken: boolean; // 5:00 - "Sacred sites are active!"
}

interface MatchupAlertState {
  spokenAlerts: Set<string>; // ID = "${time}-${message}"
}

export function useReminders() {
  const isTimerRunning = useIsTimerRunning();
  const { speakReminder, isSpeaking } = useTTS();
  const busyCooldownUntil = useRef<number>(0);
  const lastCheckedTimeRef = useRef<number>(-1);

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

  const matchupAlertState = useRef<MatchupAlertState>({
    spokenAlerts: new Set(),
  });

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
    if (!reminderConfig.enabled || !isRunning) {
      lastCheckedTimeRef.current = elapsedSeconds;
      return;
    }

    // Initialize lastCheckedTime if this is the first tick
    if (lastCheckedTimeRef.current === -1) {
      lastCheckedTimeRef.current = elapsedSeconds - 1;
    }

    // Loop through all seconds between last checked and current (handles lag/catch-up)
    // We only evaluate alerts for each second, regular reminders still use intervals.
    let currentT = lastCheckedTimeRef.current + 1;
    while (currentT <= elapsedSeconds) {
      // Don't speak if TTS is already speaking; add short backoff to reduce contention
      if (busyCooldownUntil.current > now || isSpeaking()) {
        if (isSpeaking()) {
          busyCooldownUntil.current = now + BUSY_COOLDOWN_MS;
        }
        break; // Stop catch-up loop if we can't speak - will resume from currentT next tick
      }

      let spokenInThisSecond = false;

      // Matchup-specific proactive intel alerts
      const currentOrder = useBuildOrderStore.getState().buildOrders[useBuildOrderStore.getState().currentOrderIndex];
      if (currentOrder && reminderConfig.matchupAlerts?.enabled !== false) {
        const playerCiv = currentOrder.civilization;
        const opponentCiv = useMatchupStore.getState().getOpponentFor(playerCiv);
        
        const matchup = MATCHUPS.find(
          (m) => m.civ === playerCiv && m.opponent === opponentCiv
        );

        if (matchup?.dangerTimers) {
          for (const alert of matchup.dangerTimers) {
            const alertTime = parseTimingToSeconds(alert.time);
            const alertId = `${alert.time}-${alert.message}`;

            if (
              alertTime !== null &&
              currentT === alertTime && // Check EXACTLY the alert time
              !matchupAlertState.current.spokenAlerts.has(alertId)
            ) {
              await speakReminder(alert.message);
              matchupAlertState.current.spokenAlerts.add(alertId);
              busyCooldownUntil.current = Date.now() + BUSY_COOLDOWN_MS;
              spokenInThisSecond = true;
              break; // One alert per second max
            }
          }
        }
      }

      // Sacred Site Alerts (one-time, time-based)
      if (!spokenInThisSecond && reminderConfig.sacredSites?.enabled) {
        // 4:30 - Warning
        if (
          currentT === SACRED_SITE_SPAWN_WARNING_SECONDS &&
          !sacredSiteState.current.spawnWarningSpoken
        ) {
          await speakReminder("Sacred sites spawn in 30 seconds");
          sacredSiteState.current.spawnWarningSpoken = true;
          busyCooldownUntil.current = Date.now() + BUSY_COOLDOWN_MS;
          spokenInThisSecond = true;
        }

        // 5:00 - Active
        if (
          !spokenInThisSecond &&
          currentT === SACRED_SITE_ACTIVE_SECONDS &&
          !sacredSiteState.current.activeSpoken
        ) {
          await speakReminder("Sacred sites are active!");
          sacredSiteState.current.activeSpoken = true;
          busyCooldownUntil.current = Date.now() + BUSY_COOLDOWN_MS;
          spokenInThisSecond = true;
        }
      }

      currentT++;
      if (spokenInThisSecond) break; // If we spoke, stop loop to avoid overlapping speech
    }

    lastCheckedTimeRef.current = currentT - 1;

    // Regular interval-based reminders (processed ONCE per checkReminders call, not in loop)
    // Don't speak if loop above already triggered something
    if (busyCooldownUntil.current > now || isSpeaking()) {
      return;
    }

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
        await speakReminder(REMINDER_MESSAGES[key], REMINDER_SOUNDS[key]);
        reminderStates.current[key].lastSpoken = now;
        busyCooldownUntil.current = Date.now() + BUSY_COOLDOWN_MS;
        // Only speak one reminder per interval check
        break;
      }
    }
  }, [getReminderConfig, isSpeaking, speakReminder]);

  // Use interval hook for reminder checks (null delay pauses the interval)
  useInterval(checkReminders, isTimerRunning ? REMINDER_CHECK_INTERVAL_MS : null);

  // Reset states when timer starts fresh or stops
  useEffect(() => {
    if (isTimerRunning) {
      // Only reset cadence on a fresh run (not resume)
      const { elapsedSeconds } = useTimerStore.getState();
      if (elapsedSeconds === 0) {
        const now = Date.now();
        Object.keys(reminderStates.current).forEach((key) => {
          reminderStates.current[key as ReminderKey].lastSpoken = now;
        });
        sacredSiteState.current = {
          spawnWarningSpoken: false,
          activeSpoken: false,
        };
        matchupAlertState.current.spokenAlerts.clear();
      }
    } else {
      busyCooldownUntil.current = 0;
    }
  }, [isTimerRunning]);

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
    matchupAlertState.current.spokenAlerts.clear();
  }, []);

  return { resetReminders };
}
