import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig, reloadHotkeys } from "@/lib/tauri";
import type { HotkeyConfig } from "@/types";

const AVAILABLE_HOTKEYS = [
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P", "Q", "S", "D", "F", "G", "H", "J", "K", "L",
];

const PRESET_QWERTY: HotkeyConfig = {
  toggle_overlay: "F1",
  previous_step: "F2",
  next_step: "F3",
  cycle_build_order: "F4",
  toggle_click_through: "F5",
  toggle_compact: "F6",
  reset_build_order: "F7",
  toggle_pause: "F8",
};

const PRESET_AZERTY: HotkeyConfig = {
  toggle_overlay: "F1",
  previous_step: "A",
  next_step: "Z",
  cycle_build_order: "E",
  toggle_click_through: "R",
  toggle_compact: "T",
  reset_build_order: "Y",
  toggle_pause: "U",
};

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
      </div>
    </section>
  );
}
