import { useState } from "react";
import { Shield, Swords, X, ChevronsDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCurrentBuildOrder, useMatchupStore } from "@/stores";
import { MATCHUPS } from "@/data/matchups";
import { CIVILIZATIONS, type Civilization } from "@/types";
import { logTelemetryEvent } from "@/lib/utils";

export function MatchupPanel() {
  const { isOpen, opponentCiv, setOpen, setOpponent, getOpponentFor } = useMatchupStore();
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

  if (collapsed) {
    return (
      <div className="px-3 py-2 border-b border-white/10 bg-black/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/15 border border-amber-500/40">
            <Shield className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-sm text-white/80">
            {playerCiv} vs {defaultOpponent || "Select"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(false)}>
            Expand
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
            <X className="w-4 h-4 text-white/70" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-b border-white/10 bg-black/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/15 border border-amber-500/40">
            <Shield className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Matchup Cheat Sheet</p>
            <p className="text-[11px] text-white/60">
              {playerCiv} vs {defaultOpponent || "Select an opponent"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)} title="Collapse">
            <ChevronsDownUp className="w-4 h-4 text-white/70" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
            <X className="w-4 h-4 text-white/70" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-white/50" />
        <Select value={defaultOpponent ?? ""} onValueChange={handleOpponentChange}>
          <SelectTrigger className="h-8 w-[220px]">
            <SelectValue placeholder="Select opponent" />
          </SelectTrigger>
          <SelectContent>
            {CIVILIZATIONS.filter((civ) => civ !== playerCiv).map((civ) => (
              <SelectItem key={civ} value={civ}>
                {civ}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!matchup ? (
        <p className="text-xs text-white/60">
          No matchup tips yet for this pairing. Add your notes in the build description for now.
        </p>
      ) : (
        <ScrollArea className="max-h-52 pr-1">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px]">Threats</Badge>
              <ul className="space-y-1 text-white/80">
                {matchup.threats.map((item) => (
                  <li key={item} className="list-disc ml-4">{item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px]">Responses</Badge>
              <ul className="space-y-1 text-white/80">
                {matchup.responses.map((item) => (
                  <li key={item} className="list-disc ml-4">{item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px]">Scout For</Badge>
              <ul className="space-y-1 text-white/80">
                {matchup.scoutFor.map((item) => (
                  <li key={item} className="list-disc ml-4">{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {(matchup.counterTips || matchup.dangerTimers) && (
            <div className="grid grid-cols-2 gap-3 text-xs mt-3">
              {matchup.counterTips && (
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px]">Counters</Badge>
                  <ul className="space-y-1 text-white/80">
                    {matchup.counterTips.map((item) => (
                      <li key={item} className="list-disc ml-4">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {matchup.dangerTimers && (
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px]">Eco danger timers</Badge>
                  <ul className="space-y-1 text-white/80">
                    {matchup.dangerTimers.map((item) => (
                      <li key={item} className="list-disc ml-4">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

