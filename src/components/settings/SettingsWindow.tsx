import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useConfigStore, useBuildOrderStore } from "@/stores";
import { saveConfig, importBuildOrder, exportBuildOrder } from "@/lib/tauri";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  Gamepad2,
  List,
  Keyboard,
  Palette,
  Upload,
  Filter,
  User,
  Volume2,
} from "lucide-react";
import { BuildOrderManager } from "./BuildOrderManager";
import { PlayerStats } from "./PlayerStats";
import { VoiceSettings } from "./VoiceSettings";
import { ReminderSettings } from "./ReminderSettings";
import { UpgradeBadgesSettings } from "./UpgradeBadgesSettings";
import { HotkeySettings } from "./HotkeySettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { GameplaySettings } from "./GameplaySettings";
import { CIVILIZATIONS, DIFFICULTIES } from "@/types";

export function SettingsWindow() {
  const { config, updateConfig } = useConfigStore();
  const { buildOrders, setBuildOrders } = useBuildOrderStore();
  const [filterCiv, setFilterCiv] = useState<string>(config.filter_civilization || "all");
  const [filterDiff, setFilterDiff] = useState<string>(config.filter_difficulty || "all");

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

  return (
    <div className="w-full h-full p-6 bg-background text-foreground overflow-hidden flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="build-orders" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-6 mb-6">
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
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Voice
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
          <GameplaySettings />
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="overflow-auto">
          <div className="space-y-6 max-w-lg">
            <VoiceSettings />
            <Separator />
            <ReminderSettings />
            <Separator />
            <UpgradeBadgesSettings />
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        {/* Hotkeys Tab */}
        <TabsContent value="hotkeys">
          <div className="space-y-6 max-w-md">
            <HotkeySettings />

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
