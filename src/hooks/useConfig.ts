import { useEffect, useRef } from "react";
import { useConfigStore, useSaveStatus } from "@/stores";
import { CONFIG_CHANGED_EVENT, getConfig, saveConfig, listen } from "@/lib/tauri";
import type { AppConfig } from "@/types";

// Auto-clear saved status after this duration
const SAVE_STATUS_CLEAR_DELAY = 2000;

export function useConfig() {
  const { config, setConfig, isLoading, setSaveStatus } = useConfigStore();
  const saveStatus = useSaveStatus();
  const clearTimeoutRef = useRef<number | null>(null);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const updateAndSave = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    useConfigStore.getState().updateConfig(updates);

    // Clear any pending status clear
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }

    setSaveStatus('saving');

    try {
      await saveConfig(newConfig);
      setSaveStatus('saved');

      // Auto-clear saved status after delay
      clearTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
      }, SAVE_STATUS_CLEAR_DELAY);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Failed to save config:", error);
      setSaveStatus('error', errorMessage);

      // Auto-clear error status after longer delay
      clearTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
      }, SAVE_STATUS_CLEAR_DELAY * 2);
    }
  };

  return { config, isLoading, saveStatus, updateAndSave };
}
