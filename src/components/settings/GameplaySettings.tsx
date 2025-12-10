import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Gamepad2, Timer } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig, toggleClickThrough, toggleCompactMode } from "@/lib/tauri";
import { DEFAULT_TIMER_DRIFT_CONFIG } from "@/types";
import type { TimerDriftConfig } from "@/types";

export function GameplaySettings() {
  const { config, updateConfig } = useConfigStore();

  const handleClickThroughToggle = async () => {
    try {
      const newState = await toggleClickThrough();
      updateConfig({ click_through: newState });
    } catch (error) {
      console.error("Failed to toggle click-through:", error);
    }
  };

  const handleCompactToggle = async () => {
    try {
      const newState = await toggleCompactMode();
      updateConfig({ compact_mode: newState });
    } catch (error) {
      console.error("Failed to toggle compact mode:", error);
    }
  };

  const handleAutoAdvanceToggle = async () => {
    const newAutoAdvance = {
      ...config.auto_advance,
      enabled: !config.auto_advance.enabled,
    };
    updateConfig({ auto_advance: newAutoAdvance });
    try {
      await saveConfig({ ...config, auto_advance: newAutoAdvance });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleAutoAdvanceDelayChange = async (value: string) => {
    const delay = parseInt(value, 10) || 0;
    const newAutoAdvance = {
      ...config.auto_advance,
      delay_seconds: delay,
    };
    updateConfig({ auto_advance: newAutoAdvance });
    try {
      await saveConfig({ ...config, auto_advance: newAutoAdvance });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const timerDriftConfig = config.timerDrift ?? DEFAULT_TIMER_DRIFT_CONFIG;

  const handleTimerDriftToggle = async () => {
    const newConfig: TimerDriftConfig = {
      ...timerDriftConfig,
      enabled: !timerDriftConfig.enabled,
    };
    updateConfig({ timerDrift: newConfig });
    try {
      await saveConfig({ ...config, timerDrift: newConfig });
    } catch (error) {
      console.error("Failed to save timer drift config:", error);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Overlay Behavior Section */}
      <section className="bg-muted/30 rounded-xl p-4">
        <h2 className="text-base font-medium flex items-center gap-2 mb-3">
          <Gamepad2 className="w-5 h-5 text-muted-foreground" />
          Overlay Behavior
        </h2>

        <div className="space-y-3">
          {/* Click-Through Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="click-through">Click-Through Mode</Label>
            <Switch
              id="click-through"
              checked={config.click_through}
              onCheckedChange={handleClickThroughToggle}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="compact">Compact Mode</Label>
            <Switch
              id="compact"
              checked={config.compact_mode}
              onCheckedChange={handleCompactToggle}
            />
          </div>
        </div>
      </section>

      {/* Timing Section */}
      <section className="bg-muted/30 rounded-xl p-4">
        <h2 className="text-base font-medium flex items-center gap-2 mb-3">
          <Timer className="w-5 h-5 text-muted-foreground" />
          Timing
        </h2>

        <div className="space-y-3">
          {/* Auto-Advance */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-advance">Auto-Advance Steps</Label>
            <Switch
              id="auto-advance"
              checked={config.auto_advance.enabled}
              onCheckedChange={handleAutoAdvanceToggle}
            />
          </div>

          {/* Auto-Advance Child Settings */}
          {config.auto_advance.enabled && (
            <div className="ml-4 space-y-3">
              <div>
                <Label htmlFor="delay">Extra Delay (seconds)</Label>
              </div>
              <Input
                id="delay"
                type="number"
                min="0"
                max="30"
                value={config.auto_advance.delay_seconds}
                onChange={(e) => handleAutoAdvanceDelayChange(e.target.value)}
                className="w-24"
              />
            </div>
          )}

          {/* Smart Timer Drift */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="timer-drift">Smart Timer Drift</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust future step timings when you fall behind pace
              </p>
            </div>
            <Switch
              id="timer-drift"
              checked={timerDriftConfig.enabled}
              onCheckedChange={handleTimerDriftToggle}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
