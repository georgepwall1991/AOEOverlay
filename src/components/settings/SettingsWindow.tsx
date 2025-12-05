import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfigStore, useBuildOrderStore } from "@/stores";
import {
  saveConfig,
  toggleClickThrough,
  toggleCompactMode,
  importBuildOrder,
  exportBuildOrder,
} from "@/lib/tauri";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer2Off,
  Minimize2,
  Eye,
  Gamepad2,
  List,
  Keyboard,
  Timer,
  Palette,
  Upload,
  Filter,
  User,
} from "lucide-react";
import { BuildOrderManager } from "./BuildOrderManager";
import { PlayerStats } from "./PlayerStats";
import { CIVILIZATIONS, DIFFICULTIES } from "@/types";
import type { Theme, FontSize, HotkeyConfig } from "@/types";

const AVAILABLE_HOTKEYS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];

interface HotkeyRowProps {
  label: string;
  value: string;
  onChange: (key: string) => void;
}

function HotkeyRow({ label, value, onChange }: HotkeyRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_HOTKEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SettingsWindow() {
  const { config, updateConfig } = useConfigStore();
  const { buildOrders, setBuildOrders } = useBuildOrderStore();
  const [filterCiv, setFilterCiv] = useState<string>(config.filter_civilization || "all");
  const [filterDiff, setFilterDiff] = useState<string>(config.filter_difficulty || "all");

  const handleHotkeyChange = async (key: keyof HotkeyConfig, value: string) => {
    const newHotkeys = { ...config.hotkeys, [key]: value };
    updateConfig({ hotkeys: newHotkeys });
    try {
      await saveConfig({ ...config, hotkeys: newHotkeys });
    } catch (error) {
      console.error("Failed to save hotkey config:", error);
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

  const handleFilterCivChange = async (value: string) => {
    setFilterCiv(value);
    const filterValue = value === "all" ? undefined : value;
    updateConfig({ filter_civilization: filterValue });
    try {
      await saveConfig({ ...config, filter_civilization: filterValue });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleFilterDiffChange = async (value: string) => {
    setFilterDiff(value);
    const filterValue = value === "all" ? undefined : value;
    updateConfig({ filter_difficulty: filterValue });
    try {
      await saveConfig({ ...config, filter_difficulty: filterValue });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (selected) {
        const imported = await importBuildOrder(selected as string);
        setBuildOrders([...buildOrders, imported]);
      }
    } catch (error) {
      console.error("Failed to import build order:", error);
    }
  };

  const handleExport = async (orderId: string) => {
    const order = buildOrders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const selected = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: `${order.name.replace(/\s+/g, "-").toLowerCase()}.json`,
      });
      if (selected) {
        await exportBuildOrder(order, selected);
      }
    } catch (error) {
      console.error("Failed to export build order:", error);
    }
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else if (config.theme === "dark") {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }
  }, [config.theme]);

  return (
    <div className="w-full h-full p-6 bg-background text-foreground overflow-hidden flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="build-orders" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="build-orders" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Build Orders
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Player
          </TabsTrigger>
          <TabsTrigger value="gameplay" className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            Gameplay
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="hotkeys" className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Hotkeys
          </TabsTrigger>
        </TabsList>

        {/* Build Orders Tab */}
        <TabsContent value="build-orders">
          <div className="space-y-4">
            {/* Import/Export */}
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/50">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Civilization</Label>
                  <Select value={filterCiv} onValueChange={handleFilterCivChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Civilizations</SelectItem>
                      {CIVILIZATIONS.map((civ) => (
                        <SelectItem key={civ} value={civ}>
                          {civ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Difficulty</Label>
                  <Select value={filterDiff} onValueChange={handleFilterDiffChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      {DIFFICULTIES.map((diff) => (
                        <SelectItem key={diff} value={diff}>
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <BuildOrderManager
              filterCiv={filterCiv === "all" ? undefined : filterCiv}
              filterDiff={filterDiff === "all" ? undefined : filterDiff}
              onExport={handleExport}
            />
          </div>
        </TabsContent>

        {/* Player Tab */}
        <TabsContent value="player" className="flex-1 overflow-auto">
          <PlayerStats />
        </TabsContent>

        {/* Gameplay Tab */}
        <TabsContent value="gameplay">
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
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
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
        </TabsContent>

        {/* Hotkeys Tab */}
        <TabsContent value="hotkeys">
          <div className="space-y-6 max-w-md">
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Global Hotkeys
              </h2>

              <p className="text-sm text-muted-foreground mb-4">
                These hotkeys work even when the game has focus. Changes require app restart.
              </p>

              <div className="space-y-3">
                <HotkeyRow
                  label="Toggle Overlay"
                  value={config.hotkeys.toggle_overlay}
                  onChange={(key) => handleHotkeyChange("toggle_overlay", key)}
                />
                <HotkeyRow
                  label="Previous Step"
                  value={config.hotkeys.previous_step}
                  onChange={(key) => handleHotkeyChange("previous_step", key)}
                />
                <HotkeyRow
                  label="Next Step"
                  value={config.hotkeys.next_step}
                  onChange={(key) => handleHotkeyChange("next_step", key)}
                />
                <HotkeyRow
                  label="Cycle Build Order"
                  value={config.hotkeys.cycle_build_order}
                  onChange={(key) => handleHotkeyChange("cycle_build_order", key)}
                />
                <HotkeyRow
                  label="Toggle Click-Through"
                  value={config.hotkeys.toggle_click_through}
                  onChange={(key) => handleHotkeyChange("toggle_click_through", key)}
                />
                <HotkeyRow
                  label="Toggle Compact Mode"
                  value={config.hotkeys.toggle_compact}
                  onChange={(key) => handleHotkeyChange("toggle_compact", key)}
                />
                <HotkeyRow
                  label="Reset to Step 1"
                  value={config.hotkeys.reset_build_order}
                  onChange={(key) => handleHotkeyChange("reset_build_order", key)}
                />
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
