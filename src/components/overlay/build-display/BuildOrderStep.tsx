import { cn } from "@/lib/utils";
import type { BuildOrderStep as StepType } from "@/types";
import { ResourceIndicator } from "../indicators/ResourceIndicator";
import { VillagerDistributionBar } from "../indicators/VillagerDistributionBar";
import { useStepHighlight } from "@/hooks/useStepHighlight";
import { useAdjustedTiming } from "@/hooks/useAdjustedTiming";
import { renderIconText } from "../icons/GameIcons";

interface BuildOrderStepProps {
  step: StepType;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
  previousResources?: StepType["resources"];
}

export function BuildOrderStep({
  step,
  isActive,
  isPast,
  onClick,
  previousResources,
}: BuildOrderStepProps) {
  const showHighlight = useStepHighlight(isActive);
  const { displayTiming, showDriftIndicator } = useAdjustedTiming(step, isActive, isPast);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left transition-all duration-500 group relative py-3 px-4 rounded-xl",
        isActive ? "step-entry-active bg-white/[0.03] shadow-lg" : "hover:bg-white/[0.02]",
        isPast && "opacity-30 grayscale-[0.8] scale-[0.98]",
        !isActive && !isPast && "opacity-70",
        showHighlight && "animate-scale-in"
      )}
    >
      <div className="flex items-start gap-6">
        {/* Timeline Dot Integration */}
        <div className="flex flex-col items-center pt-2">
          <div className={cn(
            "timeline-dot",
            isActive && "timeline-dot-active"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Timing & Meta */}
          <div className="flex items-center gap-2 mb-1 text-halo">
            {step.timing && (
              <span className={cn(
                "font-mono text-[10px] font-bold tracking-widest uppercase",
                isActive ? "text-[hsl(var(--civ-color))]" : "text-white/30"
              )}>
                {displayTiming || step.timing}
              </span>
            )}
            {showDriftIndicator && (
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" title="Time adjusted for drift" />
            )}
          </div>

          {/* Description - Bold Hero Text */}
          <div className={cn(
            "leading-tight tracking-tight transition-colors text-halo",
            isActive ? "text-xl text-hero" : "text-sm font-semibold text-white/80"
          )}>
            {renderIconText(step.description, isActive ? 28 : 18)}
          </div>

          {/* Premium Resource Chips */}
          {step.resources && (
            <div className={cn(
              "flex flex-wrap gap-2 mt-3 transition-all duration-500",
              isActive ? "opacity-100 translate-y-0" : "opacity-60"
            )}>
              <ResourceIndicator 
                resources={step.resources} 
                previousResources={previousResources}
                compact={!isActive}
                glow={isActive} 
              />
            </div>
          )}

          {/* Distribution Bar - Subtle Inline */}
          {isActive && step.resources && (
            <div className="mt-4 pt-3 border-t border-white/[0.05] animate-slide-up">
              <VillagerDistributionBar resources={step.resources} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
