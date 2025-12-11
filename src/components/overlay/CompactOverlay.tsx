import { useEffect, useRef, useState } from "react";
import { GripVertical, ChevronLeft, ChevronRight, MousePointer2Off, Settings } from "lucide-react";
import { useWindowDrag, useAutoResize, useTimer } from "@/hooks";
import { useOpacity, useConfigStore, useBuildOrderStore, useCurrentBuildOrder, useActiveSteps, useActiveBranchId } from "@/stores";
import { ResourceIndicator } from "./ResourceIndicator";
import { TimerBar } from "./TimerBar";
import { renderIconText } from "./GameIcons";
import { showSettings } from "@/lib/tauri";
import { cn } from "@/lib/utils";

export function CompactOverlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const { currentStepIndex, nextStep, previousStep } = useBuildOrderStore();
  const currentBuildOrder = useCurrentBuildOrder();
  const activeSteps = useActiveSteps();
  const activeBranchId = useActiveBranchId();
  const activeBranchName = currentBuildOrder?.branches?.find((b) => b.id === activeBranchId)?.name;
  const [animateStep, setAnimateStep] = useState(false);
  const prevStepIndex = useRef(currentStepIndex);
  const containerRef = useAutoResize();
  const { isRunning, isPaused, start, deltaStatus, deltaCompact } = useTimer();
  const scale = config.ui_scale ?? 1;
  // Larger fonts for compact mode since we only show one step
  const fontSize =
    config.font_size === "large"
      ? "text-lg"
      : config.font_size === "small"
        ? "text-sm"
        : "text-base";

  // Icon sizes for compact mode (larger than regular overlay)
  const iconSize = config.font_size === "large" ? 24 : config.font_size === "small" ? 18 : 22;

  const currentStep = activeSteps[currentStepIndex];
  const nextStepPreview = activeSteps[currentStepIndex + 1];
  const totalSteps = activeSteps.length;

  // Animate step change
  useEffect(() => {
    if (currentStepIndex !== prevStepIndex.current) {
      setAnimateStep(true);
      const timer = setTimeout(() => setAnimateStep(false), 250);
      prevStepIndex.current = currentStepIndex;
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex]);

  const paceDotClass = (() => {
    if (deltaStatus === "behind") return "bg-red-400";
    if (deltaStatus === "ahead") return "bg-emerald-400";
    if (deltaStatus === "on-pace") return "bg-amber-300";
    return "bg-white/30";
  })();

  const floatingStyle = config.floating_style;

  return (
    <div
      ref={containerRef}
      data-testid="compact-overlay"
      className="inline-block p-1 pb-2"
      style={{
        opacity,
        minWidth: 320,
        maxWidth: 600,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className={cn(
        "flex flex-col",
        floatingStyle ? "floating-panel" : "glass-panel"
      )}>
        {/* Compact drag handle */}
        <div
          className={cn(
            "flex items-center gap-1 px-1 py-1 transition-colors",
            !floatingStyle && "border-b border-white/10",
            config.click_through && !floatingStyle && "border-amber-500/30"
          )}
        >
          {/* Settings button */}
          <button
            onClick={() => showSettings()}
            className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            title="Open Settings"
          >
            <Settings className="w-3 h-3 text-white/60 hover:text-white/90" />
          </button>

          {/* Drag area */}
          <div
            className="flex-1 flex items-center gap-1 cursor-move hover:bg-white/5 px-1"
            onMouseDown={startDrag}
          >
            <GripVertical className="w-3 h-3 text-white/40 flex-shrink-0" />
            {currentBuildOrder && (
              <span className="text-[10px] text-white/60 truncate font-medium">
                {currentBuildOrder.name}
              </span>
            )}
            {activeBranchName && (
              <span className="text-[9px] text-amber-300 truncate">
                • {activeBranchName}
              </span>
            )}
          </div>

          {config.click_through && (
            <span title="Click-Through Mode">
              <MousePointer2Off className="w-3 h-3 text-amber-500 flex-shrink-0" />
            </span>
          )}
        </div>

        {/* Current step display */}
        {currentStep ? (
          <div className={cn("p-2 pb-3", animateStep && "compact-step-animate")}>
            {/* Navigation, step counter, and timer */}
            <div className="flex items-center justify-between mb-2" data-testid="compact-nav-bar">
              <button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                data-testid="compact-prev-button"
              >
                <ChevronLeft className="w-6 h-6 text-white/80" />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-lg font-mono font-bold text-amber-400 flex items-center gap-1.5" data-testid="compact-step-counter">
                  {currentStepIndex + 1}<span className="text-white/50">/{totalSteps}</span>
                  <span
                    className={cn(
                      "inline-block w-2.5 h-2.5 rounded-full",
                      paceDotClass
                    )}
                    title={
                      deltaCompact
                        ? `Pace: ${deltaCompact}`
                        : "Pace status"
                    }
                    data-testid="compact-pace-dot"
                  />
                </span>
                {/* Compact timer display */}
                {(isRunning || currentStep?.timing) && (
                  <TimerBar compact targetTiming={currentStep?.timing} />
                )}
              </div>

              <button
                onClick={() => {
                  if (!isRunning && !isPaused) {
                    start();
                  }
                  nextStep();
                }}
                disabled={currentStepIndex >= totalSteps - 1}
                className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                data-testid="compact-next-button"
              >
                <ChevronRight className="w-6 h-6 text-white/80" />
              </button>
            </div>

            {/* Step content */}
            <div className="flex items-start gap-3" data-testid="compact-step-content">
              {/* Timing badge */}
              {currentStep.timing && (
                <span className="text-base px-2.5 py-1 rounded bg-amber-500/25 text-amber-300 font-mono font-bold flex-shrink-0 shadow-sm" data-testid="compact-timing-badge">
                  {currentStep.timing}
                </span>
              )}

              {/* Description */}
              <p className={cn(fontSize, "text-white leading-normal flex-1")} data-testid="compact-step-description">
                {renderIconText(currentStep.description, iconSize)}
              </p>
            </div>

            {/* Resources */}
            {currentStep.resources && (
              <div className="flex gap-2 mt-1.5" data-testid="compact-resources">
                <ResourceIndicator resources={currentStep.resources} compact glow />
              </div>
            )}

            {/* Next step preview */}
            {nextStepPreview && (
              <div className="mt-3 pt-2 border-t border-white/10" data-testid="compact-next-preview">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-white/50 font-mono flex-shrink-0 pt-0.5">Next:</span>
                  <span className="text-sm text-white/60 leading-normal break-words" data-testid="compact-next-description">
                    {renderIconText(nextStepPreview.description, 18)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 text-center">
            <p className="text-xs text-white/40">No build order selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
