import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, RefreshCw } from "lucide-react";
import { useBuildOrderStore, useConfigStore } from "@/stores";
import { useTimer } from "@/hooks";
import { cn } from "@/lib/utils";

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
  const { isRunning, start, stop } = useTimer();
  const totalSteps = useBuildOrderStore((s) => {
    const order = s.buildOrders[s.currentOrderIndex];
    return order?.steps.length ?? 0;
  });

  const toggleTimer = () => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  const hotkeys = config.hotkeys;

  return (
    <div className="flex items-center justify-center gap-1 px-2 py-1 border-t border-white/5">
      {/* Reset */}
      <ActionButton
        onClick={resetSteps}
        hotkey={hotkeys.reset_build_order}
        label="Reset"
      >
        <SkipBack className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90" />
      </ActionButton>

      {/* Previous */}
      <ActionButton
        onClick={previousStep}
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
        label={isRunning ? "Pause Timer" : "Start Timer"}
        active={isRunning}
      >
        {isRunning ? (
          <Pause className="w-4 h-4 text-amber-400" />
        ) : (
          <Play className="w-4 h-4 text-white/60 group-hover:text-white/90" />
        )}
      </ActionButton>

      {/* Next */}
      <ActionButton
        onClick={nextStep}
        disabled={currentStepIndex >= totalSteps - 1}
        hotkey={hotkeys.next_step}
        label="Next Step"
      >
        <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/90" />
      </ActionButton>

      {/* Cycle Build */}
      <ActionButton
        onClick={cycleBuildOrder}
        hotkey={hotkeys.cycle_build_order}
        label="Cycle Build Order"
      >
        <RefreshCw className="w-3.5 h-3.5 text-white/60 group-hover:text-white/90" />
      </ActionButton>
    </div>
  );
}
