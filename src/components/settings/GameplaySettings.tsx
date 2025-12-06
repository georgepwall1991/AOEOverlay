import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MousePointer2Off, Minimize2, Gamepad2, Timer } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig, toggleClickThrough, toggleCompactMode } from "@/lib/tauri";

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

  return (
    <div className="space-y-6 max-w-md">
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Overlay Behavior
        </h2>

        <div className="space-y-4">
          {/* Click-Through Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer2Off className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="click-through">Click-Through Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Clicks pass through the overlay to the game
                </p>
              </div>
            </div>
            <Switch
              id="click-through"
              checked={config.click_through}
              onCheckedChange={handleClickThroughToggle}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="compact">Compact Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Shows only the current step
                </p>
              </div>
            </div>
            <Switch
              id="compact"
              checked={config.compact_mode}
              onCheckedChange={handleCompactToggle}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Auto-Advance Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Auto-Advance
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-advance">Auto-Advance Steps</Label>
              <p className="text-xs text-muted-foreground">
                Automatically move to next step based on timing
              </p>
            </div>
            <Switch
              id="auto-advance"
              checked={config.auto_advance.enabled}
              onCheckedChange={handleAutoAdvanceToggle}
            />
          </div>

          {config.auto_advance.enabled && (
            <div className="space-y-2">
              <Label htmlFor="delay">Extra Delay (seconds)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                max="30"
                value={config.auto_advance.delay_seconds}
                onChange={(e) => handleAutoAdvanceDelayChange(e.target.value)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                Wait this many seconds after the step's timing before advancing
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
