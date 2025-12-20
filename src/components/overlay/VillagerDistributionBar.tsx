import type { Resources } from "@/types";
import { cn } from "@/lib/utils";

interface VillagerDistributionBarProps {
  resources?: Resources;
  className?: string;
}

export function VillagerDistributionBar({ resources, className = "" }: VillagerDistributionBarProps) {
  if (!resources) return null;

  const food = resources.food || 0;
  const wood = resources.wood || 0;
  const gold = resources.gold || 0;
  const stone = resources.stone || 0;
  const total = food + wood + gold + stone;

  if (total === 0) return null;

  const getPercent = (value: number) => (value / total) * 100;

  return (
    <div className={cn("w-full h-1.5 flex rounded-full overflow-hidden bg-white/5", className)}>
      {food > 0 && (
        <div
          className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] transition-all duration-500"
          style={{ width: `${getPercent(food)}%` }}
          title={`Food: ${food}`}
        />
      )}
      {wood > 0 && (
        <div
          className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-500"
          style={{ width: `${getPercent(wood)}%` }}
          title={`Wood: ${wood}`}
        />
      )}
      {gold > 0 && (
        <div
          className="h-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] transition-all duration-500"
          style={{ width: `${getPercent(gold)}%` }}
          title={`Gold: ${gold}`}
        />
      )}
      {stone > 0 && (
        <div
          className="h-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)] transition-all duration-500"
          style={{ width: `${getPercent(stone)}%` }}
          title={`Stone: ${stone}`}
        />
      )}
    </div>
  );
}
