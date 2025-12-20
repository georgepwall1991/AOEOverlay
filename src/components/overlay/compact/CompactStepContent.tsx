import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResourceIndicator } from "../ResourceIndicator";
import { TimerBar } from "../TimerBar";
import { renderIconText } from "../GameIcons";
import { cn } from "@/lib/utils";
import type { BuildOrderStep } from "@/types";

interface CompactStepContentProps {
  currentStep: BuildOrderStep;
  nextStepPreview?: BuildOrderStep;
  currentStepIndex: number;
  totalSteps: number;
  fontSize: string;
  iconSize: number;
  paceDotClass: string;
  deltaCompact: string | null;
  isRunning: boolean;
  isPaused: boolean;
  animateStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onStart: () => void;
}

export function CompactStepContent({
  currentStep,
  nextStepPreview,
  currentStepIndex,
  totalSteps,
  fontSize,
  iconSize,
  paceDotClass,
  deltaCompact,
  isRunning,
  isPaused,
  animateStep,
  onPrevious,
  onNext,
  onStart,
}: CompactStepContentProps) {
  const handleNextStep = () => {
    if (!isRunning && !isPaused) {
      onStart();
    }
    onNext();
  };

  return (
    <div className={cn("p-2 pb-3", animateStep && "compact-step-animate")}>
      {/* Navigation, step counter, and timer */}
      <div
        className="flex items-center justify-between mb-2"
        data-testid="compact-nav-bar"
      >
        <button
          onClick={onPrevious}
          disabled={currentStepIndex === 0}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          data-testid="compact-prev-button"
        >
          <ChevronLeft className="w-6 h-6 text-white/80" />
        </button>

        <div className="flex items-center gap-3">
          <span
            className="text-lg font-mono font-bold text-amber-400 flex items-center gap-1.5"
            data-testid="compact-step-counter"
          >
            {currentStepIndex + 1}
            <span className="text-white/50">/{totalSteps}</span>
            <span
              className={cn("inline-block w-2.5 h-2.5 rounded-full", paceDotClass)}
              title={deltaCompact ? `Pace: ${deltaCompact}` : "Pace status"}
              data-testid="compact-pace-dot"
            />
          </span>
          {/* Compact timer display */}
          {(isRunning || currentStep?.timing) && (
            <TimerBar compact targetTiming={currentStep?.timing} />
          )}
        </div>

        <button
          onClick={handleNextStep}
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
          <span
            className="text-base px-2.5 py-1 rounded bg-amber-500/25 text-amber-300 font-mono font-bold flex-shrink-0 shadow-sm"
            data-testid="compact-timing-badge"
          >
            {currentStep.timing}
          </span>
        )}

        {/* Description */}
        <p
          className={cn(fontSize, "text-white leading-normal flex-1")}
          data-testid="compact-step-description"
        >
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
        <div
          className="mt-3 pt-2 border-t border-white/10"
          data-testid="compact-next-preview"
        >
          <div className="flex items-start gap-2">
            <span className="text-xs text-white/50 font-mono flex-shrink-0 pt-0.5">
              Next:
            </span>
            <span
              className="text-sm text-white/60 leading-normal break-words"
              data-testid="compact-next-description"
            >
              {renderIconText(nextStepPreview.description, 18)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
