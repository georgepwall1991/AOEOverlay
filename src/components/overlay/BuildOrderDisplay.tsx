import { useBuildOrderStore, useCurrentBuildOrder, useActiveSteps, useActiveBranchId } from "@/stores";
import { BuildOrderStep } from "./BuildOrderStep";
import { BuildSelectorDropdown } from "./BuildSelectorDropdown";
import { logTelemetryEvent } from "@/lib/utils";
import { useTimer } from "@/hooks";

export function BuildOrderDisplay() {
  const currentOrder = useCurrentBuildOrder();
  const currentStepIndex = useBuildOrderStore((s) => s.currentStepIndex);
  const goToStep = useBuildOrderStore((s) => s.goToStep);
  const setActiveBranch = useBuildOrderStore((s) => s.setActiveBranch);
  const activeBranchId = useActiveBranchId();
  const activeSteps = useActiveSteps();
  const activeBranchName = currentOrder?.branches?.find((b) => b.id === activeBranchId)?.name;
  const { isRunning, start } = useTimer();

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
  const endIndex = Math.min(activeSteps.length, startIndex + visibleRange);
  const visibleSteps = activeSteps.slice(startIndex, endIndex);

  const progressPercent =
    activeSteps.length > 0 ? ((currentStepIndex + 1) / activeSteps.length) * 100 : 0;

  const handleBranchSelect = (branchId: string | null) => {
    setActiveBranch(branchId);
    logTelemetryEvent("action:branch:set", {
      source: "overlay",
      meta: { branchId, orderId: currentOrder.id },
    });
  };

  return (
    <div className="flex flex-col">
      {/* Header with build selector and progress */}
      <div className="px-2 py-2 flex items-center gap-2">
        {/* Build selector dropdown */}
        <BuildSelectorDropdown />

        {activeBranchName && (
          <span className="px-2 py-1 rounded-full text-[11px] bg-amber-500/15 text-amber-200 border border-amber-400/40">
            Branch: {activeBranchName}
          </span>
        )}

        {currentOrder.branches && currentOrder.branches.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => handleBranchSelect(null)}
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                !activeBranchId
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-200"
                  : "border-white/10 text-white/70 hover:border-white/30"
              }`}
            >
              Main
            </button>
            {currentOrder.branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchSelect(branch.id)}
                className={`px-2 py-1 rounded text-xs border transition-colors ${
                  activeBranchId === branch.id
                    ? "bg-amber-500/20 border-amber-500/60 text-amber-200"
                    : "border-white/10 text-white/70 hover:border-white/30"
                }`}
                title={branch.trigger ? `Trigger: ${branch.trigger}` : undefined}
              >
                {branch.name}
              </button>
            ))}
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-amber-400 tabular-nums">
            {activeSteps.length === 0 ? 0 : currentStepIndex + 1}/{activeSteps.length}
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
              onClick={() => {
                goToStep(actualIndex);
                if (!isRunning) start();
              }}
              compact
            />
          );
        })}
      </div>
    </div>
  );
}
