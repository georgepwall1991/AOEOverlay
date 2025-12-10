import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig } from "@/lib/tauri";
import { DEFAULT_REMINDER_CONFIG } from "@/types";
import type { ReminderConfig } from "@/types";

type ToggleableReminder = "villagerQueue" | "scout" | "houses" | "military" | "mapControl" | "macroCheck";

interface ReminderRowProps {
  label: string;
  enabled: boolean;
  intervalSeconds: number;
  onToggle: () => void;
  onIntervalChange: (value: string) => void;
}

function ReminderRow({ label, enabled, intervalSeconds, onToggle, onIntervalChange }: ReminderRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={onToggle} />
          <Label>{label}</Label>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="10"
          max="120"
          value={intervalSeconds}
          onChange={(e) => onIntervalChange(e.target.value)}
          className="w-16 h-8"
          disabled={!enabled}
        />
        <span className="text-xs text-muted-foreground">sec</span>
      </div>
    </div>
  );
}

export function ReminderSettings() {
  const { config, updateConfig } = useConfigStore();
  const reminderConfig = config.reminders ?? DEFAULT_REMINDER_CONFIG;
  const calmMode = reminderConfig.calmMode ?? { enabled: false, untilSeconds: 180 };

  const handleRemindersToggle = async () => {
    const newReminders: ReminderConfig = { ...reminderConfig, enabled: !reminderConfig.enabled };
    updateConfig({ reminders: newReminders });
    try {
      await saveConfig({ ...config, reminders: newReminders });
    } catch (error) {
      console.error("Failed to save reminders config:", error);
    }
  };

  const handleReminderItemToggle = async (item: ToggleableReminder) => {
    const newReminders: ReminderConfig = {
      ...reminderConfig,
      [item]: { ...reminderConfig[item], enabled: !reminderConfig[item]?.enabled },
    };
    updateConfig({ reminders: newReminders });
    try {
      await saveConfig({ ...config, reminders: newReminders });
    } catch (error) {
      console.error("Failed to save reminders config:", error);
    }
  };

  const handleSacredSitesToggle = async () => {
    const newReminders: ReminderConfig = {
      ...reminderConfig,
      sacredSites: { enabled: !reminderConfig.sacredSites?.enabled },
    };
    updateConfig({ reminders: newReminders });
    try {
      await saveConfig({ ...config, reminders: newReminders });
    } catch (error) {
      console.error("Failed to save reminders config:", error);
    }
  };

  const handleReminderIntervalChange = async (item: ToggleableReminder, value: string) => {
    const interval = parseInt(value, 10) || 30;
    const newReminders: ReminderConfig = {
      ...reminderConfig,
      [item]: { ...reminderConfig[item], intervalSeconds: interval },
    };
    updateConfig({ reminders: newReminders });
    try {
      await saveConfig({ ...config, reminders: newReminders });
    } catch (error) {
      console.error("Failed to save reminders config:", error);
    }
  };

  const handleCalmModeToggle = async () => {
    const nextCalm = { ...calmMode, enabled: !calmMode.enabled };
    const newReminders: ReminderConfig = { ...reminderConfig, calmMode: nextCalm };
    updateConfig({ reminders: newReminders });
    try {
      await saveConfig({ ...config, reminders: newReminders });
    } catch (error) {
      console.error("Failed to save calm mode:", error);
    }
  };

  const handleCalmModeSeconds = async (value: string) => {
    const untilSeconds = Math.max(30, parseInt(value, 10) || calmMode.untilSeconds);
    const nextCalm = { ...calmMode, untilSeconds };
    const newReminders: ReminderConfig = { ...reminderConfig, calmMode: nextCalm };
    updateConfig({ reminders: newReminders });
    try {
      await saveConfig({ ...config, reminders: newReminders });
    } catch (error) {
      console.error("Failed to save calm window:", error);
    }
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4">
      <h2 className="text-base font-medium flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-muted-foreground" />
        Periodic Reminders
      </h2>

      <div className="space-y-3">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="reminders-enabled">Enable Reminders</Label>
          <Switch
            id="reminders-enabled"
            checked={reminderConfig.enabled}
            onCheckedChange={handleRemindersToggle}
          />
        </div>

        {reminderConfig.enabled && (
          <div className="space-y-3 pt-2">
            <div className="bg-muted/40 rounded-lg p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={calmMode.enabled} onCheckedChange={handleCalmModeToggle} />
                    <Label>Calm early game</Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-8 mt-1">
                    Delay non-critical reminders until the timer reaches this mark.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="30"
                    max="600"
                    value={calmMode.untilSeconds}
                    onChange={(e) => handleCalmModeSeconds(e.target.value)}
                    className="w-20 h-8"
                    disabled={!calmMode.enabled}
                  />
                  <span className="text-xs text-muted-foreground">sec</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <ReminderRow
                label="Keep queuing villagers"
                enabled={reminderConfig.villagerQueue.enabled}
                intervalSeconds={reminderConfig.villagerQueue.intervalSeconds}
                onToggle={() => handleReminderItemToggle("villagerQueue")}
                onIntervalChange={(v) => handleReminderIntervalChange("villagerQueue", v)}
              />

              <ReminderRow
                label="Check your scout"
                enabled={reminderConfig.scout.enabled}
                intervalSeconds={reminderConfig.scout.intervalSeconds}
                onToggle={() => handleReminderItemToggle("scout")}
                onIntervalChange={(v) => handleReminderIntervalChange("scout", v)}
              />

              <ReminderRow
                label="Don't get supply blocked"
                enabled={reminderConfig.houses.enabled}
                intervalSeconds={reminderConfig.houses.intervalSeconds}
                onToggle={() => handleReminderItemToggle("houses")}
                onIntervalChange={(v) => handleReminderIntervalChange("houses", v)}
              />

              <ReminderRow
                label="Build more military"
                enabled={reminderConfig.military.enabled}
                intervalSeconds={reminderConfig.military.intervalSeconds}
                onToggle={() => handleReminderItemToggle("military")}
                onIntervalChange={(v) => handleReminderIntervalChange("military", v)}
              />

              <ReminderRow
                label="Control the map"
                enabled={reminderConfig.mapControl.enabled}
                intervalSeconds={reminderConfig.mapControl.intervalSeconds}
                onToggle={() => handleReminderItemToggle("mapControl")}
                onIntervalChange={(v) => handleReminderIntervalChange("mapControl", v)}
              />

              <ReminderRow
                label="Check your production"
                enabled={reminderConfig.macroCheck?.enabled ?? false}
                intervalSeconds={reminderConfig.macroCheck?.intervalSeconds ?? 45}
                onToggle={() => handleReminderItemToggle("macroCheck")}
                onIntervalChange={(v) => handleReminderIntervalChange("macroCheck", v)}
              />
            </div>

            {/* Sacred Sites - One-time alerts */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={reminderConfig.sacredSites?.enabled ?? false}
                    onCheckedChange={handleSacredSitesToggle}
                  />
                  <Label>Sacred Site Alerts</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-8 mt-1">
                  Alerts at 4:30 and 5:00 for sacred sites
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
