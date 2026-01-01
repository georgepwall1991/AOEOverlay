import { useState } from "react";
import { Shield, Swords, X, ChevronsDownUp, AlertTriangle, Target, Binoculars, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentBuildOrder, useMatchupStore, usePlayerStore } from "@/stores";
import { MATCHUPS } from "@/data/matchups";
import { CIVILIZATIONS, type Civilization } from "@/types";
import { logTelemetryEvent, cn } from "@/lib/utils";
import { Zap, Loader2 } from "lucide-react";

interface HeaderProps {
  isCollapsed?: boolean;
  playerCiv: string;
  defaultOpponent?: string;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
}

const Header = ({
  isCollapsed,
  playerCiv,
  defaultOpponent,
  onExpand,
  onCollapse,
  onClose,
}: HeaderProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "p-1.5 rounded-md flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30",
          !isCollapsed && "shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        )}
      >
        <Shield className="w-4 h-4 text-amber-300" />
      </div>
      <div>
        <p
          className={cn(
            "text-xs font-bold leading-tight uppercase tracking-wider text-amber-500/90"
          )}
        >
          Intel Report
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white text-shadow-strong">
            {playerCiv}
          </span>
          <span className="text-xs text-white/40">vs</span>
          {isCollapsed ? (
            <span className="text-sm font-bold text-amber-400 text-shadow-strong">
              {defaultOpponent || "Select"}
            </span>
          ) : (
            <span className="text-[10px] text-white/60 italic">
              {defaultOpponent ? "Opponent Analysis" : "Select Opponent"}
            </span>
          )}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-1">
      {isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="h-7 text-xs text-amber-200/70 hover:text-amber-100 hover:bg-amber-500/10"
        >
          Expand
        </Button>
      )}
      {!isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
          onClick={onCollapse}
          title="Collapse"
        >
          <ChevronsDownUp className="w-3.5 h-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-900/20"
        onClick={onClose}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

export function MatchupPanel() {
  const {
    isOpen,
    opponentCiv,
    isDetecting,
    setOpen,
    setOpponent,
    getOpponentFor,
    detectMatch,
  } = useMatchupStore();
  const { savedProfileId } = usePlayerStore();
  const currentOrder = useCurrentBuildOrder();
  const [collapsed, setCollapsed] = useState(false);

  if (!isOpen || !currentOrder) return null;

  const playerCiv = currentOrder.civilization;
  const rememberedOpponent = getOpponentFor(playerCiv);
  const defaultOpponent =
    opponentCiv ??
    rememberedOpponent ??
    MATCHUPS.find((entry) => entry.civ === playerCiv)?.opponent ??
    (CIVILIZATIONS.find((civ) => civ !== playerCiv) as Civilization | undefined);

  const matchup = MATCHUPS.find(
    (entry) => entry.civ === playerCiv && entry.opponent === defaultOpponent
  );

  const handleClose = () => {
    setOpen(false);
    logTelemetryEvent("action:matchup:close", { source: "overlay" });
  };

  const handleOpponentChange = (value: string) => {
    if (!value) return;
    setOpponent(playerCiv, value as Civilization);
    logTelemetryEvent("action:matchup:opponent", {
      source: "overlay",
      meta: { opponent: value },
    });
  };

  const handleAutoDetect = async () => {
    if (!savedProfileId) return;
    const success = await detectMatch(savedProfileId, playerCiv);
    logTelemetryEvent("action:matchup:auto-detect", { 
      source: "overlay", 
      meta: { success } 
    });
  };

  if (collapsed) {
    return (
      <div className="px-3 py-2 border-b border-white/5 bg-black/40 backdrop-blur-sm animate-fade-in">
        <Header
          isCollapsed
          playerCiv={playerCiv}
          defaultOpponent={defaultOpponent}
          onExpand={() => setCollapsed(false)}
          onCollapse={() => setCollapsed(true)}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-md animate-slide-in relative overflow-hidden group/matchup">
      {/* Tactical HUD Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/40 pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/40 pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-500/40 pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/40 pointer-events-none z-10" />

      {/* Intel Scanline pulse */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent h-1/2 w-full pointer-events-none animate-pulse -z-10" />

      {/* Decorative top sheen */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-50" />

      <div className="px-3 py-3 space-y-3">
        <Header
          playerCiv={playerCiv}
          defaultOpponent={defaultOpponent}
          onExpand={() => setCollapsed(false)}
          onCollapse={() => setCollapsed(true)}
          onClose={handleClose}
        />


        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 p-1 rounded-lg bg-black/40 border border-white/5">
            <div className="px-2 py-1">
              <Swords className="w-4 h-4 text-white/40" />
            </div>
            <Select value={defaultOpponent ?? ""} onValueChange={handleOpponentChange}>
              <SelectTrigger className="h-7 border-0 bg-transparent focus:ring-0 text-amber-100 font-medium text-xs">
                <SelectValue placeholder="Select opponent" />
              </SelectTrigger>
              <SelectContent className="border-amber-500/20 bg-black/95 text-amber-100">
                {CIVILIZATIONS.filter((civ) => civ !== playerCiv).map((civ) => (
                  <SelectItem key={civ} value={civ} className="focus:bg-amber-500/20 focus:text-amber-100">
                    {civ}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-detect button */}
          {savedProfileId && (
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-9 px-3 border-amber-500/30 text-amber-200 hover:bg-amber-500/10",
                isDetecting && "animate-pulse"
              )}
              onClick={handleAutoDetect}
              disabled={isDetecting}
              title="Detect ongoing match via AoE4World"
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1.5" />
                  Auto-Detect
                </>
              )}
            </Button>
          )}
        </div>

        {!matchup ? (
          <div className="py-4 text-center">
            <p className="text-xs text-white/50 italic">
              No tactical data available.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-60 pr-2 -mr-1 custom-scrollbar">
            <div className="grid gap-4 pb-2">
              {/* Primary Threats - High Priority */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-red-400/90">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Threats</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-red-500/20 to-transparent" />
                </div>
                <div className="grid gap-1.5">
                  {matchup.threats.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-white/90 pl-1">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 shrink-0 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Responses/Counters - Actionable */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-emerald-400/90">
                  <Target className="w-3 h-3" />
                  <span>Responses</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                </div>
                <div className="grid gap-1.5">
                  {matchup.responses.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-white/90 pl-1">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                  {matchup.counterTips?.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-emerald-100/80 pl-1 italic">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500/50 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scout & Timers - Info Grid */}
              <div className="grid grid-cols-1 gap-3">
                {matchup.scoutFor.length > 0 && (
                  <div className="space-y-1.5 bg-blue-500/5 rounded-md p-2 border border-blue-500/10">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-300">
                      <Binoculars className="w-3 h-3" />
                      <span>SCOUT FOR</span>
                    </div>
                    <ul className="space-y-1">
                      {matchup.scoutFor.map((item) => (
                        <li key={item} className="text-[11px] leading-tight text-blue-100/80 pl-1 border-l border-blue-500/30 ml-0.5">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {matchup.dangerTimers && matchup.dangerTimers.length > 0 && (
                  <div className="space-y-1.5 bg-amber-500/5 rounded-md p-2 border border-amber-500/10">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                      <Clock className="w-3 h-3" />
                      <span>CRITICAL TIMINGS</span>
                    </div>
                    <ul className="space-y-1">
                      {matchup.dangerTimers.map((item, idx) => (
                        <li key={idx} className="text-[11px] leading-tight text-amber-100/80 pl-1 border-l border-amber-500/30 ml-0.5 flex justify-between items-center">
                          <span>{item.message}</span>
                          <span className="font-mono text-[9px] text-amber-500/70">{item.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
