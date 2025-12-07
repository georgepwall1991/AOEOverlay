import { create } from "zustand";
import type { TelemetryEvent } from "@/types";

const FALLBACK_MAX_EVENTS = 200;

const makeId = () =>
  `te-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface TelemetryState {
  events: TelemetryEvent[];
  total: number;
  addEvent: (
    event: Omit<TelemetryEvent, "id" | "timestamp"> & {
      id?: string;
      timestamp?: number;
      maxEvents?: number;
    }
  ) => void;
  clear: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  events: [],
  total: 0,

  addEvent: (event) =>
    set((state) => {
      const payload: TelemetryEvent = {
        id: event.id ?? makeId(),
        timestamp: event.timestamp ?? Date.now(),
        type: event.type,
        source: event.source,
        detail: event.detail,
        meta: event.meta,
      };

      const max = event.maxEvents ?? FALLBACK_MAX_EVENTS;
      const nextEvents = [...state.events, payload];
      const trimmed =
        nextEvents.length > max ? nextEvents.slice(nextEvents.length - max) : nextEvents;

      return {
        events: trimmed,
        total: state.total + 1,
      };
    }),

  clear: () => set({ events: [], total: 0 }),
}));

// Selectors
export const useTelemetryEvents = () => useTelemetryStore((state) => state.events);


