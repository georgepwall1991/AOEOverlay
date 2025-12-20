import type { Resources } from "@/types";
import { cn } from "@/lib/utils";
import { ResourceIcon } from "../icons/ResourceIcons";

interface ResourceIndicatorProps {
  resources?: Resources;
  className?: string;
  compact?: boolean;
  glow?: boolean;
}

// Text colors with glow classes
const RESOURCE_STYLES = {
  food: { color: "text-red-300", glow: "resource-food-glow" },
  wood: { color: "text-green-300", glow: "resource-wood-glow" },
  gold: { color: "text-yellow-300", glow: "resource-gold-glow" },
  stone: { color: "text-slate-300", glow: "resource-stone-glow" },
};

export function ResourceIndicator({ resources, className = "", compact = false, glow = false }: ResourceIndicatorProps) {
  if (!resources) return null;

  const entries = Object.entries(resources).filter(
    ([_, value]) => value !== undefined && value !== null && value > 0
  ) as [keyof Resources, number][];

  if (entries.length === 0) return null;

  const iconSize = compact ? 20 : 24;
  const textSize = compact ? "text-sm" : "text-base";

  return (
    <div
      data-testid="resource-indicator"
      data-glow={glow ? "true" : undefined}
      className={cn(
        "flex items-center flex-shrink-0",
        compact ? "gap-3" : "gap-4",
        glow && "resource-icon-glow",
        className
      )}
    >
      {entries.map(([type, value]) => {
        const styles = RESOURCE_STYLES[type];
        return (
          <span
            key={type}
            className={cn(
              "flex items-center gap-0.5",
              textSize,
              glow ? styles.glow : styles.color
            )}
          >
            <ResourceIcon type={type} size={iconSize} glow={glow} />
            <span className="font-bold tabular-nums">{value}</span>
          </span>
        );
      })}
    </div>
  );
}
