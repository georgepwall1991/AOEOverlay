import { useEffect, useCallback, useRef } from "react";
import { listen, type UnlistenFn } from "@/lib/tauri";
import {
  useBuildOrderStore,
  useOverlayStore,
  useConfigStore,
  useTimerStore,
  useBadgeStore,
  resolveActiveSteps,
} from "@/stores";
import { toggleClickThrough, toggleCompactMode, speak } from "@/lib/tauri";
import { DEFAULT_VOICE_CONFIG } from "@/types";
import { logTelemetryEvent } from "@/lib/utils";

export function useGlobalHotkeys() {
  const { nextStep, previousStep, cycleBuildOrder, resetSteps } =
    useBuildOrderStore();
  const { toggleVisibility, setVisible } = useOverlayStore();
  const { updateConfig } = useConfigStore();
  const { startTimer, resetTimer, recordStepTime, togglePause } = useTimerStore();
  const { resetBadges } = useBadgeStore();

  // Track unlisten functions to prevent race conditions during cleanup
  const unlistenFnsRef = useRef<UnlistenFn[]>([]);
  const isCleaningUpRef = useRef(false);

  // Convert icon markers to readable text for TTS (e.g., "[icon:town_center]" -> "town center")
  const convertIconMarkersForTTS = useCallback((text: string): string => {
    return text.replace(/\[icon:([^\]]+)\]/g, (_match, iconName: string) => {
      // Convert snake_case to spaces (e.g., "town_center" -> "town center")
      return iconName.replace(/_/g, " ");
    });
  }, []);

  // Speak step description if voice coaching is enabled
  const speakStep = useCallback(async (description: string) => {
    const config = useConfigStore.getState().config;
    const voiceConfig = config.voice ?? DEFAULT_VOICE_CONFIG;

    if (voiceConfig.enabled && voiceConfig.speakSteps) {
      try {
        const cleanDescription = convertIconMarkersForTTS(description);
        await speak(cleanDescription, voiceConfig.rate);
      } catch (error) {
        console.error("Failed to speak step:", error);
      }
    }
  }, [convertIconMarkersForTTS]);

  // Handle next step with timer and TTS
  const handleNextStep = useCallback(async () => {
    const buildOrderStore = useBuildOrderStore.getState();
    const timerStore = useTimerStore.getState();

    const currentStepIndex = buildOrderStore.currentStepIndex;
    const currentOrder =
      buildOrderStore.buildOrders[buildOrderStore.currentOrderIndex];

    if (!currentOrder) {
      nextStep();
      return;
    }

    // Get next step info before advancing
    const nextStepIndex = currentStepIndex + 1;
    const activeSteps = resolveActiveSteps(
      currentOrder,
      buildOrderStore.activeBranchId
    );
    const nextStepData = activeSteps[nextStepIndex];

    // Advance to next step
    nextStep();

    // Start timer on first step advancement (step 0 -> 1, which is displayed as step 1 -> 2)
    if (currentStepIndex === 0 && !timerStore.isRunning) {
      startTimer();
    }

    // Record step timing for delta calculation
    if (nextStepData?.timing) {
      recordStepTime(nextStepData.timing);
    }

    // Speak the next step description
    if (nextStepData?.description) {
      await speakStep(nextStepData.description);
    }
  }, [nextStep, startTimer, recordStepTime, speakStep]);

  // Handle reset with timer reset and badge reset
  const handleReset = useCallback(() => {
    resetSteps();
    resetTimer();
    resetBadges();
    logTelemetryEvent("hotkey:build:reset", { source: "hotkey" });
  }, [resetSteps, resetTimer, resetBadges]);

  useEffect(() => {
    // Prevent setting up listeners if already cleaning up
    if (isCleaningUpRef.current) return;

    // Clear previous listeners synchronously before setting up new ones
    unlistenFnsRef.current.forEach((unlisten) => {
      try {
        unlisten();
      } catch (error) {
        console.error("Failed to clean up hotkey listener:", error);
      }
    });
    unlistenFnsRef.current = [];

    const setupListeners = async () => {
      // Don't set up if cleanup started while we were waiting
      if (isCleaningUpRef.current) return;

      const listeners = await Promise.all([
        listen("hotkey-toggle-overlay", () => {
          toggleVisibility();
          logTelemetryEvent("hotkey:overlay:toggle", { source: "hotkey" });
        }),
        listen("hotkey-previous-step", () => {
          previousStep();
          logTelemetryEvent("hotkey:step:previous", { source: "hotkey" });
        }),
        listen("hotkey-next-step", () => {
          handleNextStep();
          logTelemetryEvent("hotkey:step:next", { source: "hotkey" });
        }),
        listen("hotkey-cycle-build-order", () => {
          cycleBuildOrder();
          resetTimer();
          resetBadges();
          logTelemetryEvent("hotkey:build:cycle", { source: "hotkey" });
        }),
        listen("hotkey-toggle-click-through", async () => {
          const newState = await toggleClickThrough();
          updateConfig({ click_through: newState });
          logTelemetryEvent("hotkey:overlay:click-through", {
            source: "hotkey",
            meta: { enabled: newState },
          });
        }),
        listen("hotkey-toggle-compact", async () => {
          const newState = await toggleCompactMode();
          updateConfig({ compact_mode: newState });
          logTelemetryEvent("hotkey:overlay:compact", {
            source: "hotkey",
            meta: { enabled: newState },
          });
        }),
        listen("hotkey-reset-build-order", () => {
          handleReset();
        }),
        listen("hotkey-toggle-pause", () => {
          togglePause();
          logTelemetryEvent("hotkey:timer:toggle-pause", { source: "hotkey" });
        }),
        // Tray icon events (frontend controls visibility, not native window)
        listen("tray-toggle-overlay", () => {
          toggleVisibility();
          logTelemetryEvent("tray:overlay:toggle", { source: "tray" });
        }),
        listen("tray-show-overlay", () => {
          setVisible(true);
          logTelemetryEvent("tray:overlay:show", { source: "tray" });
        }),
        listen("tray-hide-overlay", () => {
          setVisible(false);
          logTelemetryEvent("tray:overlay:hide", { source: "tray" });
        }),
      ]);

      // Store unlisten functions for cleanup, but only if not cleaning up
      if (!isCleaningUpRef.current) {
        unlistenFnsRef.current = listeners;
      } else {
        // Cleanup started while setting up - unlisten immediately
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
      // Reset cleanup flag after a tick to allow re-setup
      setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 0);
    };
  }, [
    handleNextStep,
    previousStep,
    cycleBuildOrder,
    handleReset,
    toggleVisibility,
    setVisible,
    updateConfig,
    resetTimer,
    resetBadges,
    togglePause,
  ]);
}
