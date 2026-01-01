import { Home, Eye, Coins, UserX } from "lucide-react";
import { useMetronomeStore } from "@/stores";
import { useConfigStore } from "@/stores/configStore";
import { cn } from "@/lib/utils";
import { DEFAULT_METRONOME_CONFIG } from "@/types";

const TASKS = [
  { icon: Home, label: "TC" },
  { icon: Eye, label: "Map" },
  { icon: Coins, label: "Spend" },
  { icon: UserX, label: "Idle" },
];

export function MacroCycleHUD() {
  const { config } = useConfigStore();
  const { currentTaskIndex, isPulsing } = useMetronomeStore();
  const metronomeConfig = config.metronome ?? DEFAULT_METRONOME_CONFIG;

  if (!metronomeConfig.enabled || !metronomeConfig.coachLoop) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
      {TASKS.map((task, idx) => {
        const Icon = task.icon;
        const isActive = currentTaskIndex === idx;
        
        return (
          <div
            key={task.label}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-500",
              isActive 
                ? "bg-amber-500 text-black scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                : "text-white/20 scale-90"
            )}
            title={task.label}
          >
            <Icon className={cn(
              "w-3.5 h-3.5",
              isActive && isPulsing && "animate-bounce"
            )} />
          </div>
        );
      })}
    </div>
  );
}
