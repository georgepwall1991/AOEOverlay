import { GripVertical, MousePointer2Off, Settings } from "lucide-react";
import { useWindowDrag } from "@/hooks";
import { useOpacity, useConfigStore } from "@/stores";
import { BuildOrderDisplay } from "./BuildOrderDisplay";
import { CompactOverlay } from "./CompactOverlay";
import { showSettings } from "@/lib/tauri";
import { cn } from "@/lib/utils";

export function Overlay() {
  const { startDrag } = useWindowDrag();
  const opacity = useOpacity();
  const { config } = useConfigStore();

  // Show compact view if enabled
  if (config.compact_mode) {
    return <CompactOverlay />;
  }

  return (
    <div
      className="w-full h-full p-2"
      style={{ opacity }}
    >
      <div className="glass-panel w-full h-full flex flex-col overflow-hidden">
        {/* Drag handle with status indicators */}
        <div
          className={cn(
            "flex items-center justify-between px-2 py-1 border-b border-white/10 transition-colors relative",
            config.click_through && "border-amber-500/30"
          )}
        >
          {/* Settings button */}
          <button
            onClick={() => showSettings()}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Open Settings"
          >
            <Settings className="w-4 h-4 text-white/60 hover:text-white/90" />
          </button>

          {/* Drag handle */}
          <div
            className="flex-1 flex items-center justify-center cursor-move hover:bg-white/5 py-1"
            onMouseDown={startDrag}
          >
            <GripVertical className="w-4 h-4 text-white/40" />
          </div>

          {/* Click-through indicator */}
          <div className="w-6 flex justify-end" title={config.click_through ? "Click-Through Mode" : undefined}>
            {config.click_through && (
              <MousePointer2Off className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>

        {/* Content */}
        <BuildOrderDisplay />
      </div>
    </div>
  );
}
