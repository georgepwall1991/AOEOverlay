import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Palette, Eye } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig } from "@/lib/tauri";
import type { Theme, FontSize } from "@/types";

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

  return (
    <div className="space-y-6 max-w-md">
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <Select value={config.theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
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
              <SelectTrigger>
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

      <Separator />

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Overlay
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="opacity">Overlay Opacity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(config.overlay_opacity * 100)}%
              </span>
            </div>
            <Slider
              id="opacity"
              min={0.1}
              max={1}
              step={0.1}
              value={[config.overlay_opacity]}
              onValueChange={handleOpacityChange}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
