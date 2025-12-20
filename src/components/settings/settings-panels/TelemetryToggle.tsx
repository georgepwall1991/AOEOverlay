import { useMemo } from "react";
import { Activity, Trash2, Clipboard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfigStore, useEventLogEvents, useEventLogStore } from "@/stores";
import { DEFAULT_TELEMETRY_CONFIG, type TelemetryConfig } from "@/types";
import { formatTimestamp, logTelemetryEvent } from "@/lib/utils";
import { saveConfig } from "@/lib/tauri";

export function TelemetryToggle() {
  const { config, updateConfig } = useConfigStore();
  const events = useEventLogEvents();
  const clear = useEventLogStore((s) => s.clear);

  const telemetryConfig: TelemetryConfig = useMemo(
    () => ({ ...DEFAULT_TELEMETRY_CONFIG, ...(config.telemetry ?? {}) }),
    [config.telemetry]
  );

  const handleToggle = async (enabled: boolean) => {
    const nextConfig: TelemetryConfig = { ...telemetryConfig, enabled };
    updateConfig({ telemetry: nextConfig });
    try {
      await saveConfig({ ...config, telemetry: nextConfig });
    } catch (error) {
      console.error("Failed to save telemetry config:", error);
    }
  };

  const handleClear = () => {
    clear();
    logTelemetryEvent("action:telemetry:clear", { source: "settings" });
  };

  const frictionSummary = useMemo(() => {
    const recent = events.slice(-50);
    const resets = recent.filter((e) => e.type.includes("reset")).length;
    const pauses = recent.filter((e) => e.type.includes("pause")).length;
    const clickThrough = recent.filter((e) => e.type.includes("click-through")).length;
    const stepBacks = recent.filter((e) => e.type.includes("step:previous")).length;

    const notes: string[] = [];
    if (resets >= 3) notes.push("Frequent resets detected");
    if (pauses >= 3) notes.push("Timer paused often");
    if (clickThrough >= 2) notes.push("Toggling click-through repeatedly");
    if (stepBacks >= 5) notes.push("Lots of backtracking steps");

    return { resets, pauses, clickThrough, stepBacks, notes };
  }, [events]);

  const handleExport = async () => {
    const payload = JSON.stringify({ events, total: events.length }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      logTelemetryEvent("action:telemetry:export", { source: "settings" });
    } catch (error) {
      console.error("Failed to copy telemetry:", error);
    }
  };

  return (
    <section className="bg-muted/30 rounded-xl p-4">
      <h2 className="text-base font-medium flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-muted-foreground" />
        Usage Logging
      </h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="telemetry">Enable Local Logging</Label>
            <p className="text-xs text-muted-foreground">
              Capture actions to spot friction. Never leaves your device.
            </p>
          </div>
          <Switch
            id="telemetry"
            checked={telemetryConfig.enabled}
            onCheckedChange={handleToggle}
          />
        </div>

      {telemetryConfig.enabled && (
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Recording last {telemetryConfig.maxEvents} events
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                Hotkeys {telemetryConfig.captureHotkeys ? "on" : "off"}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Actions {telemetryConfig.captureActions ? "on" : "off"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleClear}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleExport}
              >
                <Clipboard className="w-3.5 h-3.5 mr-1" />
                Copy export
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-border/60 p-3 space-y-2 bg-background/50">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Friction summary</Badge>
              <span className="text-[11px] text-muted-foreground">Last 50 actions</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline">Resets: {frictionSummary.resets}</Badge>
              <Badge variant="outline">Pauses: {frictionSummary.pauses}</Badge>
              <Badge variant="outline">Click-through toggles: {frictionSummary.clickThrough}</Badge>
              <Badge variant="outline">Step backs: {frictionSummary.stepBacks}</Badge>
            </div>
            {frictionSummary.notes.length > 0 ? (
              <ul className="list-disc ml-5 text-[11px] text-foreground/80 space-y-1">
                {frictionSummary.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground">No obvious friction in recent actions.</p>
            )}
          </div>

          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events yet. Perform actions to see logs.</p>
          ) : (
            <ScrollArea className="h-36 rounded-md border bg-background/40">
              <div className="divide-y divide-border">
                {[...events].reverse().map((event) => (
                  <div key={event.id} className="px-3 py-2 text-xs flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {event.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{event.detail || event.source || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
      </div>
    </section>
  );
}


