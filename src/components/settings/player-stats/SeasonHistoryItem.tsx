import { cn } from "@/lib/utils";
import { RankBadge } from "./RankBadge";

interface SeasonHistoryItemProps {
  season: number;
  rating: number;
  rank_level: string;
  games_count: number;
  win_rate: number;
  isCurrentSeason?: boolean;
}

export function SeasonHistoryItem({
  season,
  rating,
  rank_level,
  games_count,
  win_rate,
  isCurrentSeason,
}: SeasonHistoryItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-lg",
        isCurrentSeason ? "bg-primary/10" : "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
            isCurrentSeason ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          S{season}
        </div>
        <div>
          <div className="text-sm font-medium">{rating} Rating</div>
          <div className="text-[10px] text-muted-foreground">
            {games_count} games
          </div>
        </div>
      </div>
      <div className="text-right">
        <RankBadge rankLevel={rank_level} size="sm" />
        <div
          className={cn(
            "text-[10px] font-medium mt-1",
            win_rate >= 50 ? "text-green-500" : "text-red-500"
          )}
        >
          {win_rate.toFixed(1)}% WR
        </div>
      </div>
    </div>
  );
}
