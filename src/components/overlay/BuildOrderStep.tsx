import { cn } from "@/lib/utils";
import type { BuildOrderStep as StepType } from "@/types";
import { ResourceIndicator } from "./ResourceIndicator";
import { StepNumber } from "./StepNumber";
import { StepTiming } from "./StepTiming";
import { useConfigStore } from "@/stores";
import { useStepHighlight } from "@/hooks/useStepHighlight";
import { useAdjustedTiming } from "@/hooks/useAdjustedTiming";
import { renderIconText } from "./GameIcons";

interface BuildOrderStepProps {
  step: StepType;
  stepNumber: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function BuildOrderStep({
  step,
  stepNumber,
  isActive,
  isPast,
  onClick,
  compact = false,
}: BuildOrderStepProps) {
  const { config } = useConfigStore();
  const floatingStyle = config.floating_style;
  const showHighlight = useStepHighlight(isActive);
  const { displayTiming, showDriftIndicator } = useAdjustedTiming(step, isActive, isPast);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-2 py-1.5 rounded-lg transition-all duration-200 step-hover-effect",
          isActive && "step-active-glow scale-[1.02] origin-left py-2",
          isPast && "opacity-35",
          !isActive && !isPast && "opacity-70 hover:opacity-90",
          showHighlight && "step-enter"
        )}
      >
        <div className="flex items-start gap-3">
          <StepNumber
            stepNumber={stepNumber}
            isActive={isActive}
            isPast={isPast}
            showHighlight={showHighlight}
            compact
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <StepTiming
                timing={step.timing}
                displayTiming={displayTiming}
                originalTiming={step.timing}
                isActive={isActive}
                showDriftIndicator={showDriftIndicator}
                compact
              />
              {step.resources && (
                <ResourceIndicator resources={step.resources} compact glow={isActive} />
              )}
            </div>

            <div
              className={cn(
                "text-base leading-snug transition-all duration-200 flex flex-wrap items-center gap-x-1",
                isActive ? "text-white font-medium" : "text-white/70",
                floatingStyle && "text-shadow-strong"
              )}
            >
              {renderIconText(step.description, 29)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left transition-all duration-300 ease-out p-2 rounded-lg",
        isActive ? "step-active-glow" : "step-card step-hover-effect",
        isPast && "opacity-40",
        !isActive && !isPast && "opacity-75 hover:opacity-100",
        showHighlight && "step-enter"
      )}
    >
      <div className="flex items-start gap-3">
        <StepNumber
          stepNumber={stepNumber}
          isActive={isActive}
          isPast={isPast}
        />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-snug transition-colors duration-200 flex items-center flex-wrap gap-1",
              isActive ? "text-white font-medium" : "text-white/80",
              floatingStyle && "text-shadow-strong"
            )}
          >
            {renderIconText(step.description, 24)}
          </p>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <StepTiming
              timing={step.timing}
              displayTiming={displayTiming}
              originalTiming={step.timing}
              isActive={isActive}
              showDriftIndicator={showDriftIndicator}
            />
            <ResourceIndicator resources={step.resources} glow={isActive} />
          </div>
        </div>
      </div>
    </button>
  );
}
