import { useBuildOrderStore, useCurrentBuildOrder } from "@/stores";
import { BuildOrderStep } from "./BuildOrderStep";
import { BuildSelectorDropdown } from "./BuildSelectorDropdown";

export function BuildOrderDisplay() {
  const currentOrder = useCurrentBuildOrder();
  const currentStepIndex = useBuildOrderStore((s) => s.currentStepIndex);
  const goToStep = useBuildOrderStore((s) => s.goToStep);

  if (!currentOrder) {
    return (
      <div className="flex-1 flex items-center justify-center py-6">
        <div className="text-center">
          <p className="text-sm text-white/40 text-shadow-strong">
            No build orders loaded
          </p>
          <p className="text-xs text-white/20 mt-1">Add build orders in Settings</p>
        </div>
      </div>
    );
  }

  // Show steps around the current one
  const visibleRange = 3;
  const startIndex = Math.max(0, currentStepIndex - 1);
  const endIndex = Math.min(currentOrder.steps.length, startIndex + visibleRange);
  const visibleSteps = currentOrder.steps.slice(startIndex, endIndex);

  const progressPercent = ((currentStepIndex + 1) / currentOrder.steps.length) * 100;

  return (
    <div className="flex flex-col">
      {/* Header with build selector and progress */}
      <div className="px-2 py-2 flex items-center gap-2">
        {/* Build selector dropdown */}
        <BuildSelectorDropdown />

        {/* Progress indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-amber-400 tabular-nums">
            {currentStepIndex + 1}/{currentOrder.steps.length}
          </span>
        </div>
      </div>

      {/* Step list */}
      <div className="px-2 pb-2 space-y-1">
        {visibleSteps.map((step, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <BuildOrderStep
              key={step.id}
              step={step}
              stepNumber={actualIndex + 1}
              isActive={actualIndex === currentStepIndex}
              isPast={actualIndex < currentStepIndex}
              onClick={() => goToStep(actualIndex)}
              compact
            />
          );
        })}
      </div>
    </div>
  );
}
