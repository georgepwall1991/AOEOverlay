import { cn } from "@/lib/utils";
import type { BuildOrderStep as StepType } from "@/types";
import { ResourceIndicator } from "../indicators/ResourceIndicator";
import { VillagerDistributionBar } from "../indicators/VillagerDistributionBar";
import { StepNumber } from "./StepNumber";
import { StepTiming } from "./StepTiming";
import { useConfigStore } from "@/stores";
import { useStepHighlight } from "@/hooks/useStepHighlight";
import { useAdjustedTiming } from "@/hooks/useAdjustedTiming";
import { renderIconText } from "../icons/GameIcons";

interface BuildOrderStepProps {
  step: StepType;
  stepNumber: number;
  isActive: boolean;
  isNext: boolean;
  isPast: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function BuildOrderStep({
  step,
  stepNumber,
  isActive,
  isNext,
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
        data-testid={`step-${stepNumber - 1}`}
        onClick={onClick}
        className={cn(
          "w-full text-left px-2 py-1.5 rounded-lg transition-all duration-300 step-hover-effect",
          isActive && "step-active-glow py-3 active-step active-step-themed",
          isNext && "step-next-up",
          isPast && "opacity-50 grayscale-[0.3]",
          !isActive && !isPast && !isNext && "opacity-75 hover:opacity-95",
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

            {isActive && step.resources && (
              <VillagerDistributionBar resources={step.resources} className="mb-2" />
            )}

            <div
              className={cn(
                "leading-snug transition-all duration-200 flex flex-wrap items-center gap-x-1 tracking-pro",
                isActive ? "text-base text-white font-black" : "text-xs text-white/85 font-semibold",
                floatingStyle && "text-shadow-strong"
              )}
            >
              {renderIconText(step.description, 24)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      data-testid={`step-${stepNumber - 1}`}
      onClick={onClick}
      className={cn(
        "w-full text-left transition-all duration-300 ease-out p-2 rounded-lg",
        isActive ? "step-active-glow py-4 active-step active-step-themed" : "step-card step-hover-effect",
        isNext && "step-next-up",
        isPast && "opacity-55 grayscale-[0.2]",
        !isActive && !isPast && !isNext && "opacity-85 hover:opacity-100",
        showHighlight && "step-enter"
      )}
    >
      <div className="flex items-start gap-3 relative z-10">
        <StepNumber
          stepNumber={stepNumber}
          isActive={isActive}
          isPast={isPast}
        />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "leading-snug transition-all duration-300 flex items-center flex-wrap gap-1.5 tracking-pro",
              isActive ? "text-lg text-white font-black tracking-pro-tight" : "text-[12px] text-white/90 font-semibold",
              floatingStyle && "text-shadow-strong"
            )}
          >
            {renderIconText(step.description, isActive ? 32 : 20)}
          </p>

          <div className={cn("flex items-center gap-3 mt-1.5 flex-wrap", isActive && "mt-2.5")}>
            <StepTiming
              timing={step.timing}
              displayTiming={displayTiming}
              originalTiming={step.timing}
              isActive={isActive}
              showDriftIndicator={showDriftIndicator}
            />
            <ResourceIndicator resources={step.resources} glow={isActive} />
          </div>

          {isActive && step.resources && (
            <VillagerDistributionBar resources={step.resources} className="mt-3" />
          )}
        </div>
      </div>
    </button>
  );
}
