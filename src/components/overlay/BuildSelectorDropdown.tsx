import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useBuildOrderStore, useConfigStore, useCurrentBuildOrder } from "@/stores";
import { CivBadge } from "./CivBadge";
import { cn } from "@/lib/utils";

export function BuildSelectorDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentBuildOrder = useCurrentBuildOrder();
  const { buildOrders, currentOrderIndex, setCurrentOrderIndex } = useBuildOrderStore();
  const { config } = useConfigStore();
  const floatingStyle = config.floating_style;
  const currentBuildId = buildOrders[currentOrderIndex]?.id;

  // Get enabled build orders
  const enabledBuilds = buildOrders.filter(b => b.enabled);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  if (!currentBuildOrder) return null;

  const handleSelect = (buildId: string) => {
    const index = buildOrders.findIndex(b => b.id === buildId);
    if (index !== -1) {
      setCurrentOrderIndex(index);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative flex-1 min-w-0">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 w-full px-1 py-0.5 rounded transition-colors group",
          "hover:bg-white/10",
          isOpen && "bg-white/10"
        )}
        title={`Select Build Order (${config.hotkeys.cycle_build_order} to cycle)`}
      >
        <CivBadge civilization={currentBuildOrder.civilization} size="md" glow />
        <h2 data-testid="build-order-title" className={cn(
          "text-sm font-bold truncate flex-1 text-left",
          floatingStyle ? "text-gradient-gold" : "text-white"
        )}>
          {currentBuildOrder.name}
        </h2>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-white/40 transition-transform flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown menu */}
      {isOpen && enabledBuilds.length > 1 && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 z-50",
          "rounded-lg overflow-hidden shadow-xl",
          "border border-white/10",
          floatingStyle ? "bg-black/95" : "bg-slate-900/98"
        )}>
          <div className="max-h-64 overflow-y-auto py-1">
            {enabledBuilds.map((build) => (
              <button
                key={build.id}
                onClick={() => handleSelect(build.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 transition-colors text-left",
                  "hover:bg-white/10",
                  build.id === currentBuildId && "bg-amber-500/10"
                )}
              >
                <CivBadge civilization={build.civilization} size="sm" />
                <span className={cn(
                  "flex-1 text-sm truncate",
                  build.id === currentBuildId ? "text-amber-400 font-medium" : "text-white/80"
                )}>
                  {build.name}
                </span>
                {build.id === currentBuildId && (
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div className="px-3 py-1.5 border-t border-white/5 bg-black/20">
            <span className="text-[10px] text-white/40 font-mono">
              Press {config.hotkeys.cycle_build_order} to cycle
            </span>
          </div>
        </div>
      )}

      {/* Single build indicator */}
      {isOpen && enabledBuilds.length <= 1 && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 z-50",
          "rounded-lg overflow-hidden shadow-xl",
          "border border-white/10 px-3 py-2",
          floatingStyle ? "bg-black/95" : "bg-slate-900/98"
        )}>
          <span className="text-xs text-white/50">
            No other builds enabled. Add more in Settings.
          </span>
        </div>
      )}
    </div>
  );
}
