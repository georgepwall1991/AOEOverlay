import { useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  useBuildOrderStore,
  useOverlayStore,
  useConfigStore,
  useTimerStore,
} from "@/stores";
import { toggleClickThrough, toggleCompactMode, speak } from "@/lib/tauri";
import { DEFAULT_VOICE_CONFIG } from "@/types";

export function useGlobalHotkeys() {
  const { nextStep, previousStep, cycleBuildOrder, resetSteps } =
    useBuildOrderStore();
  const { toggleVisibility } = useOverlayStore();
  const { updateConfig } = useConfigStore();
  const { startTimer, resetTimer, recordStepTime, togglePause } = useTimerStore();

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
    const nextStepData = currentOrder.steps[nextStepIndex];

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

  // Handle reset with timer reset
  const handleReset = useCallback(() => {
    resetSteps();
    resetTimer();
  }, [resetSteps, resetTimer]);

  useEffect(() => {
    const unlistenPromises = [
      listen("hotkey-toggle-overlay", () => {
        toggleVisibility();
      }),
      listen("hotkey-previous-step", () => {
        previousStep();
      }),
      listen("hotkey-next-step", () => {
        handleNextStep();
      }),
      listen("hotkey-cycle-build-order", () => {
        cycleBuildOrder();
        resetTimer();
      }),
      listen("hotkey-toggle-click-through", async () => {
        const newState = await toggleClickThrough();
        updateConfig({ click_through: newState });
      }),
      listen("hotkey-toggle-compact", async () => {
        const newState = await toggleCompactMode();
        updateConfig({ compact_mode: newState });
      }),
      listen("hotkey-reset-build-order", () => {
        handleReset();
      }),
      listen("hotkey-toggle-pause", () => {
        togglePause();
      }),
    ];

    return () => {
      unlistenPromises.forEach((promise) => {
        promise.then((unlisten) => unlisten());
      });
    };
  }, [
    handleNextStep,
    previousStep,
    cycleBuildOrder,
    handleReset,
    toggleVisibility,
    updateConfig,
    resetTimer,
    togglePause,
  ]);
}
