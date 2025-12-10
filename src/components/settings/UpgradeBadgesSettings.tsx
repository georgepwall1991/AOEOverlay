import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Award } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig } from "@/lib/tauri";
import { DEFAULT_UPGRADE_BADGES_CONFIG } from "@/types";
import type { UpgradeBadgesConfig, UpgradeBadgeConfig } from "@/types";

// Helper to format seconds as mm:ss
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper to parse mm:ss to seconds
function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d+):(\d{2})$/);
  if (!match) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  if (secs >= 60) return null;
  return mins * 60 + secs;
}

interface BadgeRowProps {
  badge: UpgradeBadgeConfig;
  onToggle: () => void;
  onTimeChange: (seconds: number) => void;
}

function BadgeRow({ badge, onToggle, onTimeChange }: BadgeRowProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = parseTime(e.target.value);
    if (seconds !== null) {
      onTimeChange(seconds);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <Switch
          id={`badge-${badge.id}`}
          checked={badge.enabled}
          onCheckedChange={onToggle}
        />
        <div className="flex-1 min-w-0">
          <Label htmlFor={`badge-${badge.id}`} className="cursor-pointer">
            {badge.name}
          </Label>
        </div>
      </div>
      <Input
        type="text"
        className="w-20 text-center text-sm"
        key={badge.triggerSeconds}
        defaultValue={formatTime(badge.triggerSeconds)}
        onBlur={handleTimeChange}
        placeholder="m:ss"
        title="Trigger time (mm:ss)"
      />
    </div>
  );
}

export function UpgradeBadgesSettings() {
  const { config, updateConfig } = useConfigStore();
  const badgesConfig = config.upgradeBadges ?? DEFAULT_UPGRADE_BADGES_CONFIG;

  const handleMasterToggle = async () => {
    const newConfig: UpgradeBadgesConfig = {
      ...badgesConfig,
      enabled: !badgesConfig.enabled,
    };
    updateConfig({ upgradeBadges: newConfig });
    try {
      await saveConfig({ ...config, upgradeBadges: newConfig });
    } catch (error) {
      console.error("Failed to save badges config:", error);
    }
  };

  const handleBadgeToggle = async (badgeId: string) => {
    const newBadges = badgesConfig.badges.map((b) =>
      b.id === badgeId ? { ...b, enabled: !b.enabled } : b
    );
    const newConfig: UpgradeBadgesConfig = {
      ...badgesConfig,
      badges: newBadges,
    };
    updateConfig({ upgradeBadges: newConfig });
    try {
      await saveConfig({ ...config, upgradeBadges: newConfig });
    } catch (error) {
      console.error("Failed to save badges config:", error);
    }
  };

  const handleBadgeTimeChange = async (badgeId: string, seconds: number) => {
    const newBadges = badgesConfig.badges.map((b) =>
      b.id === badgeId ? { ...b, triggerSeconds: seconds } : b
    );
    const newConfig: UpgradeBadgesConfig = {
      ...badgesConfig,
      badges: newBadges,
    };
    updateConfig({ upgradeBadges: newConfig });
    try {
      await saveConfig({ ...config, upgradeBadges: newConfig });
    } catch (error) {
      console.error("Failed to save badges config:", error);
    }
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4">
      <h2 className="text-base font-medium flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-muted-foreground" />
        Upgrade Badges
      </h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="badges-enabled">Enable Upgrade Badges</Label>
          <Switch
            id="badges-enabled"
            checked={badgesConfig.enabled}
            onCheckedChange={handleMasterToggle}
          />
        </div>

        {badgesConfig.enabled && (
          <div className="space-y-3 ml-4">
            {badgesConfig.badges.map((badge) => (
              <BadgeRow
                key={badge.id}
                badge={badge}
                onToggle={() => handleBadgeToggle(badge.id)}
                onTimeChange={(seconds) =>
                  handleBadgeTimeChange(badge.id, seconds)
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
