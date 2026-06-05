import { useEffect, useRef } from "react";
import { useConfigStore } from "@/stores";
import {
  getCurrentWindow,
  getWindowSize,
  setWindowSize,
  getWindowPosition,
  setWindowPosition,
  saveConfig,
  listen,
  getAvailableMonitors,
  getPrimaryMonitor,
  GAME_FOCUS_CHANGED_EVENT,
  type GameFocusPayload,
  type UnlistenFn,
} from "@/lib/tauri";
import { monitorToBounds, isRectVisible, clampOntoMonitor } from "@/lib/windowBounds";

/**
 * If the overlay's current rect has been stranded off every connected monitor — a
 * disconnected display or a resolution change moved the screen out from under it —
 * pull it back onto a visible monitor and persist the safe position. A no-op while
 * any grabbable slice is still visible, so it never fights a valid layout.
 *
 * Runs for the overlay window only.
 */
async function rescueOverlayIfOffScreen() {
  if (getCurrentWindow().label !== "overlay") return;

  const monitors = await getAvailableMonitors();
  if (monitors.length === 0) return; // unknown setup — don't move anything

  const size = await getWindowSize();
  const pos = await getWindowPosition();
  const rect = { x: pos.x, y: pos.y, width: size.width, height: size.height };
  const bounds = monitors.map(monitorToBounds);
  if (isRectVisible(rect, bounds)) return;

  const primary = await getPrimaryMonitor();
  const target = primary ? monitorToBounds(primary) : bounds[0];
  const safe = clampOntoMonitor(rect, target);
  await setWindowPosition(safe.x, safe.y);
  // Read the latest config from the store (avoids stale-closure deps).
  const store = useConfigStore.getState();
  store.updateConfig({ window_position: safe });
  await saveConfig({ ...store.config, window_position: safe });
}

export function useWindowSize() {
  const { config, updateConfig, isLoading } = useConfigStore();
  const saveTimeoutRef = useRef<number | null>(null);
  const hasRestoredRef = useRef(false);

  // Restore window size and position on startup
  useEffect(() => {
    const restoreWindowState = async () => {
      if (hasRestoredRef.current || isLoading) return;
      hasRestoredRef.current = true;

      const win = getCurrentWindow();
      if (win.label !== "overlay") return;

      try {
        // Restore size
        if (config.window_size) {
          await setWindowSize(config.window_size.width, config.window_size.height);
        }
        // Restore position
        if (config.window_position) {
          await setWindowPosition(config.window_position.x, config.window_position.y);
        }

        // Safety: if the saved position lands on a disconnected/changed monitor,
        // pull the overlay back onto a visible screen so it isn't lost off-screen.
        await rescueOverlayIfOffScreen();
      } catch (error) {
        console.error("Failed to restore window state:", error);
      }
    };

    restoreWindowState();
  }, [config.window_size, config.window_position, isLoading]);

  // When the game brings the overlay to the foreground, re-check it's on a visible
  // monitor. This catches a display/resolution change that happened while you were
  // tabbed out of the game: the overlay was hidden, so the startup-time rescue
  // above couldn't run, but the native watcher is about to show it. Mirrors that
  // show; a no-op unless the overlay is genuinely stranded off-screen.
  useEffect(() => {
    const win = getCurrentWindow();
    if (win.label !== "overlay") return;

    let cancelled = false;
    let unlisten: UnlistenFn | undefined;

    listen<GameFocusPayload>(GAME_FOCUS_CHANGED_EVENT, (event) => {
      if (!event.payload.focused) return;
      rescueOverlayIfOffScreen().catch((e) =>
        console.error("Failed to rescue overlay position on game focus:", e)
      );
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {
        /* listen unavailable in mock mode */
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  // Listen for resize and move events and save
  useEffect(() => {
    const win = getCurrentWindow();
    if (win.label !== "overlay") return;

    const handleWindowStateChange = async () => {
      if (isLoading) return;

      // Debounce saving
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const size = await getWindowSize();
          const pos = await getWindowPosition();

          const newConfig = {
            ...config,
            window_size: size,
            window_position: pos
          };

          updateConfig({
            window_size: size,
            window_position: pos
          });

          await saveConfig(newConfig);
        } catch (error) {
          console.error("Failed to save window state:", error);
        }
      }, 1000); // 1s debounce for state saving
    };

    const unlistenResize = listen("tauri://resize", handleWindowStateChange);
    const unlistenMove = listen("tauri://move", handleWindowStateChange);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      unlistenResize.then(u => u());
      unlistenMove.then(u => u());
    };
  }, [config, updateConfig, isLoading]);
}
