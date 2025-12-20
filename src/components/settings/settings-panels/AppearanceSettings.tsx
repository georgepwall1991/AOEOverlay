import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Eye } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig } from "@/lib/tauri";
import type { Theme, FontSize, OverlayPreset } from "@/types";

export function AppearanceSettings() {
  const { config, updateConfig } = useConfigStore();

  const handleThemeChange = async (value: Theme) => {
    updateConfig({ theme: value });
    try {
      await saveConfig({ ...config, theme: value });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleFontSizeChange = async (value: FontSize) => {
    updateConfig({ font_size: value });
    try {
      await saveConfig({ ...config, font_size: value });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleOpacityChange = async (value: number[]) => {
    const opacity = value[0];
    updateConfig({ overlay_opacity: opacity });
    try {
      await saveConfig({ ...config, overlay_opacity: opacity });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleScaleChange = async (value: number[]) => {
    const ui_scale = value[0];
    updateConfig({ ui_scale });
    try {
      await saveConfig({ ...config, ui_scale });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handlePresetChange = async (value: OverlayPreset) => {
    updateConfig({ overlay_preset: value });
    try {
      await saveConfig({ ...config, overlay_preset: value });
    } catch (error) {
      console.error("Failed to save preset:", error);
    }
  };

  const handleCoachOnlyToggle = async (enabled: boolean) => {
    updateConfig({ coach_only_mode: enabled });
    try {
      await saveConfig({ ...config, coach_only_mode: enabled });
    } catch (error) {
      console.error("Failed to save coach-only mode:", error);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <section className="bg-muted/30 rounded-xl p-4">
        <h2 className="text-base font-medium flex items-center gap-2 mb-3">
          <Palette className="w-5 h-5 text-muted-foreground" />
          Theme
        </h2>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <Select value={config.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select value={config.font_size} onValueChange={handleFontSizeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 rounded-xl p-4">
        <h2 className="text-base font-medium flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-muted-foreground" />
          Overlay
        </h2>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="opacity">Overlay Opacity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(config.overlay_opacity * 100)}%
              </span>
            </div>
            <Slider
              data-testid="opacity-slider"
              id="opacity"
              min={0.1}
              max={1}
              step={0.1}
              value={[config.overlay_opacity]}
              onValueChange={handleOpacityChange}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scale">UI Scale</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round((config.ui_scale ?? 1) * 100)}%
              </span>
            </div>
            <Slider
              data-testid="ui-scale-slider"
              id="scale"
              min={0.85}
              max={1.2}
              step={0.05}
              value={[config.ui_scale ?? 1]}
              onValueChange={handleScaleChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Overlay Preset</Label>
            <Select
              value={config.overlay_preset ?? "info_dense"}
              onValueChange={(v) => handlePresetChange(v as OverlayPreset)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info_dense">Info dense</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="coach-mode">Coach-only Mode</Label>
            <Switch
              id="coach-mode"
              checked={config.coach_only_mode ?? false}
              onCheckedChange={handleCoachOnlyToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-clock">Show System Clock</Label>
            <Switch
              id="show-clock"
              checked={config.show_clock ?? true}
              onCheckedChange={async (enabled) => {
                updateConfig({ show_clock: enabled });
                try {
                  await saveConfig({ ...config, show_clock: enabled });
                } catch (error) {
                  console.error("Failed to save clock config:", error);
                }
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
