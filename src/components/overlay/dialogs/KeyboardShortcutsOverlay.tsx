import { useState, useEffect } from "react";
import { X, Keyboard, Lightbulb } from "lucide-react";
import { useConfigStore } from "@/stores";
import { cn } from "@/lib/utils";

interface ShortcutRowProps {
  hotkey: string;
  description: string;
}

function ShortcutRow({ hotkey, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/70">{description}</span>
      <kbd className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-amber-400">
        {hotkey}
      </kbd>
    </div>
  );
}

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const { config } = useConfigStore();
  const hotkeys = config.hotkeys;

  // Listen for ? key to toggle shortcuts overlay
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check for ? (Shift + /)
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Close on Escape
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-hide practice hints after 10s or on first interaction (key or click)
  useEffect(() => {
    const timer = window.setTimeout(() => setShowHints(false), 10_000);
    const handleFirstInteraction = () => setShowHints(false);
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    window.addEventListener("mousedown", handleFirstInteraction, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("mousedown", handleFirstInteraction);
    };
  }, []);

  if (!isOpen) {
    return (
      <>
        {/* Practice hints bubble */}
        {showHints && (
          <div className="fixed right-3 top-14 z-40 max-w-xs rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm shadow-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Practice hints</span>
            </div>
            <div className="space-y-1 text-[11px] text-white/80">
              <div className="flex items-center justify-between">
                <span>Next step</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-amber-300">{hotkeys.next_step}</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Previous step</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-amber-300">{hotkeys.previous_step}</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Pause timer</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-amber-300">{hotkeys.toggle_pause}</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Click-through</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-amber-300">{hotkeys.toggle_click_through}</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <button
                className="underline decoration-dotted hover:text-white"
                onClick={() => setShowHints(false)}
              >
                Got it
              </button>
              <button
                className="underline decoration-dotted hover:text-white"
                onClick={() => setShowHints(true)}
                title="Hints will reappear next launch automatically"
              >
                Keep visible
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="p-1 rounded hover:bg-white/10 transition-colors group relative"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-black/90 text-[9px] text-white/70 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ?
          </span>
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        "w-80 max-w-[90vw] rounded-xl overflow-hidden shadow-2xl",
        "bg-slate-900/98 border border-white/10"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-4 py-2">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Navigation</div>
          <ShortcutRow hotkey={hotkeys.previous_step} description="Previous Step" />
          <ShortcutRow hotkey={hotkeys.next_step} description="Next Step" />
          <ShortcutRow hotkey={hotkeys.reset_build_order} description="Reset to Step 1" />
          <ShortcutRow hotkey={hotkeys.cycle_build_order} description="Cycle Build Order" />

          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2 mt-4">Timer</div>
          <ShortcutRow hotkey={hotkeys.toggle_pause} description="Start/Pause Timer" />

          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2 mt-4">Display</div>
          <ShortcutRow hotkey={hotkeys.toggle_overlay} description="Show/Hide Overlay" />
          <ShortcutRow hotkey={hotkeys.toggle_compact} description="Toggle Compact Mode" />
          <ShortcutRow hotkey={hotkeys.toggle_click_through} description="Toggle Click-Through" />

          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2 mt-4">Help</div>
          <ShortcutRow hotkey="?" description="Show This Help" />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-white/40 text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-400 font-mono">Esc</kbd> or <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-400 font-mono">?</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
