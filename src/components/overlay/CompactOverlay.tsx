import { useEffect, useRef, useState } from "react";
import { useWindowDrag, useAutoResize, useTimer } from "@/hooks";
import {
  useOpacity,
  useConfigStore,
  useBuildOrderStore,
  useCurrentBuildOrder,
  useActiveSteps,
  useActiveBranchId,
} from "@/stores";
import { cn } from "@/lib/utils";
import { CompactHeader, CompactStepContent } from "./compact";

export function CompactOverlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config, updateConfig } = useConfigStore();
  const { currentStepIndex, nextStep, previousStep } = useBuildOrderStore();
  const currentBuildOrder = useCurrentBuildOrder();
  const activeSteps = useActiveSteps();
  const activeBranchId = useActiveBranchId();
  const activeBranchName = currentBuildOrder?.branches?.find(
    (b) => b.id === activeBranchId
  )?.name;
  const [animateStep, setAnimateStep] = useState(false);
  const prevStepIndex = useRef(currentStepIndex);
  const containerRef = useAutoResize();
  const { isRunning, isPaused, start, deltaStatus, deltaCompact } = useTimer();
  const scale = config.ui_scale ?? 1;

  // Font and icon sizing for compact mode - shrunk for pro HUD look
  const fontSize =
    config.font_size === "large"
      ? "text-base"
      : config.font_size === "small"
        ? "text-[11px]"
        : "text-sm";
  const iconSize =
    config.font_size === "large" ? 22 : config.font_size === "small" ? 16 : 18;

  const currentStep = activeSteps[currentStepIndex];
  const nextStepPreview = activeSteps[currentStepIndex + 1];
  const totalSteps = activeSteps.length;

  // Animate step change
  useEffect(() => {
    if (currentStepIndex !== prevStepIndex.current) {
      setAnimateStep(true);
      const timer = setTimeout(() => setAnimateStep(false), 250);
      prevStepIndex.current = currentStepIndex;
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex]);

  const paceDotClass = (() => {
    if (deltaStatus === "behind") return "bg-red-400";
    if (deltaStatus === "ahead") return "bg-emerald-400";
    if (deltaStatus === "on-pace") return "bg-amber-300";
    return "bg-white/30";
  })();

  const floatingStyle = config.floating_style;

  return (
    <div
      ref={containerRef}
      data-testid="compact-overlay"
      className="inline-block p-1 pb-2"
      style={{
        opacity,
        minWidth: 400,
        maxWidth: 800,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div
        className={cn(
          "flex flex-col",
          floatingStyle ? "floating-panel" : "glass-panel"
        )}
      >
        <CompactHeader
          config={config}
          updateConfig={updateConfig}
          buildOrderName={currentBuildOrder?.name}
          activeBranchName={activeBranchName}
          startDrag={startDrag}
        />

        {currentStep ? (
          <CompactStepContent
            currentStep={currentStep}
            nextStepPreview={nextStepPreview}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            fontSize={fontSize}
            iconSize={iconSize}
            paceDotClass={paceDotClass}
            deltaCompact={deltaCompact}
            isRunning={isRunning}
            isPaused={isPaused}
            animateStep={animateStep}
            onPrevious={previousStep}
            onNext={nextStep}
            onStart={start}
          />
        ) : (
          <div className="p-2 text-center">
            <p className="text-xs text-white/40">No build order selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
