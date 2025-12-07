import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { useConfigStore } from "@/stores";
import { getWindowSize, setWindowSize, saveConfig } from "@/lib/tauri";

export function useWindowSize() {
  const { config, updateConfig } = useConfigStore();
  const saveTimeoutRef = useRef<number | null>(null);
  const hasRestoredRef = useRef(false);

  // Restore window size on startup
  useEffect(() => {
    const restoreSize = async () => {
      if (hasRestoredRef.current) return;
      hasRestoredRef.current = true;

      const win = getCurrentWindow();
      if (win.label !== "overlay") return;

      // Wait for config to be loaded
      if (config.window_size) {
        try {
          await setWindowSize(config.window_size.width, config.window_size.height);
        } catch (error) {
          console.error("Failed to restore window size:", error);
        }
      }
    };

    restoreSize();
  }, [config.window_size]);

  // Listen for resize events and save
  useEffect(() => {
    const win = getCurrentWindow();
    if (win.label !== "overlay") return;

    const handleResize = async () => {
      // Debounce saving
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const size = await getWindowSize();
          const newConfig = { ...config, window_size: size };
          updateConfig({ window_size: size });
          await saveConfig(newConfig);
        } catch (error) {
          console.error("Failed to save window size:", error);
        }
      }, 500); // Debounce 500ms
    };

    const unlistenPromise = listen("tauri://resize", handleResize);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      unlistenPromise
        .then((unlisten) => unlisten())
        .catch((error) =>
          console.error("Failed to clean up window resize listener:", error)
        );
    };
  }, [config, updateConfig]);
}
