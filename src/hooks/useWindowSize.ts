import { useEffect, useRef } from "react";
import { useConfigStore } from "@/stores";
import { getCurrentWindow, getWindowSize, setWindowSize, getWindowPosition, setWindowPosition, saveConfig, listen } from "@/lib/tauri";

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
      } catch (error) {
        console.error("Failed to restore window state:", error);
      }
    };

    restoreWindowState();
  }, [config.window_size, config.window_position, isLoading]);

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
