import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRankLevel, getRankTier } from "@/types/aoe4world";

interface RankBadgeProps {
  rankLevel?: string | null;
  size?: "sm" | "md" | "lg";
}

const RANK_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-600 text-amber-100 shadow-amber-500/20",
  silver: "from-gray-400 to-gray-300 text-gray-800 shadow-gray-400/20",
  gold: "from-yellow-500 to-yellow-400 text-yellow-900 shadow-yellow-500/20",
  platinum: "from-cyan-400 to-cyan-300 text-cyan-900 shadow-cyan-400/20",
  diamond: "from-blue-400 to-blue-300 text-blue-900 shadow-blue-400/20",
  conqueror: "from-purple-500 to-purple-400 text-purple-100 shadow-purple-500/20",
  unranked: "from-gray-600 to-gray-500 text-gray-200 shadow-gray-500/20",
};

const SIZE_CLASSES = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-3 py-1",
  lg: "text-sm px-4 py-1.5",
};

export function RankBadge({ rankLevel, size = "md" }: RankBadgeProps) {
  const tier = getRankTier(rankLevel);
  const formatted = formatRankLevel(rankLevel);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r font-semibold shadow-lg",
        RANK_COLORS[tier] || RANK_COLORS.unranked,
        SIZE_CLASSES[size]
      )}
    >
      <Crown
        className={cn(
          size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"
        )}
      />
      {formatted}
    </span>
  );
}
