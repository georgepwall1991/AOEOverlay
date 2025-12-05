import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfigStore } from "@/stores";
import { saveConfig, toggleClickThrough, toggleCompactMode } from "@/lib/tauri";
import { Separator } from "@/components/ui/separator";
import { MousePointer2Off, Minimize2, Eye, Gamepad2, List, Settings2 } from "lucide-react";
import { BuildOrderManager } from "./BuildOrderManager";

export function SettingsWindow() {
  const { config, updateConfig } = useConfigStore();

  const handleOpacityChange = async (value: number[]) => {
    const opacity = value[0];
    updateConfig({ overlay_opacity: opacity });
    try {
      await saveConfig({ ...config, overlay_opacity: opacity });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

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

  return (
    <div className="w-full h-full p-6 bg-background text-foreground overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="build-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="build-orders" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Build Orders
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Build Orders Tab */}
        <TabsContent value="build-orders">
          <BuildOrderManager />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6 max-w-md">
            {/* Gameplay Section */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Gameplay
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

            {/* Appearance Section */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Appearance
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

            <Separator />

            {/* Hotkeys Section */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Hotkeys</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle Overlay</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {config.hotkeys.toggle_overlay}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Previous Step</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {config.hotkeys.previous_step}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Step</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {config.hotkeys.next_step}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cycle Build Order</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {config.hotkeys.cycle_build_order}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle Click-Through</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {config.hotkeys.toggle_click_through}
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle Compact Mode</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {config.hotkeys.toggle_compact}
                  </kbd>
                </div>
              </div>
            </section>

            <Separator />

            {/* About Section */}
            <section>
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <p className="text-sm text-muted-foreground">
                AoE4 Overlay v0.1.0
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Build order overlay for Age of Empires 4
              </p>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
