import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useConfigStore, useEventLogStore } from "@/stores";
import { DEFAULT_TELEMETRY_CONFIG, type TelemetryEvent } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogOptions {
  source?: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

/**
 * Lightweight, opt-in telemetry logger.
 * Stores events locally in-memory only when telemetry is enabled.
 */
export function logTelemetryEvent(type: string, options: LogOptions = {}) {
  const config = useConfigStore.getState().config;
  const telemetry = config.telemetry ?? DEFAULT_TELEMETRY_CONFIG;

  if (!telemetry.enabled) return;

  // Respect capture filters
  if (!telemetry.captureHotkeys && type.startsWith("hotkey")) return;
  if (!telemetry.captureActions && type.startsWith("action")) return;

  const payload: Omit<TelemetryEvent, "id" | "timestamp"> = {
    type,
    source: options.source,
    detail: options.detail,
    meta: options.meta,
  };

  useEventLogStore
    .getState()
    .addEvent({ ...payload, maxEvents: telemetry.maxEvents });
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
