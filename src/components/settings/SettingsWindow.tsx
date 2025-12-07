import { useMemo, useState } from "react";
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
import { saveConfig, importBuildOrder, exportBuildOrder, saveBuildOrder } from "@/lib/tauri";
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
import { TelemetryToggle } from "./TelemetryToggle";
import { CIVILIZATIONS, DIFFICULTIES, type BuildOrder } from "@/types";

type StarterTemplate = Omit<BuildOrder, "id" | "enabled">;

const STARTER_BUILDS: StarterTemplate[] = [
  {
    name: "English Fast Feudal (Safe Longbows)",
    civilization: "English",
    description: "Stable macro opener with early longbows for map control.",
    difficulty: "Beginner",
    steps: [
      { id: "s1", description: "Queue 2 villagers to sheep; build house with starting vill", timing: "0:00", resources: { food: 50 } },
      { id: "s2", description: "Send 2 to gold, 6 to food; build mining camp", timing: "0:35" },
      { id: "s3", description: "Age up with Council Hall; rally next vills to wood", timing: "2:30" },
      { id: "s4", description: "Queue longbows; add house + second production building", timing: "4:30" },
    ],
  },
  {
    name: "French Knight Pressure",
    civilization: "French",
    description: "Fast School of Cavalry into early knight map pressure.",
    difficulty: "Intermediate",
    steps: [
      { id: "f1", description: "Queue 2 villagers to sheep; build house", timing: "0:00" },
      { id: "f2", description: "3 on gold, rest on food; build mining camp", timing: "0:40" },
      { id: "f3", description: "Age up with School of Cavalry; shift villagers to wood", timing: "2:20" },
      { id: "f4", description: "Queue first knight; scout for weak spots and relics", timing: "4:20" },
    ],
  },
];

export function SettingsWindow() {
  const { config, updateConfig } = useConfigStore();
  const { buildOrders, setBuildOrders } = useBuildOrderStore();
  const [filterCiv, setFilterCiv] = useState<string>(config.filter_civilization || "all");
  const [filterDiff, setFilterDiff] = useState<string>(config.filter_difficulty || "all");
  const [starterCiv, setStarterCiv] = useState<string>(STARTER_BUILDS[0].civilization);

  const starterBuild = useMemo(
    () => STARTER_BUILDS.find((b) => b.civilization === starterCiv) ?? STARTER_BUILDS[0],
    [starterCiv]
  );

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

  const handleStarterLoad = async () => {
    if (!starterBuild) return;
    const newOrder: BuildOrder = {
      ...starterBuild,
      id: `starter-${starterBuild.civilization.toLowerCase()}-${Date.now()}`,
      enabled: true,
    };
    const next = [...buildOrders, newOrder];
    setBuildOrders(next);
    try {
      await saveBuildOrder(newOrder);
    } catch (error) {
      console.error("Failed to save starter build:", error);
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
    <div className="w-full h-screen p-6 bg-background text-foreground overflow-hidden flex flex-col">
      <h1 className="text-2xl font-bold mb-6 shrink-0">Settings</h1>

      <Tabs defaultValue="build-orders" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-6 mb-6 shrink-0">
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
        <TabsContent value="build-orders" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-4">
            {buildOrders.length === 0 && starterBuild && (
              <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">First-launch wizard</p>
                    <p className="text-xs text-muted-foreground">
                      Pick a civ and start with a recommended ladder-safe build. You can import more later.
                    </p>
                  </div>
                  <div className="w-48">
                    <Label className="text-xs">Civilization</Label>
                    <Select value={starterCiv} onValueChange={setStarterCiv}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STARTER_BUILDS.map((b) => (
                          <SelectItem key={b.civilization} value={b.civilization}>
                            {b.civilization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md bg-background/60 border border-dashed border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{starterBuild.name}</p>
                      <p className="text-xs text-muted-foreground">{starterBuild.description}</p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {starterBuild.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {starterBuild.steps.slice(0, 3).map((step) => (
                      <div key={step.id} className="flex items-start gap-2 text-xs text-foreground/80">
                        <span className="text-[10px] font-mono text-amber-300">{step.timing ?? "—"}</span>
                        <span className="flex-1">{step.description}</span>
                      </div>
                    ))}
                    {starterBuild.steps.length > 3 && (
                      <p className="text-[11px] text-muted-foreground">…more steps included</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={handleStarterLoad} size="sm">
                    Load starter build
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Hotkeys keep the current defaults; you can customize them later.
                  </p>
                </div>
              </div>
            )}

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
        <TabsContent value="player" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <PlayerStats />
        </TabsContent>

        {/* Gameplay Tab */}
        <TabsContent value="gameplay" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <GameplaySettings />
          <Separator className="my-6" />
          <UpgradeBadgesSettings />
          <Separator className="my-6" />
          <TelemetryToggle />
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-6 max-w-lg">
            <VoiceSettings />
            <Separator />
            <ReminderSettings />
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <AppearanceSettings />
        </TabsContent>

        {/* Hotkeys Tab */}
        <TabsContent value="hotkeys" className="flex-1 overflow-y-auto custom-scrollbar pr-2">
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
