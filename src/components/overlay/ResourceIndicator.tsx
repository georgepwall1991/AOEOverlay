import type { Resources } from "@/types";
import { cn } from "@/lib/utils";
import { ResourceIcon } from "./ResourceIcons";

interface ResourceIndicatorProps {
  resources?: Resources;
  className?: string;
  compact?: boolean;
}

const RESOURCE_COLORS = {
  food: "text-red-400",
  wood: "text-green-400",
  gold: "text-yellow-400",
  stone: "text-slate-400",
};

export function ResourceIndicator({ resources, className = "", compact = false }: ResourceIndicatorProps) {
  if (!resources) return null;

  const entries = Object.entries(resources).filter(
    ([_, value]) => value !== undefined && value !== null && value > 0
  ) as [keyof Resources, number][];

  if (entries.length === 0) return null;

  const iconSize = compact ? 12 : 14;

  return (
    <div className={cn(
      "flex items-center",
      compact ? "gap-1.5" : "gap-2",
      className
    )}>
      {entries.map(([type, value]) => (
        <span
          key={type}
          className={cn(
            "flex items-center gap-1",
            compact ? "text-[10px]" : "text-xs",
            RESOURCE_COLORS[type]
          )}
        >
          <ResourceIcon type={type} size={iconSize} />
          <span className="font-semibold tabular-nums">{value}</span>
        </span>
      ))}
    </div>
  );
}
