import { ScrollArea } from "@/components/ui/scroll-area";
import { useBuildOrderStore, useCurrentBuildOrder } from "@/stores";
import { BuildOrderStep } from "./BuildOrderStep";
import { CivBadge } from "./CivBadge";

export function BuildOrderDisplay() {
  const currentOrder = useCurrentBuildOrder();
  const currentStepIndex = useBuildOrderStore((s) => s.currentStepIndex);
  const goToStep = useBuildOrderStore((s) => s.goToStep);

  if (!currentOrder) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-sm text-white/40">No build orders loaded</p>
          <p className="text-xs text-white/20 mt-1">Add build orders in Settings</p>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStepIndex + 1) / currentOrder.steps.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold truncate">{currentOrder.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <CivBadge civilization={currentOrder.civilization} />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {currentOrder.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1.5">
          {currentOrder.steps.map((step, index) => (
            <BuildOrderStep
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isActive={index === currentStepIndex}
              isPast={index < currentStepIndex}
              onClick={() => goToStep(index)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/50 font-mono">
            {currentStepIndex + 1} / {currentOrder.steps.length}
          </span>
          <div className="flex items-center gap-2 text-white/30">
            <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">F2</kbd>
            <span>/</span>
            <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">F3</kbd>
            <span className="ml-1">navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
