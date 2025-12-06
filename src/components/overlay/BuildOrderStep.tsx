import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { BuildOrderStep as StepType } from "@/types";
import { ResourceIndicator } from "./ResourceIndicator";
import { useConfigStore } from "@/stores";
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
  const [showHighlight, setShowHighlight] = useState(false);
  const wasActive = useRef(isActive);
  const { config } = useConfigStore();
  const floatingStyle = config.floating_style;

  // Trigger animation when step becomes active
  useEffect(() => {
    if (isActive && !wasActive.current) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 500);
      return () => clearTimeout(timer);
    }
    wasActive.current = isActive;
  }, [isActive]);

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
        <div className="flex items-start gap-2">
          {/* Step number */}
          <span
            className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 mt-0.5",
              isActive
                ? "step-number-glow text-black"
                : isPast
                  ? "bg-white/10 text-white/30"
                  : "bg-white/15 text-white/60",
              showHighlight && "step-number-pop-enter"
            )}
          >
            {stepNumber}
          </span>

          {/* Content wrapper */}
          <div className="flex-1 min-w-0">
            {/* Top row: timing + resources */}
            <div className="flex items-center gap-2 mb-0.5">
              {step.timing && (
                <span className={cn(
                  "flex-shrink-0 text-xs px-2 py-0.5 rounded font-mono font-bold",
                  isActive
                    ? "bg-amber-500/40 text-amber-200 border border-amber-400/50"
                    : "bg-black/40 text-white/60 border border-white/20"
                )}
                style={isActive ? { textShadow: '0 0 8px rgba(251, 191, 36, 0.8)' } : undefined}
                >
                  {step.timing}
                </span>
              )}
              {step.resources && (
                <ResourceIndicator resources={step.resources} compact glow={isActive} />
              )}
            </div>

            {/* Description - now wraps */}
            <div
              className={cn(
                "text-sm leading-snug transition-all duration-200 flex flex-wrap items-center gap-x-1",
                isActive ? "text-white font-medium" : "text-white/70",
                floatingStyle && "text-shadow-strong"
              )}
            >
              {renderIconText(step.description, 22)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Full layout (non-compact)
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
        <span
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300",
            isActive
              ? "step-number-glow text-black"
              : isPast
                ? "bg-white/10 text-white/40"
                : "bg-white/15 text-white/60"
          )}
        >
          {stepNumber}
        </span>

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
            {step.timing && (
              <span className={isActive ? "timing-badge-glow" : "timing-badge"}>
                {step.timing}
              </span>
            )}
            <ResourceIndicator resources={step.resources} glow={isActive} />
          </div>
        </div>
      </div>
    </button>
  );
}
