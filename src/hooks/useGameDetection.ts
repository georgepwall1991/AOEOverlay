import { useEffect } from "react";
import {
  listen,
  getGameDetectionState,
  GAME_FOCUS_CHANGED_EVENT,
  type GameFocusPayload,
  type UnlistenFn,
} from "@/lib/tauri";
import { useGameStore } from "@/stores";
import { logTelemetryEvent } from "@/lib/utils";

/**
 * Subscribes to the Rust foreground-window watcher.
 *
 * The overlay window is actually shown/hidden natively in Rust (alpha + click-through),
 * so this hook is purely informational: it mirrors detection state into `useGameStore`
 * so the UI can show a status indicator, and logs focus transitions to telemetry.
 */
export function useGameDetection() {
  const setFocused = useGameStore((s) => s.setFocused);
  const setEverSeen = useGameStore((s) => s.setEverSeen);
  const setEnabled = useGameStore((s) => s.setEnabled);

  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | undefined;

    // Sync current state on mount (the overlay UI may mount after the game is
    // already in focus, so we can't rely on the event alone).
    getGameDetectionState()
      .then((state) => {
        if (cancelled) return;
        setFocused(state.focused);
        setEverSeen(state.everSeen);
        setEnabled(state.enabled);
      })
      .catch(() => {
        /* detection unavailable (non-Windows or pre-init) — leave defaults */
      });

    listen<GameFocusPayload>(GAME_FOCUS_CHANGED_EVENT, (event) => {
      const { focused, everSeen } = event.payload;
      setFocused(focused);
      setEverSeen(everSeen);
      setEnabled(true);
      logTelemetryEvent("game:focus", {
        source: "detection",
        meta: { focused },
      });
    })
      .then((fn) => {
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch(() => {
        /* listen unavailable in mock mode */
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [setFocused, setEverSeen, setEnabled]);
}
