import { useState, useEffect } from "react";
import { X, Keyboard, ChevronRight, Volume2, MousePointer2Off } from "lucide-react";
import { useConfigStore } from "@/stores";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "aoe4-overlay-onboarding-seen";

interface TipProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  hotkey?: string;
}

function Tip({ icon, title, description, hotkey }: TipProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          {hotkey && (
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-amber-400">
              {hotkey}
            </kbd>
          )}
        </div>
        <p className="text-xs text-white/60 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function FirstLaunchOnboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const { config } = useConfigStore();

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeen) {
      // Slight delay before showing
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={cn(
        "w-96 max-w-[90vw] rounded-xl overflow-hidden shadow-2xl",
        "bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/20"
      )}>
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>

          <h2 className="text-xl font-bold text-gradient-gold">Welcome to AoE4 Overlay!</h2>
          <p className="text-sm text-white/60 mt-1">Here's how to get the most out of your build order assistant</p>
        </div>

        {/* Tips */}
        <div className="px-4 py-4 space-y-2">
          <Tip
            icon={<ChevronRight className="w-4 h-4" />}
            title="Navigate Steps"
            description="Use hotkeys to move through your build order while gaming"
            hotkey={`${config.hotkeys.previous_step} / ${config.hotkeys.next_step}`}
          />

          <Tip
            icon={<Keyboard className="w-4 h-4" />}
            title="Quick Help"
            description="Press ? anytime to see all keyboard shortcuts"
            hotkey="?"
          />

          <Tip
            icon={<Volume2 className="w-4 h-4" />}
            title="Voice Narration"
            description="Steps are read aloud automatically (toggle in status bar)"
          />

          <Tip
            icon={<MousePointer2Off className="w-4 h-4" />}
            title="Click-Through Mode"
            description="Overlay won't block your game clicks"
            hotkey={config.hotkeys.toggle_click_through}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 bg-black/20">
          <button
            onClick={handleDismiss}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-medium transition-all",
              "bg-gradient-to-r from-amber-500 to-amber-600 text-black",
              "hover:from-amber-400 hover:to-amber-500",
              "active:scale-[0.98]"
            )}
          >
            Got it, let's go!
          </button>
        </div>
      </div>
    </div>
  );
}

// Export function to reset onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
