import { cn } from "@/lib/utils";

interface IconProps {
  size?: number;
  className?: string;
}

// Food icon - Red/orange with berry/meat shape
export function FoodIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("drop-shadow-sm", className)}
    >
      {/* Background circle */}
      <circle cx="12" cy="12" r="11" fill="#991b1b" />
      <circle cx="12" cy="12" r="10" fill="url(#foodGradient)" />

      {/* Berry/meat shape */}
      <ellipse cx="12" cy="10" rx="5" ry="4" fill="#fca5a5" opacity="0.9" />
      <ellipse cx="10" cy="9" rx="2" ry="1.5" fill="#fecaca" opacity="0.6" />
      <ellipse cx="12" cy="14" rx="4" ry="3" fill="#f87171" opacity="0.8" />

      <defs>
        <linearGradient id="foodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Wood icon - Green/brown with log shape
export function WoodIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("drop-shadow-sm", className)}
    >
      {/* Background circle */}
      <circle cx="12" cy="12" r="11" fill="#14532d" />
      <circle cx="12" cy="12" r="10" fill="url(#woodGradient)" />

      {/* Log shapes */}
      <rect x="6" y="8" width="12" height="4" rx="2" fill="#a16207" />
      <rect x="6" y="8" width="12" height="2" rx="1" fill="#ca8a04" opacity="0.7" />
      <rect x="7" y="13" width="10" height="3" rx="1.5" fill="#92400e" />
      <rect x="7" y="13" width="10" height="1.5" rx="0.75" fill="#b45309" opacity="0.6" />

      <defs>
        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Gold icon - Yellow with coin/ingot shape
export function GoldIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("drop-shadow-sm", className)}
    >
      {/* Background circle */}
      <circle cx="12" cy="12" r="11" fill="#854d0e" />
      <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" />

      {/* Coin stack */}
      <ellipse cx="12" cy="14" rx="6" ry="3" fill="#a16207" />
      <ellipse cx="12" cy="13" rx="6" ry="3" fill="#ca8a04" />
      <ellipse cx="12" cy="12" rx="6" ry="3" fill="#eab308" />
      <ellipse cx="12" cy="11" rx="5" ry="2.5" fill="#fde047" opacity="0.8" />

      {/* Shine */}
      <ellipse cx="10" cy="10" rx="2" ry="1" fill="#fef9c3" opacity="0.6" />

      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Stone icon - Gray/blue with stone block shape
export function StoneIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("drop-shadow-sm", className)}
    >
      {/* Background circle */}
      <circle cx="12" cy="12" r="11" fill="#1e293b" />
      <circle cx="12" cy="12" r="10" fill="url(#stoneGradient)" />

      {/* Stone blocks */}
      <rect x="6" y="7" width="5" height="5" rx="1" fill="#94a3b8" />
      <rect x="12" y="7" width="6" height="4" rx="1" fill="#64748b" />
      <rect x="7" y="13" width="7" height="4" rx="1" fill="#475569" />
      <rect x="15" y="12" width="3" height="5" rx="1" fill="#64748b" />

      {/* Highlights */}
      <rect x="6" y="7" width="5" height="2" rx="0.5" fill="#cbd5e1" opacity="0.5" />
      <rect x="7" y="13" width="7" height="1.5" rx="0.5" fill="#94a3b8" opacity="0.4" />

      <defs>
        <linearGradient id="stoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Generic resource icon component
export function ResourceIcon({
  type,
  size = 16,
  className
}: {
  type: "food" | "wood" | "gold" | "stone";
  size?: number;
  className?: string;
}) {
  switch (type) {
    case "food":
      return <FoodIcon size={size} className={className} />;
    case "wood":
      return <WoodIcon size={size} className={className} />;
    case "gold":
      return <GoldIcon size={size} className={className} />;
    case "stone":
      return <StoneIcon size={size} className={className} />;
  }
}
