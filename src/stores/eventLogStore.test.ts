import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventLogStore, useEventLogEvents } from "./eventLogStore";

describe("eventLogStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useEventLogStore());
    act(() => {
      result.current.clear();
    });
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts with empty events array", () => {
      const { result } = renderHook(() => useEventLogStore());
      expect(result.current.events).toEqual([]);
    });

    it("starts with total count of 0", () => {
      const { result } = renderHook(() => useEventLogStore());
      expect(result.current.total).toBe(0);
    });
  });

  describe("addEvent", () => {
    it("adds an event with generated id and timestamp", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({
          type: "test_event",
          source: "test",
          detail: "test detail",
        });
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].type).toBe("test_event");
      expect(result.current.events[0].source).toBe("test");
      expect(result.current.events[0].detail).toBe("test detail");
      expect(result.current.events[0].id).toMatch(/^te-[a-z0-9]+-[a-z0-9]+$/);
      expect(result.current.events[0].timestamp).toBeGreaterThan(0);
    });

    it("uses provided id when specified", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({
          id: "custom-id-123",
          type: "custom_event",
        });
      });

      expect(result.current.events[0].id).toBe("custom-id-123");
    });

    it("uses provided timestamp when specified", () => {
      const { result } = renderHook(() => useEventLogStore());
      const customTimestamp = 1234567890;

      act(() => {
        result.current.addEvent({
          type: "timed_event",
          timestamp: customTimestamp,
        });
      });

      expect(result.current.events[0].timestamp).toBe(customTimestamp);
    });

    it("increments total count with each event", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({ type: "event1" });
      });
      expect(result.current.total).toBe(1);

      act(() => {
        result.current.addEvent({ type: "event2" });
      });
      expect(result.current.total).toBe(2);

      act(() => {
        result.current.addEvent({ type: "event3" });
      });
      expect(result.current.total).toBe(3);
    });

    it("stores optional meta data", () => {
      const { result } = renderHook(() => useEventLogStore());
      const meta = { key1: "value1", key2: 42, nested: { a: 1 } };

      act(() => {
        result.current.addEvent({
          type: "meta_event",
          meta,
        });
      });

      expect(result.current.events[0].meta).toEqual(meta);
    });

    it("handles events without optional fields", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({
          type: "minimal_event",
        });
      });

      expect(result.current.events[0].type).toBe("minimal_event");
      expect(result.current.events[0].source).toBeUndefined();
      expect(result.current.events[0].detail).toBeUndefined();
      expect(result.current.events[0].meta).toBeUndefined();
    });
  });

  describe("event trimming (maxEvents)", () => {
    it("trims events when exceeding default maxEvents (200)", () => {
      const { result } = renderHook(() => useEventLogStore());

      // Add 201 events without specifying maxEvents (uses default 200)
      act(() => {
        for (let i = 0; i < 201; i++) {
          result.current.addEvent({
            id: `event-${i}`,
            type: `event_${i}`,
          });
        }
      });

      expect(result.current.events).toHaveLength(200);
      // First event should be event-1 (event-0 was trimmed)
      expect(result.current.events[0].id).toBe("event-1");
      expect(result.current.events[199].id).toBe("event-200");
      expect(result.current.total).toBe(201);
    });

    it("uses custom maxEvents when specified", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addEvent({
            id: `event-${i}`,
            type: `event_${i}`,
            maxEvents: 10,
          });
        }
      });

      expect(result.current.events).toHaveLength(10);
      expect(result.current.events[0].id).toBe("event-5");
      expect(result.current.events[9].id).toBe("event-14");
      expect(result.current.total).toBe(15);
    });

    it("does not trim when under maxEvents", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addEvent({
            id: `event-${i}`,
            type: `event_${i}`,
            maxEvents: 10,
          });
        }
      });

      expect(result.current.events).toHaveLength(5);
      expect(result.current.events[0].id).toBe("event-0");
    });

    it("handles maxEvents of 1", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({ id: "first", type: "first", maxEvents: 1 });
        result.current.addEvent({ id: "second", type: "second", maxEvents: 1 });
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe("second");
      expect(result.current.total).toBe(2);
    });
  });

  describe("clear", () => {
    it("clears all events", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({ type: "event1" });
        result.current.addEvent({ type: "event2" });
        result.current.addEvent({ type: "event3" });
      });

      expect(result.current.events).toHaveLength(3);

      act(() => {
        result.current.clear();
      });

      expect(result.current.events).toEqual([]);
    });

    it("resets total count to 0", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({ type: "event1" });
        result.current.addEvent({ type: "event2" });
      });

      expect(result.current.total).toBe(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.total).toBe(0);
    });

    it("allows adding events after clear", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({ type: "before_clear" });
        result.current.clear();
        result.current.addEvent({ type: "after_clear" });
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].type).toBe("after_clear");
      expect(result.current.total).toBe(1);
    });
  });

  describe("useEventLogEvents selector", () => {
    it("returns events from store", () => {
      const { result: storeResult } = renderHook(() => useEventLogStore());
      const { result: selectorResult } = renderHook(() => useEventLogEvents());

      act(() => {
        storeResult.current.addEvent({ type: "test_event" });
      });

      expect(selectorResult.current).toHaveLength(1);
      expect(selectorResult.current[0].type).toBe("test_event");
    });

    it("updates when events change", () => {
      const { result: storeResult } = renderHook(() => useEventLogStore());
      const { result: selectorResult } = renderHook(() => useEventLogEvents());

      expect(selectorResult.current).toHaveLength(0);

      act(() => {
        storeResult.current.addEvent({ type: "event1" });
      });
      expect(selectorResult.current).toHaveLength(1);

      act(() => {
        storeResult.current.addEvent({ type: "event2" });
      });
      expect(selectorResult.current).toHaveLength(2);

      act(() => {
        storeResult.current.clear();
      });
      expect(selectorResult.current).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty string values", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({
          type: "",
          source: "",
          detail: "",
        });
      });

      expect(result.current.events[0].type).toBe("");
      expect(result.current.events[0].source).toBe("");
      expect(result.current.events[0].detail).toBe("");
    });

    it("handles special characters in event data", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        result.current.addEvent({
          type: "type_with_émojis_🎮",
          source: "<script>alert('xss')</script>",
          detail: "line1\nline2\ttab",
        });
      });

      expect(result.current.events[0].type).toBe("type_with_émojis_🎮");
      expect(result.current.events[0].source).toBe(
        "<script>alert('xss')</script>"
      );
      expect(result.current.events[0].detail).toBe("line1\nline2\ttab");
    });

    it("handles very long strings", () => {
      const { result } = renderHook(() => useEventLogStore());
      const longString = "a".repeat(10000);

      act(() => {
        result.current.addEvent({
          type: longString,
          detail: longString,
        });
      });

      expect(result.current.events[0].type).toHaveLength(10000);
      expect(result.current.events[0].detail).toHaveLength(10000);
    });

    it("handles concurrent additions correctly", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        // Simulate rapid concurrent additions
        for (let i = 0; i < 100; i++) {
          result.current.addEvent({ type: `rapid_${i}` });
        }
      });

      expect(result.current.events).toHaveLength(100);
      expect(result.current.total).toBe(100);
    });

    it("generates unique IDs for concurrent events", () => {
      const { result } = renderHook(() => useEventLogStore());

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addEvent({ type: "concurrent" });
        }
      });

      const ids = result.current.events.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });
  });
});
