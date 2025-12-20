import { GripVertical, MousePointer2Off, Settings, Maximize2 } from "lucide-react";
import { SystemClock } from "../clock/SystemClock";
import { showSettings, toggleCompactMode as tauriToggleCompactMode } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import type { AppConfig } from "@/types";

interface CompactHeaderProps {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  buildOrderName?: string;
  activeBranchName?: string;
  startDrag: (e: React.MouseEvent) => void;
}

export function CompactHeader({
  config,
  updateConfig,
  buildOrderName,
  activeBranchName,
  startDrag,
}: CompactHeaderProps) {
  const floatingStyle = config.floating_style;

  const handleToggleCompact = async () => {
    try {
      const next = await tauriToggleCompactMode();
      updateConfig({ compact_mode: next });
    } catch (error) {
      console.error("Failed to toggle compact mode:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-1 py-1 transition-colors",
        !floatingStyle && "border-b border-white/10",
        config.click_through && !floatingStyle && "border-amber-500/30"
      )}
    >
      {/* Expand button */}
      <button
        onClick={handleToggleCompact}
        className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
        title="Expand Mode (F6)"
      >
        <Maximize2 className="w-3 h-3 text-white/60 hover:text-white/90" />
      </button>

      {/* Settings button */}
      <button
        onClick={() => showSettings()}
        className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
        title="Open Settings"
      >
        <Settings className="w-3 h-3 text-white/60 hover:text-white/90" />
      </button>

      {config.show_clock && (
        <div className="px-1 border-r border-white/10">
          <SystemClock showIcon={false} />
        </div>
      )}

      {/* Drag area */}
      <div
        className="flex-1 flex items-center gap-1 cursor-move hover:bg-white/5 px-1"
        onMouseDown={startDrag}
      >
        <GripVertical className="w-3 h-3 text-white/40 flex-shrink-0" />
        {buildOrderName && (
          <span className="text-[10px] text-white/60 truncate font-medium">
            {buildOrderName}
          </span>
        )}
        {activeBranchName && (
          <span className="text-[9px] text-amber-300 truncate">
            • {activeBranchName}
          </span>
        )}
      </div>

      {config.click_through && (
        <span title="Click-Through Mode">
          <MousePointer2Off className="w-3 h-3 text-amber-500 flex-shrink-0" />
        </span>
      )}
    </div>
  );
}
