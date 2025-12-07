import { useEffect, useRef, useState } from "react";
import { GripVertical, Settings, MousePointer2, MousePointer2Off } from "lucide-react";
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
import { MatchupPanel } from "./MatchupPanel";
import { showSettings, saveConfig, setClickThrough } from "@/lib/tauri";
import { cn } from "@/lib/utils";

function StatusPill({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-colors",
        active
          ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-50"
          : "bg-white/5 border-white/15 text-white/70 hover:border-white/30"
      )}
    >
      <span className="w-3.5 h-3.5 text-current">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config, updateConfig } = useConfigStore();
  const containerRef = useAutoResize();
  const currentStep = useCurrentStep();
  const { isRunning } = useTimer();
  const scale = config.ui_scale ?? 1;
  const coachOnly = config.coach_only_mode ?? false;
  const overlayPreset = config.overlay_preset ?? "info_dense";
  const [clickUndoActive, setClickUndoActive] = useState(false);
  const clickUndoTimer = useRef<number | null>(null);
  const lastClickThrough = useRef<boolean>(config.click_through);

  useEffect(() => {
    return () => {
      if (clickUndoTimer.current) {
        clearTimeout(clickUndoTimer.current);
      }
    };
  }, []);

  // Keep native click-through in sync with config (so settings window is clickable)
  useEffect(() => {
    setClickThrough(config.click_through).catch((error) =>
      console.error("Failed to apply click-through:", error)
    );
  }, [config.click_through]);

  const toggleClickThroughWithUndo = () => {
    lastClickThrough.current = config.click_through;
    updateConfig({ click_through: !config.click_through });
    setClickUndoActive(true);
    if (clickUndoTimer.current) {
      clearTimeout(clickUndoTimer.current);
    }
    clickUndoTimer.current = window.setTimeout(() => setClickUndoActive(false), 5000);
  };

  const undoClickThrough = () => {
    if (!clickUndoActive) return;
    if (clickUndoTimer.current) {
      clearTimeout(clickUndoTimer.current);
      clickUndoTimer.current = null;
    }
    updateConfig({ click_through: lastClickThrough.current });
    setClickUndoActive(false);
  };

  // Sync build orders when changed from settings window
  useBuildOrderSync();

  // Show compact view if enabled
  if (config.compact_mode) {
    return <CompactOverlay />;
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
      className="inline-block p-1"
      style={{
        opacity,
        minWidth: 320,
        maxWidth: 600,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
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
            <span className="ml-1 text-[10px] text-white/40 hidden sm:inline">Drag</span>
          </div>

          {/* Status indicators */}
          <StatusIndicators
            onToggleClickThrough={toggleClickThroughWithUndo}
            clickThroughUndoActive={clickUndoActive}
            onUndoClickThrough={undoClickThrough}
          />
        </div>

        {/* Explicit state pills */}
        <div className="px-2 pb-2 flex items-center gap-2 flex-wrap">
          <StatusPill
            active={config.click_through}
            label={config.click_through ? "Click-through on" : "Click-through off"}
            onClick={toggleClickThroughWithUndo}
            icon={config.click_through ? <MousePointer2Off className="w-3.5 h-3.5" /> : <MousePointer2 className="w-3.5 h-3.5" />}
          />
          <span className="text-[11px] text-white/50">
            Press {config.hotkeys.toggle_click_through} to toggle during play.
          </span>
          {clickUndoActive && (
            <button
              onClick={undoClickThrough}
              className="text-[11px] px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/15 border border-white/10 transition"
            >
              Undo click-through
            </button>
          )}
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

        {/* Quick action bar */}
        <QuickActionBar />
      </div>

      {/* First launch onboarding */}
      <FirstLaunchOnboarding />
    </div>
  );
}
