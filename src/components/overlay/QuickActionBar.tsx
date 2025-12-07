import { useEffect, useState } from "react";
import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, RefreshCw, Lock, Unlock } from "lucide-react";
import { useBuildOrderStore, useConfigStore, useActiveSteps, useBadgeStore } from "@/stores";
import { useTimer } from "@/hooks";
import { cn, logTelemetryEvent } from "@/lib/utils";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hotkey: string;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}

function ActionButton({ onClick, disabled, hotkey, label, children, active }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded transition-all duration-200 group relative",
        "hover:bg-white/15 active:bg-white/20",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        active && "bg-amber-500/20 text-amber-400"
      )}
      title={`${label} (${hotkey})`}
    >
      {children}
      {/* Hotkey hint on hover */}
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {hotkey}
      </span>
    </button>
  );
}

export function QuickActionBar() {
  const { currentStepIndex, nextStep, previousStep, resetSteps, cycleBuildOrder } = useBuildOrderStore();
  const { config } = useConfigStore();
  const { isRunning, isPaused, start, pause, resume, reset } = useTimer();
  const activeSteps = useActiveSteps();
  const { resetBadges } = useBadgeStore();
  const totalSteps = activeSteps.length;
  const [resetLocked, setResetLocked] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [cycleConfirm, setCycleConfirm] = useState(false);
  const [resetTimeoutId, setResetTimeoutId] = useState<number | null>(null);
  const [cycleTimeoutId, setCycleTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutId) clearTimeout(resetTimeoutId);
      if (cycleTimeoutId) clearTimeout(cycleTimeoutId);
    };
  }, [resetTimeoutId, cycleTimeoutId]);

  const clearConfirm = (type: "reset" | "cycle") => {
    if (type === "reset" && resetTimeoutId) {
      clearTimeout(resetTimeoutId);
      setResetTimeoutId(null);
    }
    if (type === "cycle" && cycleTimeoutId) {
      clearTimeout(cycleTimeoutId);
      setCycleTimeoutId(null);
    }
  };

  const armConfirm = (type: "reset" | "cycle") => {
    clearConfirm(type);
    const id = window.setTimeout(() => {
      if (type === "reset") setResetConfirm(false);
      if (type === "cycle") setCycleConfirm(false);
    }, 3000);
    if (type === "reset") {
      setResetConfirm(true);
      setResetTimeoutId(id);
    } else {
      setCycleConfirm(true);
      setCycleTimeoutId(id);
    }
  };

  const handleReset = () => {
    if (resetLocked) return;
    if (!resetConfirm) {
      armConfirm("reset");
      return;
    }
    clearConfirm("reset");
    setResetConfirm(false);
    resetSteps();
    reset();
    resetBadges();
    logTelemetryEvent("action:build:reset", { source: "quick-action-bar" });
  };

  const handlePrevious = () => {
    previousStep();
    logTelemetryEvent("action:step:previous", { source: "quick-action-bar", meta: { step: currentStepIndex } });
  };

  const handleNext = () => {
    if (!isRunning && !isPaused) {
      start();
    }
    nextStep();
    logTelemetryEvent("action:step:next", { source: "quick-action-bar", meta: { step: currentStepIndex + 1 } });
  };

  const handleCycleBuild = () => {
    if (!cycleConfirm) {
      armConfirm("cycle");
      return;
    }
    clearConfirm("cycle");
    setCycleConfirm(false);
    cycleBuildOrder();
    reset();
    resetBadges();
    logTelemetryEvent("action:build:cycle", { source: "quick-action-bar" });
  };

  const playPauseLabel = isRunning ? "Pause Timer" : isPaused ? "Resume Timer" : "Start Timer";

  const toggleTimer = () => {
    if (isRunning) {
      pause();
      logTelemetryEvent("action:timer:pause", { source: "quick-action-bar" });
      return;
    }
    if (isPaused) {
      resume();
      logTelemetryEvent("action:timer:resume", { source: "quick-action-bar" });
      return;
    }
    start();
    logTelemetryEvent("action:timer:start", { source: "quick-action-bar" });
  };

  const hotkeys = config.hotkeys;

  return (
    <div className="flex items-center justify-center gap-1 px-2 py-1 border-t border-white/5">
      {/* Reset lock */}
      <ActionButton
        onClick={() => setResetLocked((prev) => !prev)}
        hotkey=""
        label={resetLocked ? "Unlock reset" : "Lock reset"}
        active={resetLocked}
      >
        {resetLocked ? (
          <Lock className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Unlock className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90" />
        )}
      </ActionButton>

      {/* Reset */}
      <ActionButton
        onClick={handleReset}
        hotkey={hotkeys.reset_build_order}
        label={
          resetLocked
            ? "Reset (locked)"
            : resetConfirm
              ? "Confirm reset"
              : "Reset"
        }
        disabled={resetLocked}
      >
        <SkipBack className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90" />
      </ActionButton>

      {/* Previous */}
      <ActionButton
        onClick={handlePrevious}
        disabled={currentStepIndex === 0}
        hotkey={hotkeys.previous_step}
        label="Previous Step"
      >
        <ChevronLeft className="w-4 h-4 text-white/60 group-hover:text-white/90" />
      </ActionButton>

      {/* Play/Pause */}
      <ActionButton
        onClick={toggleTimer}
        hotkey={hotkeys.toggle_pause}
        label={playPauseLabel}
        active={isRunning || isPaused}
      >
        {isRunning ? (
          <Pause className="w-4 h-4 text-amber-400" />
        ) : (
          <Play className="w-4 h-4 text-white/60 group-hover:text-white/90" />
        )}
      </ActionButton>

      {/* Next */}
      <ActionButton
        onClick={handleNext}
        disabled={currentStepIndex >= totalSteps - 1}
        hotkey={hotkeys.next_step}
        label="Next Step"
      >
        <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/90" />
      </ActionButton>

      {/* Cycle Build */}
      <ActionButton
        onClick={handleCycleBuild}
        hotkey={hotkeys.cycle_build_order}
        label={cycleConfirm ? "Confirm cycle" : "Cycle Build Order"}
      >
        <RefreshCw className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90" />
      </ActionButton>
    </div>
  );
}
