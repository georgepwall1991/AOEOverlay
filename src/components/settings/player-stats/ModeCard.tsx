import { cn } from "@/lib/utils";
import { getModeName, type PlayerModeStats } from "@/types/aoe4world";

interface ModeCardProps {
  mode: string;
  stats: PlayerModeStats;
  isSelected: boolean;
  onClick: () => void;
}

export function ModeCard({ mode, stats, isSelected, onClick }: ModeCardProps) {
  const winRate =
    stats.games_count > 0
      ? Math.round((stats.wins_count / stats.games_count) * 100)
      : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg border transition-all",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-muted/30 border-transparent hover:bg-muted/50"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {getModeName(mode)}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold">{stats.rating}</span>
        <span
          className={cn(
            "text-xs font-medium",
            winRate >= 50 ? "text-green-500" : "text-red-500"
          )}
        >
          {winRate}%
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {stats.games_count} games
      </div>
    </button>
  );
}
