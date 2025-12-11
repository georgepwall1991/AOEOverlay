import { useEffect, useState } from "react";
import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, RefreshCw, Lock, Unlock, Shield } from "lucide-react";
import { useBuildOrderStore, useConfigStore, useActiveSteps, useBadgeStore, useMatchupStore } from "@/stores";
import { useTimer } from "@/hooks";
import { cn, logTelemetryEvent } from "@/lib/utils";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hotkey: string;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  testId?: string;
}

function ActionButton({ onClick, disabled, hotkey, label, children, active, testId }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
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
  // Prevent double-execution during rapid clicks
  const [isResetting, setIsResetting] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const { isOpen, toggle } = useMatchupStore();

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
    if (resetLocked || isResetting) return;
    if (!resetConfirm) {
      armConfirm("reset");
      return;
    }
    // Prevent double-execution
    setIsResetting(true);
    clearConfirm("reset");
    setResetConfirm(false);
    resetSteps();
    reset();
    resetBadges();
    logTelemetryEvent("action:build:reset", { source: "quick-action-bar" });
    // Allow reset again after a short delay
    setTimeout(() => setIsResetting(false), 100);
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
    if (isCycling) return;
    if (!cycleConfirm) {
      armConfirm("cycle");
      return;
    }
    // Prevent double-execution
    setIsCycling(true);
    clearConfirm("cycle");
    setCycleConfirm(false);
    cycleBuildOrder();
    reset();
    resetBadges();
    logTelemetryEvent("action:build:cycle", { source: "quick-action-bar" });
    // Allow cycle again after a short delay
    setTimeout(() => setIsCycling(false), 100);
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
    <div data-testid="quick-action-bar" className="flex items-center justify-center gap-2 px-3 py-2 border-t border-white/5">
      {/* Matchup Panel Toggle */}
      <ActionButton
        onClick={toggle}
        hotkey=""
        label={isOpen ? "Hide Intel Report" : "Show Intel Report"}
        active={isOpen}
        testId="toggle-matchup-button"
      >
        <Shield className={cn("w-4.5 h-4.5", isOpen ? "text-amber-400" : "text-white/60 group-hover:text-amber-200")} />
      </ActionButton>

      {/* Reset lock */}
      <ActionButton
        onClick={() => setResetLocked((prev) => !prev)}
        hotkey=""
        label={resetLocked ? "Unlock reset" : "Lock reset"}
        active={resetLocked}
        testId="reset-lock-button"
      >
        {resetLocked ? (
          <Lock className="w-4.5 h-4.5 text-amber-400" />
        ) : (
          <Unlock className="w-4.5 h-4.5 text-white/60 group-hover:text-white/90" />
        )}
      </ActionButton>

      {/* Reset */}
      <button
        data-testid="reset-button"
        onClick={handleReset}
        disabled={resetLocked}
        className={cn(
          "p-1.5 rounded transition-all duration-200 group relative",
          "hover:bg-white/15 active:bg-white/20",
          "disabled:opacity-30 disabled:cursor-not-allowed"
        )}
        title={
          resetLocked
            ? "Reset (locked)"
            : resetConfirm
              ? "Confirm reset"
              : `Reset (${hotkeys.reset_build_order})`
        }
      >
        <SkipBack className="w-4.5 h-4.5 text-white/60 group-hover:text-white/90" />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {hotkeys.reset_build_order}
        </span>
      </button>

      {/* Previous */}
      <button
        data-testid="previous-step-button"
        onClick={handlePrevious}
        disabled={currentStepIndex === 0}
        className={cn(
          "p-1.5 rounded transition-all duration-200 group relative",
          "hover:bg-white/15 active:bg-white/20",
          "disabled:opacity-30 disabled:cursor-not-allowed"
        )}
        title={`Previous Step (${hotkeys.previous_step})`}
      >
        <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-white/90" />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {hotkeys.previous_step}
        </span>
      </button>

      {/* Play/Pause */}
      <button
        data-testid="play-pause-button"
        onClick={toggleTimer}
        className={cn(
          "p-1.5 rounded transition-all duration-200 group relative",
          "hover:bg-white/15 active:bg-white/20",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          (isRunning || isPaused) && "bg-amber-500/20 text-amber-400"
        )}
        title={`${playPauseLabel} (${hotkeys.toggle_pause})`}
      >
        {isRunning ? (
          <Pause className="w-5 h-5 text-amber-400" />
        ) : (
          <Play className="w-5 h-5 text-white/60 group-hover:text-white/90" />
        )}
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {hotkeys.toggle_pause}
        </span>
      </button>

      {/* Next */}
      <button
        data-testid="next-step-button"
        onClick={handleNext}
        disabled={currentStepIndex >= totalSteps - 1}
        className={cn(
          "p-1.5 rounded transition-all duration-200 group relative",
          "hover:bg-white/15 active:bg-white/20",
          "disabled:opacity-30 disabled:cursor-not-allowed"
        )}
        title={`Next Step (${hotkeys.next_step})`}
      >
        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white/90" />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {hotkeys.next_step}
        </span>
      </button>

      {/* Cycle Build */}
      <ActionButton
        onClick={handleCycleBuild}
        hotkey={hotkeys.cycle_build_order}
        label={cycleConfirm ? "Confirm cycle" : "Cycle Build Order"}
        testId="cycle-build-button"
      >
        <RefreshCw className="w-4.5 h-4.5 text-white/60 group-hover:text-white/90" />
      </ActionButton>
    </div>
  );
}
