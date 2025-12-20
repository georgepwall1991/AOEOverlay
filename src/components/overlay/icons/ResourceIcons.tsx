import { cn } from "@/lib/utils";

// Paths to actual AoE4 game resource icons
const RESOURCE_ICONS = {
  food: "/icons/resource_food.webp",
  wood: "/icons/resource_wood.webp",
  gold: "/icons/resource_gold.webp",
  stone: "/icons/resource_stone.webp",
  villager: "/icons/villager.webp",
  pop: "/icons/house.webp",
} as const;

interface ResourceIconProps {
  type: "food" | "wood" | "gold" | "stone" | "villager" | "pop";
  size?: number;
  className?: string;
  glow?: boolean;
}

// Generic resource icon component using actual game assets
export function ResourceIcon({ type, size = 20, className, glow = false }: ResourceIconProps) {
  return (
    <img
      src={RESOURCE_ICONS[type]}
      alt={type}
      width={size}
      height={size}
      className={cn("inline-block transition-all duration-300", className)}
      style={{
        imageRendering: "auto",
        filter: glow
          ? "drop-shadow(0 0 6px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))"
          : "drop-shadow(0 0 4px rgba(255, 255, 255, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))",
        transform: glow ? "scale(1.1)" : "scale(1)"
      }}
    />
  );
}

// Individual icon components for direct use
export function FoodIcon({ size = 20, className }: Omit<ResourceIconProps, "type">) {
  return <ResourceIcon type="food" size={size} className={className} />;
}

export function WoodIcon({ size = 20, className }: Omit<ResourceIconProps, "type">) {
  return <ResourceIcon type="wood" size={size} className={className} />;
}

export function GoldIcon({ size = 20, className }: Omit<ResourceIconProps, "type">) {
  return <ResourceIcon type="gold" size={size} className={className} />;
}

export function StoneIcon({ size = 20, className }: Omit<ResourceIconProps, "type">) {
  return <ResourceIcon type="stone" size={size} className={className} />;
}

export function VillagerIcon({ size = 20, className }: Omit<ResourceIconProps, "type">) {
  return <ResourceIcon type="villager" size={size} className={className} />;
}

export function PopIcon({ size = 20, className }: Omit<ResourceIconProps, "type">) {
  return <ResourceIcon type="pop" size={size} className={className} />;
}
