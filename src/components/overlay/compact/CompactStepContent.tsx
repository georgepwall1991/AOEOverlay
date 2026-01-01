import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResourceIndicator } from "../indicators/ResourceIndicator";
import { TimerBar } from "../TimerBar";
import { renderIconText } from "../icons/GameIcons";
import { cn } from "@/lib/utils";
import type { BuildOrderStep } from "@/types";

interface CompactStepContentProps {
  currentStep: BuildOrderStep;
  nextStepPreview?: BuildOrderStep;
  previousResources?: BuildOrderStep["resources"];
  currentStepIndex: number;
  totalSteps: number;
  fontSize: string;
  iconSize: number;
  paceDotClass: string;
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
  previousResources,
  currentStepIndex,
  totalSteps,
  fontSize,
  iconSize,
  paceDotClass,
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
    <div className={cn("p-1.5", animateStep && "compact-step-animate")}>
      <div className="glass-pill flex items-center justify-between gap-4 py-2 px-4 min-h-[56px]">
        {/* Navigation - Left */}
        <button
          onClick={onPrevious}
          disabled={currentStepIndex === 0}
          className="p-1 rounded-full hover:bg-white/20 disabled:opacity-20 transition-all active:scale-95 group/nav"
          data-testid="compact-prev-button"
        >
          <ChevronLeft className="w-6 h-6 text-white group-hover/nav:-translate-x-0.5 transition-transform" />
        </button>

        {/* Central Content - HUD Style */}
        <div className="flex-1 flex items-center justify-center gap-4">
          {/* Step Counter & Pace */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Step</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-amber-100 leading-none">
                {currentStepIndex + 1}
              </span>
              <span className="text-xs font-bold text-white/30 leading-none pt-1">/{totalSteps}</span>
              <div
                className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]", paceDotClass)}
                data-testid="compact-pace-dot"
              />
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Timing & Description */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {currentStep.timing && (
                <span className="text-xs font-black text-amber-400 font-mono tracking-tighter">
                  [{currentStep.timing}]
                </span>
              )}
              <p className={cn("text-white font-black leading-tight flex-1 flex flex-wrap gap-x-1 items-center tracking-pro text-shadow-strong", fontSize)}>
                {renderIconText(currentStep.description, iconSize + 4)}
              </p>
            </div>

            {/* Active Step Resources Integrated */}
            {currentStep.resources && (
              <div className="flex items-center gap-2.5 opacity-90 scale-90 origin-left -mt-0.5">
                <ResourceIndicator 
                  resources={currentStep.resources} 
                  previousResources={previousResources}
                  compact 
                  glow 
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Right */}
        <button
          onClick={handleNextStep}
          disabled={currentStepIndex >= totalSteps - 1}
          className="p-1 rounded-full hover:bg-white/20 disabled:opacity-20 transition-all active:scale-95 group/nav"
          data-testid="compact-next-button"
        >
          <ChevronRight className="w-6 h-6 text-white group-hover/nav:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Progress Bar - Minimalist Bridge */}
      <div className="px-6 mt-1.5 opacity-50">
        <TimerBar compact targetTiming={currentStep?.timing} />
      </div>

      {/* Next Step Preview Hook */}
      {nextStepPreview && (
        <div className="mt-1.5 px-6 flex items-center gap-2 animate-fade-in">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Next Up:</span>
          <span className="text-[11px] font-bold text-white/50 truncate">
            {renderIconText(nextStepPreview.description, 16)}
          </span>
        </div>
      )}
    </div>
  );
}
