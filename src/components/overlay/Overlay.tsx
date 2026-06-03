import { GripVertical, Settings } from "lucide-react";
import { useAutoResize, useTimer, useBuildOrderSync, useClickThroughUndo } from "@/hooks";
import { useOpacity, useConfigStore, useCurrentStep, useCurrentBuildOrder, useGameStore } from "@/stores";
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
  const opacity = useOpacity();
  const { config } = useConfigStore();
  const currentBuild = useCurrentBuildOrder();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();
  const { toggleWithUndo, undoClickThrough, undoActive } = useClickThroughUndo();
  const gameDetected = useGameStore((s) => s.enabled && s.focused);
  const scale = config.ui_scale ?? 1;
  const overlayPreset = config.overlay_preset === "info_dense"
    ? "build-order"
    : config.overlay_preset ?? "build-order";

  const coachOnly = (config.coach_only_mode ?? false) || overlayPreset === "coach";
  const useCompactView = config.compact_mode || overlayPreset === "minimal";
  const showIntelPanels = overlayPreset === "matchup" || overlayPreset === "stream";
  const showScoutGuide = overlayPreset === "matchup";
  const maxWidth =
    overlayPreset === "stream" ? 960 : overlayPreset === "matchup" ? 820 : 680;

  // Sync build orders when changed from settings window
  useBuildOrderSync();

  const civThemeClass = currentBuild
    ? `civ-theme-${currentBuild.civilization
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`
    : "civ-theme-default";

  // Show compact view if enabled
  if (useCompactView) {
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
        maxWidth,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className={cn(
        "glass-v3 overflow-hidden relative shadow-2xl flex flex-col min-h-[300px]",
        `overlay-preset-${overlayPreset}`
      )}>
        {/* Dynamic Aura Background */}
        <div className="aura-bg">
          <div className="aura-spot" />
        </div>

        {/* Tactical Timeline Thread */}
        <div className="timeline-thread ml-[32px]" />

        {/* Draggable Header */}
        <div 
          data-tauri-drag-region
          className="flex items-center px-4 py-3 border-b border-white/[0.03] z-50 cursor-move"
        >
          <div className="flex-1 flex items-center gap-3 pointer-events-none" data-tauri-drag-region>
            <div className="pointer-events-auto">
              <BuildSelectorDropdown />
            </div>
            <div className="pointer-events-auto">
              <MacroCycleHUD />
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
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
              className="nav-pill opacity-50"
              data-tauri-drag-region
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Performance & Status Strip */}
        <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] border-b border-white/[0.03] z-10">
          <div className="flex items-center gap-2">
            {gameDetected && (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-300/90 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-2 py-0.5"
                title="AoE4 detected — overlay auto-hides when you tab away"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            )}
            <StatusIndicators
              onToggleClickThrough={toggleWithUndo}
              clickThroughUndoActive={undoActive}
              onUndoClickThrough={undoClickThrough}
            />
          </div>
          {(isRunning || currentStep?.timing) && (
            <div className="ml-4 min-w-[240px] max-w-[280px] flex-1">
              <TimerBar targetTiming={currentStep?.timing} />
            </div>
          )}
        </div>

        {/* Feature Panels */}
        <div className="relative z-20">
          {showIntelPanels && <MatchupPanel />}
          {showIntelPanels && <CounterGrid />}
          <UpgradeBadges />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <BuildOrderDisplay />
          {showScoutGuide && <ScoutGuide />}
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

