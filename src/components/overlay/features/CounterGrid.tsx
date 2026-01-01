import { useState } from "react";
import { Search, X, Swords, ShieldAlert, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCounterGridStore } from "@/stores";
import { UNITS, getUnitById } from "@/data/units";
import { GameIcon } from "../icons/GameIcons";
import { cn } from "@/lib/utils";

export function CounterGrid() {
  const { isOpen, setOpen, searchQuery, setSearchQuery } = useCounterGridStore();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredUnits = UNITS.filter((unit) =>
    unit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUnit = selectedUnitId ? getUnitById(selectedUnitId) : null;

  return (
    <div className="border-b border-white/10 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-md animate-slide-in relative overflow-hidden flex flex-col max-h-[400px]">
      <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-500/20 border border-purple-500/30">
            <Swords className="w-4 h-4 text-purple-300" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Counter Reference
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      <div className="px-3 py-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 bg-white/5 border-white/10 text-xs focus-visible:ring-purple-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Unit List */}
        <ScrollArea className="w-1/3 border-r border-white/5 pr-2 pl-3 py-2">
          <div className="space-y-1 pb-4">
            {filteredUnits.map((unit) => (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-left",
                  selectedUnitId === unit.id
                    ? "bg-purple-500/20 border border-purple-500/30"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <GameIcon type={unit.icon as any} size={16} />
                <span className="text-xs font-medium truncate">{unit.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Counter Details */}
        <ScrollArea className="flex-1 px-3 py-3">
          {selectedUnit ? (
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <GameIcon type={selectedUnit.icon as any} size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedUnit.name}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-tight">
                    {selectedUnit.category} Unit
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Weak Against (Hard Counters) */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wide">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Hard Counters (Weak Against)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-4">
                    {selectedUnit.hardCounters.map((id) => {
                      const counter = getUnitById(id);
                      return (
                        <div key={id} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                          <GameIcon type={(counter?.icon || id) as any} size={12} />
                          <span className="text-[11px] text-red-200">{counter?.name || id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Good Against */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                    <Target className="w-3 h-3" />
                    <span>Strong Against</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-4">
                    {selectedUnit.goodAgainst.map((id) => {
                      const target = getUnitById(id);
                      return (
                        <div key={id} className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                          <GameIcon type={(target?.icon || id) as any} size={12} />
                          <span className="text-[11px] text-emerald-200">{target?.name || id}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Soft Counters */}
                {selectedUnit.softCounters.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400/80 uppercase tracking-wide">
                      <Swords className="w-3 h-3" />
                      <span>Soft Counters</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-4">
                      {selectedUnit.softCounters.map((id) => {
                        const counter = getUnitById(id);
                        return (
                          <div key={id} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                            <GameIcon type={(counter?.icon || id) as any} size={12} />
                            <span className="text-[11px] text-amber-200">{counter?.name || id}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-10">
              <Swords className="w-10 h-10 mb-2" />
              <p className="text-xs">Select a unit to see its counters</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
