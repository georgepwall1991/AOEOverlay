import { GripVertical, Settings } from "lucide-react";
import { useWindowDrag, useAutoResize, useTimer, useBuildOrderSync } from "@/hooks";
import { useOpacity, useConfigStore, useCurrentStep } from "@/stores";
import { BuildOrderDisplay } from "./BuildOrderDisplay";
import { CompactOverlay } from "./CompactOverlay";
import { TimerBar } from "./TimerBar";
import { UpgradeBadges } from "./UpgradeBadges";
import { QuickActionBar } from "./QuickActionBar";
import { StatusIndicators } from "./StatusIndicators";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";
import { FirstLaunchOnboarding } from "./FirstLaunchOnboarding";
import { showSettings } from "@/lib/tauri";
import { cn } from "@/lib/utils";

export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();

  // Sync build orders when changed from settings window
  useBuildOrderSync();

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
            "flex items-center px-1.5 py-1 transition-colors",
            !floatingStyle && "border-b border-white/5"
          )}
        >
          {/* Settings button */}
          <button
            onClick={(e) => { e.stopPropagation(); showSettings(); }}
            className="p-1 rounded hover:bg-white/10 transition-all duration-200 settings-icon-hover group relative"
            title="Open Settings"
          >
            <Settings className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80" />
          </button>

          {/* Keyboard shortcuts button */}
          <KeyboardShortcutsOverlay />

          {/* Drag area in center */}
          <div
            className="flex-1 flex items-center justify-center cursor-move hover:bg-white/5 rounded py-0.5"
            onMouseDown={startDrag}
            title={`Drag to move (${config.hotkeys.toggle_overlay} to hide)`}
          >
            <GripVertical className="w-4 h-4 text-white/25" />
          </div>

          {/* Status indicators */}
          <StatusIndicators />
        </div>

        {/* Timer bar - shows when timer is running or has delta */}
        {(isRunning || currentStep?.timing) && (
          <TimerBar targetTiming={currentStep?.timing} />
        )}

        {/* Upgrade reminder badges */}
        <UpgradeBadges />

        {/* Content */}
        <BuildOrderDisplay />

        {/* Quick action bar */}
        <QuickActionBar />
      </div>

      {/* First launch onboarding */}
      <FirstLaunchOnboarding />
    </div>
  );
}
