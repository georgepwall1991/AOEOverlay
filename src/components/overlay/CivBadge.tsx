import { cn } from "@/lib/utils";

interface CivBadgeProps {
  civilization: string;
  className?: string;
  size?: "sm" | "md";
  glow?: boolean;
}

// Civilization colors based on AoE4 theme
const CIV_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  English: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  French: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  "Holy Roman Empire": {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  HRE: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  Mongols: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  Rus: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  Chinese: {
    bg: "bg-red-600/20",
    text: "text-red-400",
    border: "border-red-600/30",
  },
  "Delhi Sultanate": {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Delhi: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Abbasid: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  "Abbasid Dynasty": {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Ottomans: {
    bg: "bg-red-500/20",
    text: "text-red-300",
    border: "border-red-500/30",
  },
  Malians: {
    bg: "bg-yellow-600/20",
    text: "text-yellow-500",
    border: "border-yellow-600/30",
  },
  Japanese: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    border: "border-pink-500/30",
  },
  Byzantines: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  "Order of the Dragon": {
    bg: "bg-slate-500/20",
    text: "text-slate-300",
    border: "border-slate-500/30",
  },
  "Jeanne d'Arc": {
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  "Zhu Xi's Legacy": {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  "Ayyubids": {
    bg: "bg-lime-500/20",
    text: "text-lime-400",
    border: "border-lime-500/30",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-white/10",
  text: "text-white/70",
  border: "border-white/20",
};

export function CivBadge({ civilization, className, size = "md", glow = false }: CivBadgeProps) {
  const colors = CIV_COLORS[civilization] || DEFAULT_COLORS;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-bold transition-all duration-200",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
        colors.bg,
        colors.text,
        glow ? "border-0" : `border ${colors.border}`,
        className
      )}
      style={glow ? {
        boxShadow: `0 0 8px currentColor, 0 0 16px currentColor`,
        textShadow: `0 0 8px currentColor, 0 1px 2px rgba(0,0,0,0.8)`
      } : {
        textShadow: `0 1px 2px rgba(0,0,0,0.8)`
      }}
    >
      {civilization}
    </span>
  );
}
