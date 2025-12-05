import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { BuildOrderStep as StepType } from "@/types";
import { ResourceIndicator } from "./ResourceIndicator";

interface BuildOrderStepProps {
  step: StepType;
  stepNumber: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}

export function BuildOrderStep({
  step,
  stepNumber,
  isActive,
  isPast,
  onClick,
}: BuildOrderStepProps) {
  const [showHighlight, setShowHighlight] = useState(false);
  const wasActive = useRef(isActive);

  // Trigger animation when step becomes active
  useEffect(() => {
    if (isActive && !wasActive.current) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 400);
      return () => clearTimeout(timer);
    }
    wasActive.current = isActive;
  }, [isActive]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left transition-all duration-300 ease-out",
        isActive ? "step-card-active animate-pulse-glow" : "step-card",
        isPast && "opacity-40",
        !isActive && !isPast && "opacity-75 hover:opacity-100",
        showHighlight && "step-highlight-enter"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Step number badge */}
        <span
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
            isActive
              ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/20"
              : isPast
                ? "bg-white/10 text-white/40"
                : "bg-white/10 text-white/60",
            showHighlight && "step-number-pop"
          )}
        >
          {stepNumber}
        </span>

        <div className="flex-1 min-w-0">
          {/* Description */}
          <p
            className={cn(
              "text-sm leading-snug transition-colors duration-200",
              isActive ? "text-white font-medium" : "text-white/80"
            )}
          >
            {step.description}
          </p>

          {/* Timing and resources */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {step.timing && (
              <span className={cn(
                "timing-badge",
                isActive && "bg-amber-500/30"
              )}>
                {step.timing}
              </span>
            )}
            <ResourceIndicator resources={step.resources} />
          </div>
        </div>
      </div>
    </button>
  );
}
