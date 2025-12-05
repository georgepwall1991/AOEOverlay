import { useEffect } from "react";
import { useConfigStore } from "@/stores";
import { getConfig, saveConfig } from "@/lib/tauri";
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
