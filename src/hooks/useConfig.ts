import { useEffect } from "react";
import { useConfigStore } from "@/stores";
import { CONFIG_CHANGED_EVENT, getConfig, saveConfig, listen } from "@/lib/tauri";
import type { AppConfig } from "@/types";

export function useConfig() {
  const { config, setConfig, isLoading } = useConfigStore();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loaded = await getConfig();
        setConfig(loaded);
      } catch (error) {
        console.error("Failed to load config:", error);
      }
    };

    loadConfig();
  }, [setConfig]);

  useEffect(() => {
    // Keep config in sync across overlay/settings windows
    const unlistenPromise = listen<AppConfig>(CONFIG_CHANGED_EVENT, (event) => {
      setConfig(event.payload);
    });

    return () => {
      unlistenPromise
        .then((unlisten) => unlisten())
        .catch((error) =>
          console.error("Failed to clean up config change listener:", error)
        );
    };
  }, [setConfig]);

  const updateAndSave = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    useConfigStore.getState().updateConfig(updates);

    try {
      await saveConfig(newConfig);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  return { config, isLoading, updateAndSave };
}
