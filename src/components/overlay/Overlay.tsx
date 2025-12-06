import { GripVertical, MousePointer2Off, Settings } from "lucide-react";
import { useWindowDrag, useAutoResize, useTimer } from "@/hooks";
import { useOpacity, useConfigStore, useCurrentStep } from "@/stores";
import { BuildOrderDisplay } from "./BuildOrderDisplay";
import { CompactOverlay } from "./CompactOverlay";
import { TimerBar } from "./TimerBar";
import { UpgradeBadges } from "./UpgradeBadges";
import { showSettings } from "@/lib/tauri";
import { cn } from "@/lib/utils";

export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();

  // Show compact view if enabled
  if (config.compact_mode) {
    return <CompactOverlay />;
  }

  const floatingStyle = config.floating_style;

  return (
    <div
      ref={containerRef}
      className="inline-block p-1"
      style={{ opacity, minWidth: 320, maxWidth: 600 }}
    >
      <div className={cn(
        "flex flex-col overflow-hidden",
        floatingStyle ? "floating-panel-pro" : "glass-panel"
      )}>
        {/* Draggable header */}
        <div
          className={cn(
            "flex items-center px-2 py-1 transition-colors cursor-move",
            !floatingStyle && "border-b border-white/5",
            config.click_through && !floatingStyle && "border-amber-500/20"
          )}
          onMouseDown={startDrag}
        >
          {/* Settings button */}
          <button
            onClick={(e) => { e.stopPropagation(); showSettings(); }}
            className="p-1 rounded hover:bg-white/10 transition-all duration-200 settings-icon-hover"
            title="Open Settings"
          >
            <Settings className="w-4 h-4 text-white/50 hover:text-white/80" />
          </button>

          {/* Drag indicator in center */}
          <div className="flex-1 flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-white/25" />
          </div>

          {/* Click-through indicator */}
          <div className="w-6 flex justify-end" title={config.click_through ? "Click-Through Mode" : undefined}>
            {config.click_through && (
              <MousePointer2Off className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Timer bar - shows when timer is running or has delta */}
        {(isRunning || currentStep?.timing) && (
          <TimerBar targetTiming={currentStep?.timing} />
        )}

        {/* Upgrade reminder badges */}
        <UpgradeBadges />

        {/* Content */}
        <BuildOrderDisplay />
      </div>
    </div>
  );
}
