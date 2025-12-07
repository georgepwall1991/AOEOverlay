import { describe, it, expect, beforeEach } from "vitest";
import { cn, logTelemetryEvent, formatTimestamp } from "./utils";
import { useConfigStore, useEventLogStore } from "@/stores";

describe("utils", () => {
  describe("cn (class name merger)", () => {
    it("merges single class", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("merges multiple classes", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      const showBar = true;
      const showBaz = false;
      expect(cn("foo", showBar && "bar", showBaz && "baz")).toBe("foo bar");
    });

    it("handles undefined and null values", () => {
      expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("handles empty string", () => {
      expect(cn("foo", "", "bar")).toBe("foo bar");
    });

    it("merges tailwind classes correctly", () => {
      // tw-merge deduplicates conflicting utilities
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("preserves non-conflicting tailwind classes", () => {
      expect(cn("px-2", "py-4")).toBe("px-2 py-4");
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("handles array of classes via clsx", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("handles object notation via clsx", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("handles mixed inputs", () => {
      expect(
        cn("base", { conditional: true }, ["array-class"], "another")
      ).toBe("base conditional array-class another");
    });

    it("handles complex tailwind conflicts", () => {
      // More specific wins
      expect(cn("p-4", "px-2")).toBe("p-4 px-2");
      // Same axis, later wins
      expect(cn("mx-2", "mx-4")).toBe("mx-4");
    });
  });

  describe("formatTimestamp", () => {
    it("formats timestamp to time string", () => {
      // Create a known timestamp
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const timestamp = date.getTime();

      const result = formatTimestamp(timestamp);

      // Format depends on locale, but should contain hour:minute:second pattern
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it("handles midnight timestamp", () => {
      const midnight = new Date(2024, 0, 1, 0, 0, 0).getTime();
      const result = formatTimestamp(midnight);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it("handles noon timestamp", () => {
      const noon = new Date(2024, 0, 1, 12, 0, 0).getTime();
      const result = formatTimestamp(noon);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it("handles end of day timestamp", () => {
      const endOfDay = new Date(2024, 0, 1, 23, 59, 59).getTime();
      const result = formatTimestamp(endOfDay);
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it("handles Date.now()", () => {
      const now = Date.now();
      const result = formatTimestamp(now);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns consistent format for same timestamp", () => {
      const timestamp = 1700000000000;
      const result1 = formatTimestamp(timestamp);
      const result2 = formatTimestamp(timestamp);
      expect(result1).toBe(result2);
    });
  });

  describe("logTelemetryEvent", () => {
    beforeEach(() => {
      // Reset stores before each test
      useEventLogStore.getState().clear();
      // Set up default config with telemetry disabled
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: false,
            captureHotkeys: true,
            captureActions: true,
            maxEvents: 100,
          },
        },
      });
    });

    it("does nothing when telemetry is disabled", () => {
      logTelemetryEvent("test_event", { source: "test" });

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(0);
    });

    it("logs event when telemetry is enabled", () => {
      // Enable telemetry
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: true,
            captureActions: true,
            maxEvents: 100,
          },
        },
      });

      logTelemetryEvent("test_event", {
        source: "test_source",
        detail: "test_detail",
      });

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("test_event");
      expect(events[0].source).toBe("test_source");
      expect(events[0].detail).toBe("test_detail");
    });

    it("filters hotkey events when captureHotkeys is disabled", () => {
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: false,
            captureActions: true,
            maxEvents: 100,
          },
        },
      });

      logTelemetryEvent("hotkey_pressed", { source: "keyboard" });
      logTelemetryEvent("hotkey_activated", { source: "keyboard" });
      logTelemetryEvent("other_event", { source: "test" });

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("other_event");
    });

    it("filters action events when captureActions is disabled", () => {
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: true,
            captureActions: false,
            maxEvents: 100,
          },
        },
      });

      logTelemetryEvent("action_triggered", { source: "button" });
      logTelemetryEvent("action_completed", { source: "ui" });
      logTelemetryEvent("other_event", { source: "test" });

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("other_event");
    });

    it("respects maxEvents from config", () => {
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: true,
            captureActions: true,
            maxEvents: 5,
          },
        },
      });

      for (let i = 0; i < 10; i++) {
        logTelemetryEvent(`event_${i}`, { source: "test" });
      }

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(5);
      expect(events[0].type).toBe("event_5");
      expect(events[4].type).toBe("event_9");
    });

    it("includes meta data in logged event", () => {
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: true,
            captureActions: true,
            maxEvents: 100,
          },
        },
      });

      logTelemetryEvent("meta_event", {
        source: "test",
        meta: { key: "value", count: 42 },
      });

      const events = useEventLogStore.getState().events;
      expect(events[0].meta).toEqual({ key: "value", count: 42 });
    });

    it("handles missing options", () => {
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: true,
            captureActions: true,
            maxEvents: 100,
          },
        },
      });

      logTelemetryEvent("minimal_event");

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("minimal_event");
      expect(events[0].source).toBeUndefined();
      expect(events[0].detail).toBeUndefined();
    });

    it("handles undefined telemetry config (uses defaults)", () => {
      // Set config with undefined telemetry
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: undefined,
        },
      });

      // Should not throw, defaults should be used (disabled by default)
      logTelemetryEvent("test_event", { source: "test" });

      const events = useEventLogStore.getState().events;
      // Default telemetry is disabled
      expect(events).toHaveLength(0);
    });

    it("captures both hotkeys and actions when both enabled", () => {
      useConfigStore.setState({
        config: {
          ...useConfigStore.getState().config,
          telemetry: {
            enabled: true,
            captureHotkeys: true,
            captureActions: true,
            maxEvents: 100,
          },
        },
      });

      logTelemetryEvent("hotkey_test", { source: "keyboard" });
      logTelemetryEvent("action_test", { source: "button" });
      logTelemetryEvent("generic_test", { source: "other" });

      const events = useEventLogStore.getState().events;
      expect(events).toHaveLength(3);
    });
  });
});
