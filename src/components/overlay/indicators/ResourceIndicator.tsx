import type { Resources } from "@/types";
import { cn } from "@/lib/utils";
import { ResourceIcon } from "../icons/ResourceIcons";

interface ResourceIndicatorProps {
  resources?: Resources;
  previousResources?: Resources;
  className?: string;
  compact?: boolean;
  glow?: boolean;
}

// Text colors with glow classes
const RESOURCE_STYLES = {
  food: { color: "text-red-300", glow: "resource-food-glow", delta: "text-red-400" },
  wood: { color: "text-green-300", glow: "resource-wood-glow", delta: "text-green-400" },
  gold: { color: "text-yellow-300", glow: "resource-gold-glow", delta: "text-yellow-400" },
  stone: { color: "text-slate-300", glow: "resource-stone-glow", delta: "text-slate-400" },
  villagers: { color: "text-amber-300", glow: "resource-gold-glow", delta: "text-amber-400" },
  builders: { color: "text-orange-300", glow: "resource-gold-glow", delta: "text-orange-400" },
};

export function ResourceIndicator({ resources, previousResources, className = "", compact = false, glow = false }: ResourceIndicatorProps) {
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
        const hasPrevious = previousResources !== undefined;
        const prevValue = previousResources?.[type] ?? 0;
        const delta = hasPrevious ? value - prevValue : 0;

        return (
          <div key={type} className="flex items-center gap-1.5 group/res">
            <span
              className={cn(
                "flex items-center gap-0.5",
                textSize,
                glow ? styles.glow : styles.color
              )}
            >
              <ResourceIcon type={type === "villagers" ? "villager" : type as any} size={iconSize} glow={glow} />
              <span className="font-bold tabular-nums">{value}</span>
            </span>
            
            {/* Delta Indicator */}
            {delta !== 0 && (
              <span className={cn(
                "text-[10px] font-black px-1 rounded bg-black/40 border border-white/5",
                delta > 0 ? "text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                !glow && "opacity-60",
                "animate-delta-pop"
              )}>
                {delta > 0 ? "+" : ""}{delta}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
