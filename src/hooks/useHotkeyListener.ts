import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@/lib/tauri";
import { logTelemetryEvent } from "@/lib/utils";

export interface HotkeyConfig {
  event: string;
  handler: () => void | Promise<void>;
  telemetryKey: string;
  telemetrySource?: string;
}

/**
 * Hook that sets up multiple hotkey listeners with telemetry logging.
 *
 * Features:
 * - Automatic telemetry logging for each hotkey
 * - Proper cleanup with race condition prevention
 * - Handles async handlers
 *
 * @param hotkeys - Array of hotkey configurations
 */
export function useHotkeyListeners(hotkeys: HotkeyConfig[]) {
  const unlistenFnsRef = useRef<UnlistenFn[]>([]);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    // Prevent setting up listeners if already cleaning up
    if (isCleaningUpRef.current) return;

    // Clear previous listeners synchronously
    unlistenFnsRef.current.forEach((unlisten) => {
      try {
        unlisten();
      } catch (error) {
        console.error("Failed to clean up hotkey listener:", error);
      }
    });
    unlistenFnsRef.current = [];

    const setupListeners = async () => {
      if (isCleaningUpRef.current) return;

      const listeners = await Promise.all(
        hotkeys.map(({ event, handler, telemetryKey, telemetrySource = "hotkey" }) =>
          listen(event, async () => {
            await handler();
            // Only log telemetry if key provided (handlers may manage their own)
            if (telemetryKey) {
              logTelemetryEvent(telemetryKey, { source: telemetrySource });
            }
          })
        )
      );

      if (!isCleaningUpRef.current) {
        unlistenFnsRef.current = listeners;
      } else {
        listeners.forEach((unlisten) => unlisten());
      }
    };

    setupListeners().catch((error) =>
      console.error("Failed to set up hotkey listeners:", error)
    );

    return () => {
      isCleaningUpRef.current = true;
      unlistenFnsRef.current.forEach((unlisten) => {
        try {
          unlisten();
        } catch (error) {
          console.error("Failed to clean up hotkey listener:", error);
        }
      });
      unlistenFnsRef.current = [];
      setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 0);
    };
  }, [hotkeys]);
}

/**
 * Creates a hotkey config object for use with useHotkeyListeners.
 */
export function hotkey(
  event: string,
  handler: () => void | Promise<void>,
  telemetryKey: string,
  telemetrySource = "hotkey"
): HotkeyConfig {
  return { event, handler, telemetryKey, telemetrySource };
}
