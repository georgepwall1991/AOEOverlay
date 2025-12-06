import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Volume2 } from "lucide-react";
import { useConfigStore } from "@/stores";
import { saveConfig } from "@/lib/tauri";
import { DEFAULT_VOICE_CONFIG } from "@/types";
import type { VoiceConfig } from "@/types";

export function VoiceSettings() {
  const { config, updateConfig } = useConfigStore();
  const voiceConfig = config.voice ?? DEFAULT_VOICE_CONFIG;

  const handleVoiceToggle = async () => {
    const newVoice: VoiceConfig = { ...voiceConfig, enabled: !voiceConfig.enabled };
    updateConfig({ voice: newVoice });
    try {
      await saveConfig({ ...config, voice: newVoice });
    } catch (error) {
      console.error("Failed to save voice config:", error);
    }
  };

  const handleVoiceRateChange = async (value: number[]) => {
    const rate = value[0];
    const newVoice: VoiceConfig = { ...voiceConfig, rate };
    updateConfig({ voice: newVoice });
    try {
      await saveConfig({ ...config, voice: newVoice });
    } catch (error) {
      console.error("Failed to save voice config:", error);
    }
  };

  const handleVoiceOptionToggle = async (option: keyof Pick<VoiceConfig, "speakSteps" | "speakReminders" | "speakDelta">) => {
    const newVoice: VoiceConfig = { ...voiceConfig, [option]: !voiceConfig[option] };
    updateConfig({ voice: newVoice });
    try {
      await saveConfig({ ...config, voice: newVoice });
    } catch (error) {
      console.error("Failed to save voice config:", error);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Volume2 className="w-5 h-5" />
        Voice Coaching
      </h2>

      <div className="space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="voice-enabled">Enable Voice Coaching</Label>
            <p className="text-xs text-muted-foreground">
              Use text-to-speech to read step descriptions
            </p>
          </div>
          <Switch
            id="voice-enabled"
            checked={voiceConfig.enabled}
            onCheckedChange={handleVoiceToggle}
          />
        </div>

        {voiceConfig.enabled && (
          <>
            {/* Speech rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-rate">Speech Rate</Label>
                <span className="text-sm text-muted-foreground">
                  {voiceConfig.rate.toFixed(1)}x
                </span>
              </div>
              <Slider
                id="voice-rate"
                min={0.5}
                max={2.0}
                step={0.1}
                value={[voiceConfig.rate]}
                onValueChange={handleVoiceRateChange}
              />
            </div>

            <Separator />

            {/* Speak options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="speak-steps">Speak Step Descriptions</Label>
                  <p className="text-xs text-muted-foreground">
                    Read the description when you advance steps
                  </p>
                </div>
                <Switch
                  id="speak-steps"
                  checked={voiceConfig.speakSteps}
                  onCheckedChange={() => handleVoiceOptionToggle("speakSteps")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="speak-reminders">Speak Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Announce periodic coaching reminders
                  </p>
                </div>
                <Switch
                  id="speak-reminders"
                  checked={voiceConfig.speakReminders}
                  onCheckedChange={() => handleVoiceOptionToggle("speakReminders")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="speak-delta">Speak Pacing Warnings</Label>
                  <p className="text-xs text-muted-foreground">
                    Warn when you fall behind pace (30+ seconds)
                  </p>
                </div>
                <Switch
                  id="speak-delta"
                  checked={voiceConfig.speakDelta}
                  onCheckedChange={() => handleVoiceOptionToggle("speakDelta")}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
