import { X, AlertTriangle } from "lucide-react";
import { useConfigStore, useBadgeStore, useElapsedSeconds } from "@/stores";
import { DEFAULT_UPGRADE_BADGES_CONFIG } from "@/types";
import { cn } from "@/lib/utils";

interface BadgeProps {
  name: string;
  shortName: string;
  isUrgent: boolean;
  onDismiss: () => void;
}

function Badge({ name, shortName, isUrgent, onDismiss }: BadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
        isUrgent
          ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
          : "bg-amber-500/20 text-amber-400 border border-amber-500/50"
      )}
      title={name}
    >
      {isUrgent && <AlertTriangle className="w-3 h-3" />}
      <span>{shortName}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="ml-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
        title="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function UpgradeBadges() {
  const { config } = useConfigStore();
  const { dismissBadge, isBadgeDismissed } = useBadgeStore();
  const elapsedSeconds = useElapsedSeconds();

  const badgesConfig = config.upgradeBadges ?? DEFAULT_UPGRADE_BADGES_CONFIG;

  // Don't show if badges are disabled or timer hasn't started yet
  // Show even when paused so player can see reminders
  if (!badgesConfig.enabled || elapsedSeconds === 0) {
    return null;
  }

  // Filter badges that should be shown:
  // - Enabled in config
  // - Timer has passed trigger time
  // - Not dismissed
  const visibleBadges = badgesConfig.badges.filter((badge) => {
    if (!badge.enabled) return false;
    if (elapsedSeconds < badge.triggerSeconds) return false;
    if (isBadgeDismissed(badge.id)) return false;
    return true;
  });

  if (visibleBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-1.5 border-b border-white/10">
      {visibleBadges.map((badge) => {
        // Badge is "urgent" if 30+ seconds past trigger time
        const isUrgent = elapsedSeconds >= badge.triggerSeconds + 30;
        return (
          <Badge
            key={badge.id}
            name={badge.name}
            shortName={badge.shortName}
            isUrgent={isUrgent}
            onDismiss={() => dismissBadge(badge.id)}
          />
        );
      })}
    </div>
  );
}
