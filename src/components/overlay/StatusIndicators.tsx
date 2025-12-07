import { useEffect, useState } from "react";
import { Volume2, VolumeX, MousePointer2Off, MousePointer2, Minimize2, Maximize2, Swords } from "lucide-react";
import { useTTS } from "@/hooks";
import { useConfigStore, useMatchupStore } from "@/stores";
import { cn, logTelemetryEvent } from "@/lib/utils";

interface StatusIndicatorsProps {
  onToggleClickThrough?: () => void;
  clickThroughUndoActive?: boolean;
  onUndoClickThrough?: () => void;
}

interface StatusIconProps {
  active: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  label: string;
  hotkey?: string;
  onClick?: () => void;
}

function StatusIcon({ active, activeIcon, inactiveIcon, label, hotkey, onClick }: StatusIconProps) {
  const title = hotkey ? `${label} (${hotkey})` : label;

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1 rounded transition-all group relative",
        onClick && "hover:bg-white/10 cursor-pointer",
        !onClick && "cursor-default"
      )}
      title={title}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-amber-400" : "text-white/30"
      )}>
        {active ? activeIcon : inactiveIcon}
      </span>
      {/* Hotkey hint */}
      {hotkey && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-black/90 text-[9px] text-white/70 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {hotkey}
        </span>
      )}
    </button>
  );
}

export function StatusIndicators({
  onToggleClickThrough,
  clickThroughUndoActive,
  onUndoClickThrough,
}: StatusIndicatorsProps) {
  const { isSpeaking } = useTTS();
  const [speaking, setSpeaking] = useState(false);
  const { config, updateConfig } = useConfigStore();
  const voiceEnabled = config.voice?.enabled ?? false;
  const clickThrough = config.click_through;
  const compactMode = config.compact_mode;
  const { isOpen: matchupOpen, toggle: toggleMatchup } = useMatchupStore();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSpeaking(isSpeaking());
    }, 300);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const toggleVoice = () => {
    updateConfig({
      voice: {
        ...config.voice!,
        enabled: !voiceEnabled,
      },
    });
  };

  const toggleClickThrough = () => {
    if (onToggleClickThrough) {
      onToggleClickThrough();
    } else {
      updateConfig({ click_through: !clickThrough });
    }
  };

  const toggleCompact = () => {
    updateConfig({ compact_mode: !compactMode });
  };

  const handleMatchupToggle = () => {
    toggleMatchup();
    logTelemetryEvent("action:matchup:toggle", { source: "overlay", meta: { open: !matchupOpen } });
  };

  return (
    <div className="flex items-center gap-1">
      {speaking && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[11px] text-amber-100">
          <Volume2 className="w-3 h-3" />
          Speaking
        </span>
      )}

      {/* Voice status */}
      <StatusIcon
        active={voiceEnabled}
        activeIcon={<Volume2 className="w-3.5 h-3.5" />}
        inactiveIcon={<VolumeX className="w-3.5 h-3.5" />}
        label={voiceEnabled ? "Voice On" : "Voice Off"}
        onClick={toggleVoice}
      />

      {/* Click-through status */}
      <StatusIcon
        active={clickThrough}
        activeIcon={<MousePointer2Off className="w-3.5 h-3.5" />}
        inactiveIcon={<MousePointer2 className="w-3.5 h-3.5" />}
        label={clickThrough ? "Click-Through On" : "Click-Through Off"}
        hotkey={config.hotkeys.toggle_click_through}
        onClick={toggleClickThrough}
      />

      {/* Compact mode status */}
      <StatusIcon
        active={compactMode}
        activeIcon={<Minimize2 className="w-3.5 h-3.5" />}
        inactiveIcon={<Maximize2 className="w-3.5 h-3.5" />}
        label={compactMode ? "Compact Mode" : "Expanded Mode"}
        hotkey={config.hotkeys.toggle_compact}
        onClick={toggleCompact}
      />

      {/* Matchup cheat sheet toggle */}
      <StatusIcon
        active={matchupOpen}
        activeIcon={<Swords className="w-3.5 h-3.5" />}
        inactiveIcon={<Swords className="w-3.5 h-3.5" />}
        label="Matchup cheat sheet"
        onClick={handleMatchupToggle}
      />

      {clickThroughUndoActive && onUndoClickThrough && (
        <button
          onClick={onUndoClickThrough}
          className="ml-2 px-2 py-1 rounded text-[10px] bg-white/10 text-white/80 hover:bg-white/15 border border-white/10 transition"
        >
          Undo click-through
        </button>
      )}
    </div>
  );
}
