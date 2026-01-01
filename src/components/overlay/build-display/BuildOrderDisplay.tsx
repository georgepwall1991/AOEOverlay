import { useState, useRef, useEffect } from "react";
import { useBuildOrderStore, useCurrentBuildOrder, useActiveSteps, useActiveBranchId } from "@/stores";
import { BuildOrderStep } from "./BuildOrderStep";
import { logTelemetryEvent, cn } from "@/lib/utils";
import { useTimer } from "@/hooks";
import { ActiveStepResources } from "../indicators/ActiveStepResources";

export function BuildOrderDisplay() {
  const currentOrder = useCurrentBuildOrder();
  const currentStepIndex = useBuildOrderStore((s) => s.currentStepIndex);
  const goToStep = useBuildOrderStore((s) => s.goToStep);
  const setActiveBranch = useBuildOrderStore((s) => s.setActiveBranch);
  const activeBranchId = useActiveBranchId();
  const activeSteps = useActiveSteps();
  const activeBranchName = currentOrder?.branches?.find((b) => b.id === activeBranchId)?.name;
  const { isRunning, start } = useTimer();
  
  // Celebration effect when step changes
  const [celebrating, setCelebrating] = useState(false);
  const prevStepRef = useRef(currentStepIndex);

  useEffect(() => {
    if (currentStepIndex > prevStepRef.current) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 800);
      prevStepRef.current = currentStepIndex;
      return () => clearTimeout(timer);
    }
    prevStepRef.current = currentStepIndex;
  }, [currentStepIndex]);

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

  const handleBranchSelect = (branchId: string | null) => {
    setActiveBranch(branchId);
    logTelemetryEvent("action:branch:set", {
      source: "overlay",
      meta: { branchId, orderId: currentOrder.id },
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Branch controls - Streamlined */}
      {(activeBranchName || (currentOrder.branches && currentOrder.branches.length > 0)) && (
        <div className="px-6 py-2 flex items-center gap-3 overflow-x-auto custom-scrollbar border-b border-white/[0.03] text-halo">
          {activeBranchName && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-200 border border-amber-400/40 whitespace-nowrap font-bold uppercase tracking-widest">
              {activeBranchName}
            </span>
          )}

          {currentOrder.branches && currentOrder.branches.length > 0 && (
            <div className="flex items-center gap-1.5 flex-nowrap">
              <button
                onClick={() => handleBranchSelect(null)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!activeBranchId
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
                  }`}
              >
                Base
              </button>
              {currentOrder.branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeBranchId === branch.id
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-white/40 hover:text-white/70"
                    }`}
                  title={branch.trigger ? `Trigger: ${branch.trigger}` : undefined}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hero Resources Section */}
      <div className="px-6 py-4 bg-gradient-to-b from-white/[0.02] to-transparent">
        <ActiveStepResources />
      </div>

      {/* Timeline list */}
      <div 
        data-testid="steps-container" 
        className={cn(
          "px-2 pb-6 space-y-1 overflow-y-auto flex-1 custom-scrollbar scroll-smooth relative",
          celebrating && "timeline-celebration"
        )}
      >
        {visibleSteps.map((step, idx) => {
          const actualIndex = startIndex + idx;
          const prevStep = actualIndex > 0 ? activeSteps[actualIndex - 1] : null;
          
          return (
            <BuildOrderStep
              key={step.id}
              step={step}
              isActive={actualIndex === currentStepIndex}
              isPast={actualIndex < currentStepIndex}
              previousResources={prevStep?.resources}
              onClick={() => {
                goToStep(actualIndex);
                if (!isRunning) start();
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
