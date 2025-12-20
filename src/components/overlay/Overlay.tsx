import { GripVertical, Settings } from "lucide-react";
import { useWindowDrag, useAutoResize, useTimer, useBuildOrderSync, useClickThroughUndo } from "@/hooks";
import { useOpacity, useConfigStore, useCurrentStep, useMetronomeStore, useCurrentBuildOrder } from "@/stores";
import { BuildOrderDisplay } from "./build-display/BuildOrderDisplay";
import { CompactOverlay } from "./CompactOverlay";
import { TimerBar } from "./TimerBar";
import { UpgradeBadges } from "./badges/UpgradeBadges";
import { ScoutGuide } from "./features/ScoutGuide";
import { QuickActionBar } from "./features/QuickActionBar";
import { StatusIndicators } from "./indicators/StatusIndicators";
import { SystemClock } from "./clock/SystemClock";
import { KeyboardShortcutsOverlay } from "./dialogs/KeyboardShortcutsOverlay";
import { FirstLaunchOnboarding } from "./dialogs/FirstLaunchOnboarding";
import { MatchupPanel } from "./features/MatchupPanel";
import { showSettings, saveConfig } from "@/lib/tauri";
import { cn } from "@/lib/utils";



export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const { isPulsing } = useMetronomeStore();
  const currentBuild = useCurrentBuildOrder();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();
  const { toggleWithUndo, undoClickThrough, undoActive } = useClickThroughUndo();
  const scale = config.ui_scale ?? 1;

  const coachOnly = config.coach_only_mode ?? false;
  const overlayPreset = config.overlay_preset ?? "info_dense";

  // Sync build orders when changed from settings window
  useBuildOrderSync();

  const civThemeClass = currentBuild
    ? `civ-theme-${currentBuild.civilization.toLowerCase().replace(/\s+/g, '-')}`
    : "civ-theme-default";

  // Show compact view if enabled
  if (config.compact_mode) {
    return <div className={civThemeClass}><CompactOverlay /></div>;
  }

  // Coach-only: keep audio/timers, hide build UI
  if (coachOnly) {
    const exitCoachMode = async () => {
      const next = { ...config, coach_only_mode: false };
      useConfigStore.getState().updateConfig({ coach_only_mode: false });
      try {
        await saveConfig(next);
      } catch (error) {
        console.error("Failed to persist coach-only toggle:", error);
      }
    };

    return (
      <div
        ref={containerRef}
        className="inline-block p-1"
        style={{
          opacity,
          minWidth: 320,
          maxWidth: 600,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div className={cn("flex flex-col overflow-hidden", "floating-panel-pro")}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Coach-only mode</p>
              <p className="text-xs text-white/60">
                Voice + timers stay active while hiding build steps.
              </p>
            </div>
            <button
              onClick={exitCoachMode}
              className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition"
            >
              Exit
            </button>
          </div>
          {(isRunning || currentStep?.timing) && <TimerBar targetTiming={currentStep?.timing} />}
          <div className="px-3 py-2 text-xs text-white/70">
            Open settings to re-enable the overlay UI.
          </div>
        </div>
      </div>
    );
  }

  const floatingStyle = config.floating_style;

  return (
    <div
      ref={containerRef}
      data-testid="overlay-container"
      className={cn("inline-block p-1 relative", civThemeClass)}
      style={{
        opacity,
        minWidth: 320,
        maxWidth: 600,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Metronome Pulse Effect */}
      {isPulsing && (
        <div className="absolute inset-1 pointer-events-none z-50 rounded-lg ring-2 ring-white/50 animate-pulse bg-white/5" />
      )}
      <div className={cn(
        "flex flex-col overflow-hidden",
        overlayPreset === "minimal"
          ? "floating-panel"
          : floatingStyle
            ? "floating-panel-pro"
            : "glass-panel"
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
            data-testid="settings-button"
            onClick={(e) => { e.stopPropagation(); showSettings(); }}
            className="p-1 rounded hover:bg-white/10 transition-all duration-200 settings-icon-hover group relative"
            title="Open Settings"
          >
            <Settings className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80" />
          </button>

          {config.show_clock && (
            <div className="ml-1 px-1 border-l border-white/10">
              <SystemClock />
            </div>
          )}

          {/* Keyboard shortcuts button */}
          <KeyboardShortcutsOverlay />

          {/* Drag area in center */}
          <div
            data-testid="drag-handle"
            className="flex-1 flex items-center justify-center cursor-move hover:bg-white/5 rounded py-0.5"
            onMouseDown={startDrag}
            title={`Drag to move (${config.hotkeys.toggle_overlay} to hide)`}
          >
            <GripVertical className="w-4 h-4 text-white/25" />
            <span className="ml-1 text-[10px] text-white/40 hidden sm:inline">Drag</span>
          </div>

          {/* Status indicators */}
          <StatusIndicators
            onToggleClickThrough={toggleWithUndo}
            clickThroughUndoActive={undoActive}
            onUndoClickThrough={undoClickThrough}
          />
        </div>

        {/* Timer bar - shows when timer is running or has delta */}
        {(isRunning || currentStep?.timing) && (
          <TimerBar targetTiming={currentStep?.timing} />
        )}

        <MatchupPanel />

        {/* Upgrade reminder badges */}
        <UpgradeBadges />

        {/* Content */}
        <BuildOrderDisplay />

        <ScoutGuide />

        {/* Quick action bar */}
        <QuickActionBar />
      </div>

      {/* First launch onboarding */}
      <FirstLaunchOnboarding />
    </div>
  );
}
