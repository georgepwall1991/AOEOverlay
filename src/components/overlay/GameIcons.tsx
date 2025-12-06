import { useState } from "react";
import { cn } from "@/lib/utils";

// All available game icons with image paths and emoji fallbacks
// Icons sourced from FluffyMaguro/AoE4_Overlay (official AoE4 icons)
export const GAME_ICONS = {
  // Resources
  food: { path: "/icons/resource_food.webp", emoji: "🍖", color: "#ef4444" },
  wood: { path: "/icons/resource_wood.webp", emoji: "🪵", color: "#22c55e" },
  gold: { path: "/icons/resource_gold.webp", emoji: "🪙", color: "#eab308" },
  stone: { path: "/icons/resource_stone.webp", emoji: "🪨", color: "#94a3b8" },

  // Villagers
  villager: { path: "/icons/villager.webp", emoji: "👷", color: "#f59e0b" },

  // Economy buildings
  house: { path: "/icons/house.webp", emoji: "🏠", color: "#a78bfa" },
  mill: { path: "/icons/mill.webp", emoji: "🌾", color: "#fbbf24" },
  lumber_camp: { path: "/icons/lumber_camp.webp", emoji: "🪓", color: "#22c55e" },
  mining_camp: { path: "/icons/mining_camp.webp", emoji: "⛏️", color: "#eab308" },
  farm: { path: "/icons/farm.webp", emoji: "🌱", color: "#84cc16" },
  market: { path: "/icons/market.webp", emoji: "🏪", color: "#f97316" },
  dock: { path: "/icons/dock.webp", emoji: "⚓", color: "#3b82f6" },

  // Military buildings
  barracks: { path: "/icons/barracks.webp", emoji: "🏛️", color: "#ef4444" },
  archery_range: { path: "/icons/archery_range.webp", emoji: "🎯", color: "#f97316" },
  stable: { path: "/icons/stable.webp", emoji: "🐴", color: "#a855f7" },
  blacksmith: { path: "/icons/barracks.webp", emoji: "🔨", color: "#6b7280" },
  siege_workshop: { path: "/icons/siege_workshop.webp", emoji: "🏗️", color: "#78716c" },
  monastery: { path: "/icons/monk.webp", emoji: "⛪", color: "#8b5cf6" },
  university: { path: "/icons/castle_age.webp", emoji: "🎓", color: "#3b82f6" },

  // Landmarks & special
  town_center: { path: "/icons/town_center.webp", emoji: "🏰", color: "#fbbf24" },
  keep: { path: "/icons/castle_age.webp", emoji: "🏯", color: "#64748b" },
  castle: { path: "/icons/castle_age.webp", emoji: "🏰", color: "#a855f7" },
  wonder: { path: "/icons/imperial_age.webp", emoji: "🗼", color: "#ec4899" },
  outpost: { path: "/icons/house.webp", emoji: "🗼", color: "#78716c" },
  palisade: { path: "/icons/house.webp", emoji: "🪵", color: "#92400e" },
  stone_wall: { path: "/icons/house.webp", emoji: "🧱", color: "#64748b" },
  gate: { path: "/icons/house.webp", emoji: "🚪", color: "#78716c" },

  // Infantry units
  spearman: { path: "/icons/spearman.webp", emoji: "🗡️", color: "#64748b" },
  man_at_arms: { path: "/icons/man_at_arms.webp", emoji: "⚔️", color: "#475569" },
  pikeman: { path: "/icons/spearman.webp", emoji: "🗡️", color: "#334155" },

  // Ranged units
  archer: { path: "/icons/archer.webp", emoji: "🏹", color: "#22c55e" },
  crossbowman: { path: "/icons/crossbowman.webp", emoji: "🎯", color: "#16a34a" },
  handcannoneer: { path: "/icons/handcannoneer.webp", emoji: "🔫", color: "#dc2626" },
  longbowman: { path: "/icons/archer.webp", emoji: "🏹", color: "#b91c1c" },

  // Cavalry units
  scout: { path: "/icons/scout.webp", emoji: "🐎", color: "#84cc16" },
  horseman: { path: "/icons/horseman.webp", emoji: "🏇", color: "#65a30d" },
  knight: { path: "/icons/knight.webp", emoji: "🤺", color: "#a855f7" },
  lancer: { path: "/icons/lancer.webp", emoji: "🏇", color: "#7c3aed" },

  // Siege units
  ram: { path: "/icons/ram.webp", emoji: "🪵", color: "#78716c" },
  mangonel: { path: "/icons/mangonel.webp", emoji: "💥", color: "#f97316" },
  springald: { path: "/icons/springald.webp", emoji: "🎯", color: "#ea580c" },
  trebuchet: { path: "/icons/trebuchet.webp", emoji: "🏗️", color: "#c2410c" },
  bombard: { path: "/icons/bombard.webp", emoji: "💣", color: "#7f1d1d" },

  // Naval
  fishing_boat: { path: "/icons/fish.webp", emoji: "🎣", color: "#0ea5e9" },
  transport: { path: "/icons/dock.webp", emoji: "🚢", color: "#0284c7" },
  galley: { path: "/icons/dock.webp", emoji: "⛵", color: "#0369a1" },

  // Religious
  monk: { path: "/icons/monk.webp", emoji: "🧙", color: "#8b5cf6" },

  // Ages
  dark_age: { path: "/icons/dark_age.webp", emoji: "🌑", color: "#374151" },
  feudal_age: { path: "/icons/feudal_age.webp", emoji: "🏰", color: "#059669" },
  castle_age: { path: "/icons/castle_age.webp", emoji: "⚔️", color: "#2563eb" },
  imperial_age: { path: "/icons/imperial_age.webp", emoji: "👑", color: "#dc2626" },

  // Resources on map
  sheep: { path: "/icons/sheep.webp", emoji: "🐑", color: "#fafafa" },
  deer: { path: "/icons/deer.webp", emoji: "🦌", color: "#a16207" },
  boar: { path: "/icons/boar.webp", emoji: "🐗", color: "#78350f" },
  wolf: { path: "/icons/wolf.webp", emoji: "🐺", color: "#6b7280" },
  berries: { path: "/icons/berries.webp", emoji: "🫐", color: "#7c3aed" },
  fish: { path: "/icons/fish.webp", emoji: "🐟", color: "#0ea5e9" },
  relic: { path: "/icons/relic.webp", emoji: "✨", color: "#fbbf24" },
  sacred_site: { path: "/icons/sacred_site.webp", emoji: "⭐", color: "#f59e0b" },

  // Civ-specific buildings
  hunting_cabin: { path: "/icons/hunting_cabin.webp", emoji: "🏚️", color: "#22c55e" },
  ger: { path: "/icons/ger.webp", emoji: "⛺", color: "#f97316" },
  village: { path: "/icons/town_center.webp", emoji: "🏘️", color: "#eab308" },
  landmark: { path: "/icons/feudal_age.webp", emoji: "🏛️", color: "#a855f7" },

  // Technologies / Upgrades
  upgrade: { path: "/icons/feudal_age.webp", emoji: "⬆️", color: "#22c55e" },
  research: { path: "/icons/castle_age.webp", emoji: "📜", color: "#3b82f6" },
  wheelbarrow: { path: "/icons/villager.webp", emoji: "🛒", color: "#f97316" },

  // Generic
  attack: { path: "/icons/knight.webp", emoji: "⚔️", color: "#ef4444" },
  defense: { path: "/icons/spearman.webp", emoji: "🛡️", color: "#3b82f6" },
  speed: { path: "/icons/scout.webp", emoji: "💨", color: "#22d3d1" },
  timer: { path: "/icons/dark_age.webp", emoji: "⏱️", color: "#f59e0b" },
} as const;

