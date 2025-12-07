import { cn } from "@/lib/utils";

interface StepNumberProps {
  stepNumber: number;
  isActive: boolean;
  isPast: boolean;
  showHighlight?: boolean;
  compact?: boolean;
}

/**
 * Circular step number badge for build order steps.
 * Supports compact and full layouts with different sizes.
 */
export function StepNumber({
  stepNumber,
  isActive,
  isPast,
  showHighlight = false,
  compact = false,
}: StepNumberProps) {
  if (compact) {
    return (
      <span
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-200 mt-0.5",
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
    );
  }

  return (
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
  );
}
