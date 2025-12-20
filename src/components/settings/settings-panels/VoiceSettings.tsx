import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

  const applyVoiceProfile = async (profile: "step-only" | "full") => {
    const profileConfig: VoiceConfig =
      profile === "step-only"
        ? { ...voiceConfig, speakSteps: true, speakReminders: false, speakDelta: false }
        : { ...voiceConfig, speakSteps: true, speakReminders: true, speakDelta: true };
    updateConfig({ voice: profileConfig });
    try {
      await saveConfig({ ...config, voice: profileConfig });
    } catch (error) {
      console.error("Failed to save voice profile:", error);
    }
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4">
      <h2 className="text-base font-medium flex items-center gap-2 mb-3">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        Voice Coaching
      </h2>

      <div className="space-y-3">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-enabled">Enable Voice Coaching</Label>
          <Switch
            id="voice-enabled"
            checked={voiceConfig.enabled}
            onCheckedChange={handleVoiceToggle}
          />
        </div>

        {voiceConfig.enabled && (
          <>
            {/* Quick profiles */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => applyVoiceProfile("step-only")}>
                Step-only (silent reminders)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => applyVoiceProfile("full")}>
                Steps + reminders
              </Button>
            </div>

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

            {/* Speak options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="speak-steps">Speak Step Descriptions</Label>
                <Switch
                  id="speak-steps"
                  checked={voiceConfig.speakSteps}
                  onCheckedChange={() => handleVoiceOptionToggle("speakSteps")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="speak-reminders">Speak Reminders</Label>
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
