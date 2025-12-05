import type { Resources } from "@/types";
import { cn } from "@/lib/utils";

interface ResourceIndicatorProps {
  resources?: Resources;
  className?: string;
  compact?: boolean;
}

const RESOURCE_ICONS = {
  food: { icon: "F", color: "text-red-400" },
  wood: { icon: "W", color: "text-green-400" },
  gold: { icon: "G", color: "text-yellow-400" },
  stone: { icon: "S", color: "text-gray-400" },
};

export function ResourceIndicator({ resources, className = "", compact = false }: ResourceIndicatorProps) {
  if (!resources) return null;

  const entries = Object.entries(resources).filter(
    ([_, value]) => value !== undefined && value !== null
  ) as [keyof Resources, number][];

  if (entries.length === 0) return null;

  return (
    <div className={cn(
      "flex items-center",
      compact ? "gap-1.5 text-[10px]" : "gap-2 text-xs",
      className
    )}>
      {entries.map(([type, value]) => {
        const { icon, color } = RESOURCE_ICONS[type];
        return (
          <span key={type} className={cn("flex items-center gap-0.5", color)}>
            <span className="font-bold">{icon}</span>
            <span>{value}</span>
          </span>
        );
      })}
    </div>
  );
}
