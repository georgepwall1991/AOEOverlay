import { useTimerStore } from "@/stores";
import { Compass, MoveUpRight, RefreshCcw } from "lucide-react";

interface ScoutPattern {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  description: string;
  icon: React.ElementType;
}

const SCOUT_PATTERNS: ScoutPattern[] = [
  {
    id: "sheep-spiral",
    name: "Sheep Spiral",
    startTime: 0,
    endTime: 180, // First 3 mins
    description: "Spiral outward to find 8+ sheep",
    icon: RefreshCcw,
  },
  {
    id: "enemy-scout",
    name: "Locate Enemy",
    startTime: 180,
    endTime: 360, // 3-6 mins
    description: "Find enemy TC and landmarks",
    icon: MoveUpRight,
  },
  {
    id: "relic-dash",
    name: "Map Control",
    startTime: 360,
    endTime: 3600, // Post 6 mins
    description: "Secure relics and sacred sites",
    icon: Compass,
  },
];

export function ScoutGuide() {
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds);
  const currentPattern = SCOUT_PATTERNS.find(
    (p) => elapsedSeconds >= p.startTime && elapsedSeconds < p.endTime
  );

  if (!currentPattern) return null;

  return (
    <div className="px-2 py-1.5 border-t border-white/5 bg-white/2 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-blue-500/20 text-blue-300">
          <currentPattern.icon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">
              Scout Goal: {currentPattern.name}
            </span>
          </div>
          <p className="text-[11px] text-white/90 leading-tight truncate">
            {currentPattern.description}
          </p>
        </div>
      </div>
    </div>
  );
}
