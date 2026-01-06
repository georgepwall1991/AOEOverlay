import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig, reloadHotkeys } from "@/lib/tauri";
import type { HotkeyConfig } from "@/types";
import { HotkeyCapture } from "./HotkeyCapture";

const PRESET_QWERTY: HotkeyConfig = {
  toggle_overlay: "Ctrl+Alt+F1",
  previous_step: "Ctrl+Alt+F2",
  next_step: "Ctrl+Alt+F3",
  cycle_build_order: "Ctrl+Alt+F4",
  toggle_click_through: "Ctrl+Alt+F5",
  toggle_compact: "Ctrl+Alt+F6",
  reset_build_order: "Ctrl+Alt+F7",
  toggle_pause: "Ctrl+Alt+F8",
  activate_branch_main: "Ctrl+Alt+0",
  activate_branch_1: "Ctrl+Alt+1",
  activate_branch_2: "Ctrl+Alt+2",
  activate_branch_3: "Ctrl+Alt+3",
  activate_branch_4: "Ctrl+Alt+4",
  toggle_counters: "Ctrl+Alt+TAB",
};

const PRESET_AZERTY: HotkeyConfig = {
  toggle_overlay: "Ctrl+Alt+F1",
  previous_step: "Ctrl+Alt+A",
  next_step: "Ctrl+Alt+Z",
  cycle_build_order: "Ctrl+Alt+E",
  toggle_click_through: "Ctrl+Alt+R",
  toggle_compact: "Ctrl+Alt+T",
  reset_build_order: "Ctrl+Alt+Y",
  toggle_pause: "Ctrl+Alt+U",
  activate_branch_main: "Ctrl+Alt+0",
  activate_branch_1: "Ctrl+Alt+1",
  activate_branch_2: "Ctrl+Alt+2",
  activate_branch_3: "Ctrl+Alt+3",
  activate_branch_4: "Ctrl+Alt+4",
  toggle_counters: "Ctrl+Alt+TAB",
};

interface HotkeyRowProps {
  label: string;
  value: string;
  onChange: (key: string) => void;
}

function HotkeyRow({ label, value, onChange }: HotkeyRowProps) {
  return (
    <div className="flex items-center justify-between py-1 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      <span className="text-sm font-medium">{label}</span>
      <HotkeyCapture value={value} onChange={onChange} />
    </div>
  );
}

export function HotkeySettings() {
  const { config, updateConfig } = useConfigStore();

  const handleHotkeyChange = async (key: keyof HotkeyConfig, value: string) => {
    const newHotkeys = { ...config.hotkeys, [key]: value };
    updateConfig({ hotkeys: newHotkeys });
    try {
      await saveConfig({ ...config, hotkeys: newHotkeys });
      await reloadHotkeys();
    } catch (error) {
      console.error("Failed to save hotkey config:", error);
    }
  };

  const applyPreset = async (preset: HotkeyConfig) => {
    updateConfig({ hotkeys: preset });
    try {
      await saveConfig({ ...config, hotkeys: preset });
      await reloadHotkeys();
    } catch (error) {
      console.error("Failed to apply hotkey preset:", error);
    }
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4">
      <h2 className="text-base font-medium flex items-center gap-2 mb-3">
        <Keyboard className="w-5 h-5 text-muted-foreground" />
        Global Hotkeys
      </h2>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button size="sm" variant="outline" onClick={() => applyPreset(PRESET_QWERTY)}>
          Competitive defaults (QWERTY)
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset(PRESET_AZERTY)}>
          AZERTY-friendly
        </Button>
        <Button size="sm" variant="ghost" onClick={() => applyPreset(PRESET_QWERTY)}>
          Restore defaults
        </Button>
      </div>

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
        <HotkeyRow
          label="Toggle Pause"
          value={config.hotkeys.toggle_pause}
          onChange={(key) => handleHotkeyChange("toggle_pause", key)}
        />
        <HotkeyRow
          label="Toggle Counter Reference"
          value={config.hotkeys.toggle_counters}
          onChange={(key) => handleHotkeyChange("toggle_counters", key)}
        />
        
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Branch Activation</h3>
          <div className="space-y-3">
            <HotkeyRow
              label="Switch to Main Branch"
              value={config.hotkeys.activate_branch_main}
              onChange={(key) => handleHotkeyChange("activate_branch_main", key)}
            />
            <HotkeyRow
              label="Switch to Branch 1"
              value={config.hotkeys.activate_branch_1}
              onChange={(key) => handleHotkeyChange("activate_branch_1", key)}
            />
            <HotkeyRow
              label="Switch to Branch 2"
              value={config.hotkeys.activate_branch_2}
              onChange={(key) => handleHotkeyChange("activate_branch_2", key)}
            />
            <HotkeyRow
              label="Switch to Branch 3"
              value={config.hotkeys.activate_branch_3}
              onChange={(key) => handleHotkeyChange("activate_branch_3", key)}
            />
            <HotkeyRow
              label="Switch to Branch 4"
              value={config.hotkeys.activate_branch_4}
              onChange={(key) => handleHotkeyChange("activate_branch_4", key)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
