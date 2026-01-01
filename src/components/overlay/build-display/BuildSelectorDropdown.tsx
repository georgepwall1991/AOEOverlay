import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { useBuildOrderStore, useCurrentBuildOrder } from "@/stores";
import { CivBadge } from "../badges/CivBadge";
import { cn } from "@/lib/utils";

export function BuildSelectorDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentBuildOrder = useCurrentBuildOrder();
  const { buildOrders, currentOrderIndex, setCurrentOrderIndex } = useBuildOrderStore();
  
  // Get enabled build orders and filter by search
  const filteredBuilds = buildOrders
    .filter(b => b.enabled)
    .filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.civilization.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const currentBuildId = buildOrders[currentOrderIndex]?.id;

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
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
      {/* Sleek Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 w-full px-2 py-1 rounded-xl transition-all duration-300 group",
          "hover:bg-white/[0.04]",
          isOpen && "bg-white/[0.06]"
        )}
      >
        <CivBadge civilization={currentBuildOrder.civilization} size="md" glow />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 leading-none mb-1">
            Current Protocol
          </p>
          <h2 className="text-sm font-bold text-white truncate leading-none">
            {currentBuildOrder.name}
          </h2>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-white/20 transition-transform duration-500",
          isOpen && "rotate-180 text-white/60"
        )} />
      </button>

      {/* Command Palette Overlay */}
      {isOpen && (
        <div className="fixed inset-x-2 top-16 z-[100] animate-in fade-in zoom-in-95 duration-300">
          <div className="command-palette rounded-2xl overflow-hidden max-w-lg mx-auto">
            {/* Zen Search Header */}
            <div className="px-4 py-4 border-b border-white/[0.05]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  ref={searchInputRef}
                  placeholder="Type civilization or build name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full h-12 pl-12 pr-4 rounded-xl text-lg font-medium text-white",
                    "bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-[hsl(var(--civ-color))]/40"
                  )}
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
              {filteredBuilds.length > 0 ? (
                <div className="grid grid-cols-1 gap-1 px-2">
                  {filteredBuilds.map((build) => (
                    <button
                      key={build.id}
                      onClick={() => handleSelect(build.id)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group",
                        build.id === currentBuildId 
                          ? "bg-[hsl(var(--civ-color))]/10 border border-[hsl(var(--civ-color))]/20" 
                          : "hover:bg-white/[0.04] border border-transparent"
                      )}
                    >
                      <CivBadge civilization={build.civilization} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-[hsl(var(--civ-color))] transition-colors">
                          {build.name}
                        </p>
                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
                          {build.civilization} • {build.difficulty}
                        </p>
                      </div>
                      {build.id === currentBuildId && (
                        <Check className="w-5 h-5 text-[hsl(var(--civ-color))] shadow-glow" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-white/20 text-sm italic">No matching builds found</p>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/[0.05] flex justify-between items-center">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {filteredBuilds.length} Builds Available
              </span>
              <div className="flex items-center gap-4 text-[10px] font-bold text-white/40">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">ESC</kbd> Close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
