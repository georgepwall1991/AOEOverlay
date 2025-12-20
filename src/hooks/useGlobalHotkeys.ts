import { useEffect, useCallback, useMemo } from "react";
import { IS_MOCK, emit } from "@/lib/tauri";
import { useHotkeyListeners, hotkey, type HotkeyConfig } from "./useHotkeyListener";
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

  // Handle reset with timer reset and badge reset (logs its own telemetry)
  const handleReset = useCallback(() => {
    resetSteps();
    resetTimer();
    resetBadges();
    useSessionStore.getState().endSession();
    logTelemetryEvent("hotkey:build:reset", { source: "hotkey" });
  }, [resetSteps, resetTimer, resetBadges]);

  // Handlers that need custom telemetry (with metadata)
  const handleCycleBuildOrder = useCallback(() => {
    cycleBuildOrder();
    resetTimer();
    resetBadges();
  }, [cycleBuildOrder, resetTimer, resetBadges]);

  const handleToggleClickThrough = useCallback(async () => {
    const newState = await toggleClickThrough();
    updateConfig({ click_through: newState });
    logTelemetryEvent("hotkey:overlay:click-through", {
      source: "hotkey",
      meta: { enabled: newState },
    });
  }, [updateConfig]);

  const handleToggleCompact = useCallback(async () => {
    const newState = await toggleCompactMode();
    updateConfig({ compact_mode: newState });
    logTelemetryEvent("hotkey:overlay:compact", {
      source: "hotkey",
      meta: { enabled: newState },
    });
  }, [updateConfig]);

  // Branch activation helper
  const activateBranch = useCallback((branchIndex: number) => {
    const { buildOrders, currentOrderIndex } = useBuildOrderStore.getState();
    const order = buildOrders[currentOrderIndex];
    if (order?.branches?.[branchIndex]) {
      setActiveBranch(order.branches[branchIndex].id);
    }
  }, [setActiveBranch]);

  // Build hotkey configurations
  const hotkeys: HotkeyConfig[] = useMemo(() => [
    // Overlay controls
    hotkey("hotkey-toggle-overlay", toggleVisibility, "hotkey:overlay:toggle"),
    hotkey("hotkey-toggle-click-through", handleToggleClickThrough, ""), // handles own telemetry
    hotkey("hotkey-toggle-compact", handleToggleCompact, ""), // handles own telemetry

    // Step navigation
    hotkey("hotkey-previous-step", previousStep, "hotkey:step:previous"),
    hotkey("hotkey-next-step", handleNextStep, "hotkey:step:next"),

    // Build order controls
    hotkey("hotkey-cycle-build-order", handleCycleBuildOrder, "hotkey:build:cycle"),
    hotkey("hotkey-reset-build-order", handleReset, ""), // handles own telemetry

    // Timer control
    hotkey("hotkey-toggle-pause", togglePause, "hotkey:timer:toggle-pause"),

    // Branch activation
    hotkey("hotkey-activate-branch-main", () => setActiveBranch(null), "hotkey:branch:main"),
    hotkey("hotkey-activate-branch-1", () => activateBranch(0), "hotkey:branch:1"),
    hotkey("hotkey-activate-branch-2", () => activateBranch(1), "hotkey:branch:2"),
    hotkey("hotkey-activate-branch-3", () => activateBranch(2), "hotkey:branch:3"),
    hotkey("hotkey-activate-branch-4", () => activateBranch(3), "hotkey:branch:4"),

    // Tray icon events
    hotkey("tray-toggle-overlay", toggleVisibility, "tray:overlay:toggle", "tray"),
    hotkey("tray-show-overlay", () => setVisible(true), "tray:overlay:show", "tray"),
    hotkey("tray-hide-overlay", () => setVisible(false), "tray:overlay:hide", "tray"),
  ], [
    toggleVisibility,
    handleToggleClickThrough,
    handleToggleCompact,
    previousStep,
    handleNextStep,
    handleCycleBuildOrder,
    handleReset,
    togglePause,
    setActiveBranch,
    activateBranch,
    setVisible,
  ]);

  // Set up all hotkey listeners using the factory hook
  useHotkeyListeners(hotkeys);

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
