import { cn } from "@/lib/utils";
import { formatCivilization } from "@/types/aoe4world";

interface CivStatBarProps {
  name: string;
  games: number;
  winRate: number;
  maxGames: number;
}

export function CivStatBar({ name, games, winRate, maxGames }: CivStatBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate">{formatCivilization(name)}</span>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "font-medium",
              winRate >= 50 ? "text-green-500" : "text-red-500"
            )}
          >
            {winRate.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">{games}g</span>
        </div>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            winRate >= 55
              ? "bg-green-500"
              : winRate >= 45
                ? "bg-yellow-500"
                : "bg-red-500"
          )}
          style={{ width: `${(games / maxGames) * 100}%` }}
        />
      </div>
    </div>
  );
}
