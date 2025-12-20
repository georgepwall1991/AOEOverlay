import { useEffect, useCallback, useRef } from "react";
import { listen, type UnlistenFn, IS_MOCK, emit } from "@/lib/tauri";
import {
  useBuildOrderStore,
  useOverlayStore,
  useConfigStore,
  useTimerStore,
  useBadgeStore,
  useSessionStore,
  resolveActiveSteps,
} from "@/stores";
import { parseTimingToSeconds } from "@/stores/timerStore";
import { toggleClickThrough, toggleCompactMode, speak } from "@/lib/tauri";
import { DEFAULT_VOICE_CONFIG } from "@/types";
import { logTelemetryEvent } from "@/lib/utils";

export function useGlobalHotkeys() {
  const { nextStep, previousStep, cycleBuildOrder, resetSteps, setActiveBranch } =
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
    const sessionStore = useSessionStore.getState();

    const currentStepIndex = buildOrderStore.currentStepIndex;
    const currentOrder =
      buildOrderStore.buildOrders[buildOrderStore.currentOrderIndex];

    if (!currentOrder) {
      nextStep();
      return;
    }

    const activeSteps = resolveActiveSteps(
      currentOrder,
      buildOrderStore.activeBranchId
    );
    const currentStepData = activeSteps[currentStepIndex];

    // Record current step performance before moving to next
    if (currentStepData) {
      if (currentStepIndex === 0 && !sessionStore.currentSession) {
        sessionStore.startSession(currentOrder.id, currentOrder.name);
      }

      const expectedSeconds = parseTimingToSeconds(currentStepData.timing);
      if (expectedSeconds !== null) {
        sessionStore.recordStep({
          stepId: currentStepData.id,
          description: currentStepData.description,
          expectedTiming: currentStepData.timing || "0:00",
          actualTiming: timerStore.elapsedSeconds,
          delta: timerStore.elapsedSeconds - expectedSeconds,
        });
      }
    }

    // Get next step info before advancing
    const nextStepIndex = currentStepIndex + 1;
    const nextStepData = activeSteps[nextStepIndex];

    // If we've reached the end, end the session
    if (nextStepIndex >= activeSteps.length) {
      sessionStore.endSession();
    }

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
    useSessionStore.getState().endSession();
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
        listen("hotkey-activate-branch-main", () => {
          setActiveBranch(null);
          logTelemetryEvent("hotkey:branch:main", { source: "hotkey" });
        }),
        listen("hotkey-activate-branch-1", () => {
          const { buildOrders, currentOrderIndex } = useBuildOrderStore.getState();
          const order = buildOrders[currentOrderIndex];
          if (order?.branches?.[0]) setActiveBranch(order.branches[0].id);
          logTelemetryEvent("hotkey:branch:1", { source: "hotkey" });
        }),
        listen("hotkey-activate-branch-2", () => {
          const { buildOrders, currentOrderIndex } = useBuildOrderStore.getState();
          const order = buildOrders[currentOrderIndex];
          if (order?.branches?.[1]) setActiveBranch(order.branches[1].id);
          logTelemetryEvent("hotkey:branch:2", { source: "hotkey" });
        }),
        listen("hotkey-activate-branch-3", () => {
          const { buildOrders, currentOrderIndex } = useBuildOrderStore.getState();
          const order = buildOrders[currentOrderIndex];
          if (order?.branches?.[2]) setActiveBranch(order.branches[2].id);
          logTelemetryEvent("hotkey:branch:3", { source: "hotkey" });
        }),
        listen("hotkey-activate-branch-4", () => {
          const { buildOrders, currentOrderIndex } = useBuildOrderStore.getState();
          const order = buildOrders[currentOrderIndex];
          if (order?.branches?.[3]) setActiveBranch(order.branches[3].id);
          logTelemetryEvent("hotkey:branch:4", { source: "hotkey" });
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
    setActiveBranch,
  ]);

  useEffect(() => {
    if (!IS_MOCK) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const { config } = useConfigStore.getState();
      const h = config.hotkeys;

      // Map local keys to Tauri event names
      const keyMap: Record<string, string> = {
        [h.toggle_overlay]: "hotkey-toggle-overlay",
        [h.previous_step]: "hotkey-previous-step",
        [h.next_step]: "hotkey-next-step",
        [h.cycle_build_order]: "hotkey-cycle-build-order",
        [h.toggle_click_through]: "hotkey-toggle-click-through",
        [h.toggle_compact]: "hotkey-toggle-compact",
        [h.reset_build_order]: "hotkey-reset-build-order",
        [h.toggle_pause]: "hotkey-toggle-pause",
        [h.activate_branch_main]: "hotkey-activate-branch-main",
        [h.activate_branch_1]: "hotkey-activate-branch-1",
        [h.activate_branch_2]: "hotkey-activate-branch-2",
        [h.activate_branch_3]: "hotkey-activate-branch-3",
        [h.activate_branch_4]: "hotkey-activate-branch-4",
      };

      const eventName = keyMap[e.key];
      if (eventName) {
        e.preventDefault();
        emit(eventName);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
