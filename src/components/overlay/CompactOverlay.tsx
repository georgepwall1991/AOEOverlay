import { useEffect, useRef, useState } from "react";
import { GripVertical, ChevronLeft, ChevronRight, MousePointer2Off, Settings } from "lucide-react";
import { useWindowDrag } from "@/hooks";
import { useOpacity, useConfigStore, useBuildOrderStore, useCurrentBuildOrder } from "@/stores";
import { ResourceIndicator } from "./ResourceIndicator";
import { showSettings } from "@/lib/tauri";
import { cn } from "@/lib/utils";

export function CompactOverlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const { currentStepIndex, nextStep, previousStep } = useBuildOrderStore();
  const currentBuildOrder = useCurrentBuildOrder();
  const [animateStep, setAnimateStep] = useState(false);
  const prevStepIndex = useRef(currentStepIndex);

  const currentStep = currentBuildOrder?.steps[currentStepIndex];
  const totalSteps = currentBuildOrder?.steps.length ?? 0;

  // Animate step change
  useEffect(() => {
    if (currentStepIndex !== prevStepIndex.current) {
      setAnimateStep(true);
      const timer = setTimeout(() => setAnimateStep(false), 250);
      prevStepIndex.current = currentStepIndex;
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex]);

  return (
    <div className="w-full h-full p-2" style={{ opacity }}>
      <div className="glass-panel w-full flex flex-col overflow-hidden">
        {/* Compact drag handle */}
        <div
          className={cn(
            "flex items-center gap-1 px-1 py-1 border-b border-white/10 transition-colors",
            config.click_through && "border-amber-500/30"
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
          </div>

          {config.click_through && (
            <span title="Click-Through Mode">
              <MousePointer2Off className="w-3 h-3 text-amber-500 flex-shrink-0" />
            </span>
          )}
        </div>

        {/* Current step display */}
        {currentStep ? (
          <div className={cn("p-2", animateStep && "compact-step-animate")}>
            {/* Navigation and step counter */}
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white/70" />
              </button>

              <span className="text-xs text-white/50 font-mono">
                {currentStepIndex + 1}/{totalSteps}
              </span>

              <button
                onClick={nextStep}
                disabled={currentStepIndex >= totalSteps - 1}
                className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Step content */}
            <div className="flex items-start gap-2">
              {/* Timing badge */}
              {currentStep.timing && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono flex-shrink-0">
                  {currentStep.timing}
                </span>
              )}

              {/* Description */}
              <p className="text-xs text-white leading-tight flex-1">
                {currentStep.description}
              </p>
            </div>

            {/* Resources */}
            {currentStep.resources && (
              <div className="flex gap-2 mt-1.5">
                <ResourceIndicator resources={currentStep.resources} compact />
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