export type GameIconType = keyof typeof GAME_ICONS;

// Track which icons have failed to load globally (persists across renders)
const globalFailedIcons = new Set<string>();

interface GameIconProps {
  type: GameIconType;
  size?: number;
  className?: string;
  glow?: boolean;
  showLabel?: boolean;
}

// Icons that need labels because they're unclear (only for emoji fallbacks now)
// Most official icons are clear enough without labels
const NEEDS_LABEL: Set<GameIconType> = new Set([
  "upgrade", "research", "wheelbarrow", "landmark",
]);

// Human-readable labels for icon types
const ICON_LABELS: Partial<Record<GameIconType, string>> = {
  scout: "Scout",
  horseman: "Horseman",
  knight: "Knight",
  lancer: "Lancer",
  spearman: "Spearman",
  man_at_arms: "MAA",
  pikeman: "Pikeman",
  archer: "Archer",
  crossbowman: "Xbow",
  handcannoneer: "HC",
  longbowman: "Longbow",
  monk: "Monk",
  hunting_cabin: "Cabin",
  ger: "Ger",
  village: "Village",
  landmark: "Landmark",
  ram: "Ram",
  mangonel: "Mango",
  springald: "Spring",
  trebuchet: "Treb",
  bombard: "Bombard",
  upgrade: "Upgrade",
  research: "Research",
  wheelbarrow: "WB",
  town_center: "TC",
  lumber_camp: "LC",
  mining_camp: "MC",
};

