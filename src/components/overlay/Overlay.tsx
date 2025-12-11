import { useEffect, useRef, useState, useCallback } from "react";
import { GripVertical, Settings } from "lucide-react";
import { useWindowDrag, useAutoResize, useTimer, useBuildOrderSync } from "@/hooks";
import { useOpacity, useConfigStore, useCurrentStep } from "@/stores";
import { BuildOrderDisplay } from "./BuildOrderDisplay";
import { CompactOverlay } from "./CompactOverlay";
import { TimerBar } from "./TimerBar";
import { UpgradeBadges } from "./UpgradeBadges";
import { QuickActionBar } from "./QuickActionBar";
import { StatusIndicators } from "./StatusIndicators";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";
import { FirstLaunchOnboarding } from "./FirstLaunchOnboarding";
import { MatchupPanel } from "./MatchupPanel";
import { showSettings, saveConfig, setClickThrough } from "@/lib/tauri";
import { cn } from "@/lib/utils";

// Duration of the undo window in milliseconds
const CLICK_THROUGH_UNDO_TIMEOUT = 5000;

// Track undo timer generation to prevent stale timers from clearing state
let undoTimerGeneration = 0;



export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config, updateConfig } = useConfigStore();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();
  const scale = config.ui_scale ?? 1;
  const coachOnly = config.coach_only_mode ?? false;
  const overlayPreset = config.overlay_preset ?? "info_dense";
  // Click-through undo state - stores the state to revert to if undo is triggered
  const [clickUndoState, setClickUndoState] = useState<{
    active: boolean;
    revertTo: boolean;
  }>({ active: false, revertTo: false });
  const clickUndoTimerRef = useRef<number | null>(null);

  // Clear undo timer on unmount
  useEffect(() => {
    return () => {
      if (clickUndoTimerRef.current) {
        clearTimeout(clickUndoTimerRef.current);
      }
    };
  }, []);

  // Keep native click-through in sync with config (so settings window is clickable)
  useEffect(() => {
    setClickThrough(config.click_through).catch((error) =>
      console.error("Failed to apply click-through:", error)
    );
  }, [config.click_through]);

  // Clear undo state when click-through changes from external source (settings window, hotkey)
  // Only clear if the change doesn't match what undo would do
  useEffect(() => {
    if (clickUndoState.active && config.click_through === clickUndoState.revertTo) {
      // User manually changed it back to the revert state - clear undo
      setClickUndoState({ active: false, revertTo: false });
      if (clickUndoTimerRef.current) {
        clearTimeout(clickUndoTimerRef.current);
        clickUndoTimerRef.current = null;
      }
    }
  }, [config.click_through, clickUndoState.active, clickUndoState.revertTo]);

  const toggleClickThroughWithUndo = useCallback(() => {
    // Store current state BEFORE toggling (this is what we'll revert to)
    const currentState = config.click_through;
    const nextState = !currentState;

    // Clear any pending undo timer
    if (clickUndoTimerRef.current) {
      clearTimeout(clickUndoTimerRef.current);
      clickUndoTimerRef.current = null;
    }

    // Apply the new state
    updateConfig({ click_through: nextState });
    saveConfig({ ...config, click_through: nextState }).catch((error) =>
      console.error("Failed to persist click-through toggle:", error)
    );

    // Set up undo with the state to revert to
    setClickUndoState({ active: true, revertTo: currentState });

    // Increment generation to invalidate any stale timers
    const currentGeneration = ++undoTimerGeneration;

    // Auto-expire undo after timeout (with generation check to avoid race conditions)
    clickUndoTimerRef.current = window.setTimeout(() => {
      // Only clear if this timer's generation matches current
      if (currentGeneration === undoTimerGeneration) {
        setClickUndoState({ active: false, revertTo: false });
      }
    }, CLICK_THROUGH_UNDO_TIMEOUT);
  }, [config, updateConfig]);

  const undoClickThrough = useCallback(() => {
    if (!clickUndoState.active) return;

    // Clear timer
    if (clickUndoTimerRef.current) {
      clearTimeout(clickUndoTimerRef.current);
      clickUndoTimerRef.current = null;
    }

    // Revert to the stored state
    const revertTo = clickUndoState.revertTo;
    updateConfig({ click_through: revertTo });
    saveConfig({ ...config, click_through: revertTo }).catch((error) =>
      console.error("Failed to persist click-through undo:", error)
    );

    // Clear undo state
    setClickUndoState({ active: false, revertTo: false });
  }, [clickUndoState, config, updateConfig]);

  // Sync build orders when changed from settings window
  useBuildOrderSync();

  // Show compact view if enabled
  if (config.compact_mode) {
    return <CompactOverlay />;
  }

  // Coach-only: keep audio/timers, hide build UI
  if (coachOnly) {
    const exitCoachMode = async () => {
      const next = { ...config, coach_only_mode: false };
      useConfigStore.getState().updateConfig({ coach_only_mode: false });
      try {
        await saveConfig(next);
      } catch (error) {
        console.error("Failed to persist coach-only toggle:", error);
      }
    };

    return (
      <div
        ref={containerRef}
        className="inline-block p-1"
        style={{
          opacity,
          minWidth: 320,
          maxWidth: 600,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div className={cn("flex flex-col overflow-hidden", "floating-panel-pro")}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Coach-only mode</p>
              <p className="text-xs text-white/60">
                Voice + timers stay active while hiding build steps.
              </p>
            </div>
            <button
              onClick={exitCoachMode}
              className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition"
            >
              Exit
            </button>
          </div>
          {(isRunning || currentStep?.timing) && <TimerBar targetTiming={currentStep?.timing} />}
          <div className="px-3 py-2 text-xs text-white/70">
            Open settings to re-enable the overlay UI.
          </div>
        </div>
      </div>
    );
  }

  const floatingStyle = config.floating_style;

  return (
    <div
      ref={containerRef}
      data-testid="overlay-container"
      className="inline-block p-1"
      style={{
        opacity,
        minWidth: 320,
        maxWidth: 600,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className={cn(
        "flex flex-col overflow-hidden",
        overlayPreset === "minimal"
          ? "floating-panel"
          : floatingStyle
            ? "floating-panel-pro"
            : "glass-panel"
      )}>
        {/* Draggable header */}
        <div
          className={cn(
            "flex items-center px-1.5 py-1 transition-colors",
            !floatingStyle && "border-b border-white/5"
          )}
        >
          {/* Settings button */}
          <button
            data-testid="settings-button"
            onClick={(e) => { e.stopPropagation(); showSettings(); }}
            className="p-1 rounded hover:bg-white/10 transition-all duration-200 settings-icon-hover group relative"
            title="Open Settings"
          >
            <Settings className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80" />
          </button>

          {/* Keyboard shortcuts button */}
          <KeyboardShortcutsOverlay />

          {/* Drag area in center */}
          <div
            data-testid="drag-handle"
            className="flex-1 flex items-center justify-center cursor-move hover:bg-white/5 rounded py-0.5"
            onMouseDown={startDrag}
            title={`Drag to move (${config.hotkeys.toggle_overlay} to hide)`}
          >
            <GripVertical className="w-4 h-4 text-white/25" />
            <span className="ml-1 text-[10px] text-white/40 hidden sm:inline">Drag</span>
          </div>

          {/* Status indicators */}
          <StatusIndicators
            onToggleClickThrough={toggleClickThroughWithUndo}
            clickThroughUndoActive={clickUndoState.active}
            onUndoClickThrough={undoClickThrough}
          />
        </div>

        {/* Timer bar - shows when timer is running or has delta */}
        {(isRunning || currentStep?.timing) && (
          <TimerBar targetTiming={currentStep?.timing} />
        )}

        <MatchupPanel />

        {/* Upgrade reminder badges */}
        <UpgradeBadges />

        {/* Content */}
        <BuildOrderDisplay />

        {/* Quick action bar */}
        <QuickActionBar />
      </div>

      {/* First launch onboarding */}
      <FirstLaunchOnboarding />
    </div>
  );
}
