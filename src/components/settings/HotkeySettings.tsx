import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Keyboard } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig, reloadHotkeys } from "@/lib/tauri";
import type { HotkeyConfig } from "@/types";

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

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Keyboard className="w-5 h-5" />
        Global Hotkeys
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        These hotkeys work even when the game has focus.
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
        <HotkeyRow
          label="Toggle Pause"
          value={config.hotkeys.toggle_pause}
          onChange={(key) => handleHotkeyChange("toggle_pause", key)}
        />
      </div>
    </section>
  );
}
