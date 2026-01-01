import { GripVertical, Settings } from "lucide-react";
import { useWindowDrag, useAutoResize, useTimer, useBuildOrderSync, useClickThroughUndo } from "@/hooks";
import { useOpacity, useConfigStore, useCurrentStep, useCurrentBuildOrder } from "@/stores";
import { BuildOrderDisplay } from "./build-display/BuildOrderDisplay";
import { BuildSelectorDropdown } from "./build-display/BuildSelectorDropdown";
import { CompactOverlay } from "./CompactOverlay";
import { TimerBar } from "./TimerBar";
import { UpgradeBadges } from "./badges/UpgradeBadges";
import { ScoutGuide } from "./features/ScoutGuide";
import { QuickActionBar } from "./features/QuickActionBar";
import { StatusIndicators } from "./indicators/StatusIndicators";
import { SystemClock } from "./clock/SystemClock";
import { KeyboardShortcutsOverlay } from "./dialogs/KeyboardShortcutsOverlay";
import { FirstLaunchOnboarding } from "./dialogs/FirstLaunchOnboarding";
import { PerformanceReport } from "./dialogs/PerformanceReport";
import { MatchupPanel } from "./features/MatchupPanel";
import { CounterGrid } from "./features/CounterGrid";
import { MacroCycleHUD } from "./indicators/MacroCycleHUD";
import { showSettings, saveConfig } from "@/lib/tauri";
import { cn } from "@/lib/utils";



export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const currentBuild = useCurrentBuildOrder();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();
  const { toggleWithUndo, undoClickThrough, undoActive } = useClickThroughUndo();
  const scale = config.ui_scale ?? 1;

  const coachOnly = config.coach_only_mode ?? false;

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

  return (
    <div
      ref={containerRef}
      data-testid="overlay-container"
      className={cn("inline-block p-2 relative group/overlay", civThemeClass)}
      style={{
        opacity,
        minWidth: 420,
        maxWidth: 800,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className="glass-v3 overflow-hidden relative shadow-2xl flex flex-col min-h-[300px]">
        {/* Dynamic Aura Background */}
        <div className="aura-bg">
          <div className="aura-spot" />
        </div>

        {/* Tactical Timeline Thread */}
        <div className="timeline-thread ml-[32px]" />

        {/* Draggable Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/[0.03] z-50">
          <div className="flex-1 flex items-center gap-3">
            <BuildSelectorDropdown />
            <MacroCycleHUD />
          </div>

          <div className="flex items-center gap-2">
            {config.show_clock && <SystemClock />}
            <button
              onClick={() => showSettings()}
              className="nav-pill"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <KeyboardShortcutsOverlay />
            <div
              data-tauri-drag-region
              onMouseDown={startDrag}
              className="nav-pill cursor-move hover:bg-white/10 transition-colors"
            >
              <GripVertical className="w-4 h-4 opacity-50" />
            </div>
          </div>
        </div>

        {/* Performance & Status Strip */}
        <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] border-b border-white/[0.03] z-10">
          <StatusIndicators
            onToggleClickThrough={toggleWithUndo}
            clickThroughUndoActive={undoActive}
            onUndoClickThrough={undoClickThrough}
          />
          {(isRunning || currentStep?.timing) && (
            <div className="flex-1 max-w-[200px] ml-4">
              <TimerBar targetTiming={currentStep?.timing} />
            </div>
          )}
        </div>

        {/* Feature Panels */}
        <div className="relative z-20">
          <MatchupPanel />
          <CounterGrid />
          <UpgradeBadges />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <BuildOrderDisplay />
          <ScoutGuide />
        </div>

        {/* Quick Footer Navigation */}
        <div className="mt-auto z-30 bg-gradient-to-t from-black/40 to-transparent">
          <QuickActionBar />
        </div>
      </div>

      {/* First launch onboarding */}
      <FirstLaunchOnboarding />

      {/* Post-game analytics */}
      <PerformanceReport />
    </div>
  );
}

