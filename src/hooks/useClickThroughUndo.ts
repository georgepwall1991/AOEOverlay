import { useEffect, useRef, useState, useCallback } from "react";
import { useConfigStore } from "@/stores";
import { saveConfig, setClickThrough } from "@/lib/tauri";

// Duration of the undo window in milliseconds
const CLICK_THROUGH_UNDO_TIMEOUT = 5000;

interface ClickUndoState {
  active: boolean;
  revertTo: boolean;
}

/**
 * Hook that manages click-through toggle with undo capability.
 *
 * Provides:
 * - toggleWithUndo: Toggle click-through and allow undo for 5 seconds
 * - undoClickThrough: Revert to previous state if within undo window
 * - undoActive: Whether undo is currently available
 *
 * Handles:
 * - Syncing native click-through state with config
 * - Auto-expiring undo after timeout
 * - Clearing undo when config changes externally
 * - Timer generation to prevent stale callback issues
 */
export function useClickThroughUndo() {
  const { config, updateConfig } = useConfigStore();

  // Undo state - stores the state to revert to if undo is triggered
  const [clickUndoState, setClickUndoState] = useState<ClickUndoState>({
    active: false,
    revertTo: false,
  });
  const clickUndoTimerRef = useRef<number | null>(null);

  // Timer generation counter in ref (not module-level!) to prevent stale timers
  const timerGenerationRef = useRef(0);

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

  const toggleWithUndo = useCallback(() => {
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
    const currentGeneration = ++timerGenerationRef.current;

    // Auto-expire undo after timeout (with generation check to avoid race conditions)
    clickUndoTimerRef.current = window.setTimeout(() => {
      // Only clear if this timer's generation matches current
      if (currentGeneration === timerGenerationRef.current) {
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

  return {
    toggleWithUndo,
    undoClickThrough,
    undoActive: clickUndoState.active,
  };
}
