export interface TelemetryEvent {
  id: string;
  type: string;
  source?: string;
  detail?: string;
  meta?: Record<string, unknown>;
  timestamp: number;
}

export interface TelemetrySnapshot {
  events: TelemetryEvent[];
  total: number;
}