export function GameIcon({ type, size = 20, className, glow = false, showLabel = false }: GameIconProps) {
  const icon = GAME_ICONS[type];
  // Use local state to trigger re-render on error, check global set first
  const [hasError, setHasError] = useState(() => globalFailedIcons.has(type));

  // Determine if we should show a label
  const shouldShowLabel = showLabel || (hasError && NEEDS_LABEL.has(type));
  const label = ICON_LABELS[type];

  const glowFilter = glow
    ? `drop-shadow(0 0 6px ${icon.color}) drop-shadow(0 0 12px ${icon.color}80)`
    : `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))`;

  // Show emoji if we already know this icon fails or if error occurred
  if (hasError || globalFailedIcons.has(type)) {
    return (
      <span
        className={cn("inline-flex items-center gap-0.5", className)}
        style={{
          filter: glowFilter,
        }}
        title={type.replace(/_/g, ' ')}
      >
        <span
          className="inline-flex items-center justify-center"
          style={{
            fontSize: size * 0.85,
            width: size,
            height: size,
          }}
        >
          {icon.emoji}
        </span>
        {shouldShowLabel && label && (
          <span
            className="text-white/80 font-medium"
            style={{ fontSize: size * 0.55 }}
          >
            {label}
          </span>
        )}
      </span>
    );
  }

  // For icons with labels, wrap in span
  if (shouldShowLabel && label) {
    return (
      <span
        className={cn("inline-flex items-center gap-0.5", className)}
        title={type.replace(/_/g, ' ')}
      >
        <img
          src={icon.path}
          alt={type}
          width={size}
          height={size}
          className="inline-block"
          style={{
            imageRendering: "auto",
            filter: glowFilter,
            transform: glow ? "scale(1.1)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
          onError={() => {
            globalFailedIcons.add(type);
            setHasError(true);
          }}
        />
        <span
          className="text-white/80 font-medium"
          style={{ fontSize: size * 0.55 }}
        >
          {label}
        </span>
      </span>
    );
  }

  return (
    <img
      src={icon.path}
      alt={type}
      width={size}
      height={size}
      className={cn("inline-block", className)}
      style={{
        imageRendering: "auto",
        filter: glowFilter,
        transform: glow ? "scale(1.1)" : "scale(1)",
        transition: "all 0.2s ease",
      }}
      onError={() => {
        // Add to global set so other instances know immediately
        globalFailedIcons.add(type);
        // Trigger re-render for this component
        setHasError(true);
      }}
      title={type.replace(/_/g, ' ')}
    />
  );
}

// Convenience function to render inline icons in text
export function renderIconText(text: string, size = 18): React.ReactNode {
  // Pattern to match [icon:type] syntax
  const pattern = /\[icon:(\w+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the icon
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const iconType = match[1] as GameIconType;
    if (iconType in GAME_ICONS) {
      parts.push(
        <GameIcon key={match.index} type={iconType} size={size} className="mx-0.5 align-middle" showLabel={true} />
      );
    } else {
      parts.push(match[0]); // Keep original if icon not found
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Re-export ResourceIcon for backwards compatibility
export { ResourceIcon } from "./ResourceIcons";
