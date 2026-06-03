import { ScanEye, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useConfigStore, useOcrAssistStore } from "@/stores";
import { saveConfig, setContentProtection } from "@/lib/tauri";
import { DEFAULT_OCR_ASSIST_CONFIG, type OcrAssistConfig } from "@/types";

export function OcrAssistSettings() {
  const { config, updateConfig } = useConfigStore();
  const { status, confidence, warnings, setStatus, reset } = useOcrAssistStore();
  const ocrConfig = config.ocrAssist ?? DEFAULT_OCR_ASSIST_CONFIG;

  const persist = async (next: OcrAssistConfig) => {
    updateConfig({ ocrAssist: next });
    try {
      await saveConfig({ ...config, ocrAssist: next });
    } catch (error) {
      console.error("Failed to save OCR assist config:", error);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    const next = { ...ocrConfig, enabled };
    await persist(next);
    setStatus(enabled ? "calibrating" : "off");
    if (!enabled) reset();

    // OCR screenshots the screen, so protect the overlay from capture the moment
    // OCR turns on — otherwise it would read its own pixels. We don't auto-disable
    // protection when OCR is turned off (the user may still want it for streaming).
    if (enabled && !config.content_protection) {
      updateConfig({ content_protection: true });
      try {
        await setContentProtection(true);
      } catch (error) {
        console.error("Failed to enable content protection for OCR:", error);
      }
    }
  };

  const updateNumber = async (
    key: "pollIntervalMs" | "confidenceThreshold",
    value: string
  ) => {
    const parsed = key === "confidenceThreshold"
      ? Math.min(Math.max(Number(value), 0.5), 0.99)
      : Math.min(Math.max(parseInt(value, 10) || 1500, 500), 10000);
    await persist({ ...ocrConfig, [key]: parsed });
  };

  const toggleSignal = async (signal: keyof OcrAssistConfig["signals"], enabled: boolean) => {
    await persist({
      ...ocrConfig,
      signals: {
        ...ocrConfig.signals,
        [signal]: enabled,
      },
    });
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4">
      <h2 className="text-base font-medium flex items-center gap-2 mb-3">
        <ScanEye className="w-5 h-5 text-muted-foreground" />
        OCR Assist
      </h2>

      <div className="space-y-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Experimental and read-only. OCR hints can surface age/resource/population signals, but they never auto-advance steps.
            Enabling OCR also turns on “Hide from screen capture” so the overlay never reads its own pixels.
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ocr-enabled">Enable OCR Assist</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Current status: {status}; confidence {Math.round(confidence * 100)}%
            </p>
          </div>
          <Switch
            id="ocr-enabled"
            checked={ocrConfig.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="ocr-poll">Poll interval (ms)</Label>
            <Input
              id="ocr-poll"
              type="number"
              min="500"
              max="10000"
              value={ocrConfig.pollIntervalMs}
              onChange={(event) => updateNumber("pollIntervalMs", event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ocr-confidence">Confidence threshold</Label>
            <Input
              id="ocr-confidence"
              type="number"
              min="0.5"
              max="0.99"
              step="0.01"
              value={ocrConfig.confidenceThreshold}
              onChange={(event) => updateNumber("confidenceThreshold", event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["age", "resources", "population"] as const).map((signal) => (
            <div key={signal} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2">
              <Label htmlFor={`ocr-${signal}`} className="capitalize">{signal}</Label>
              <Switch
                id={`ocr-${signal}`}
                checked={ocrConfig.signals[signal]}
                onCheckedChange={(enabled) => toggleSignal(signal, enabled)}
              />
            </div>
          ))}
        </div>

        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((warning) => (
              <p key={warning} className="text-[11px] text-muted-foreground">
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
