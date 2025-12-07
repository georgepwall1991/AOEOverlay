import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useConfigStore,
  useOpacity,
  useFontSize,
  useTheme,
  useHotkeys,
} from "./configStore";
import { DEFAULT_CONFIG } from "@/types";
import type { AppConfig } from "@/types";

describe("configStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useConfigStore());
    act(() => {
      result.current.setConfig(DEFAULT_CONFIG);
    });
  });

  describe("initial state", () => {
    it("starts with default config", () => {
      const { result } = renderHook(() => useConfigStore());

      expect(result.current.config).toEqual(DEFAULT_CONFIG);
    });

    it("has default opacity", () => {
      const { result } = renderHook(() => useConfigStore());

      expect(result.current.config.overlay_opacity).toBe(0.95);
    });

    it("has default font size", () => {
      const { result } = renderHook(() => useConfigStore());

      expect(result.current.config.font_size).toBe("medium");
    });

    it("has default theme", () => {
      const { result } = renderHook(() => useConfigStore());

      expect(result.current.config.theme).toBe("dark");
    });

    it("has default hotkeys", () => {
      const { result } = renderHook(() => useConfigStore());

      expect(result.current.config.hotkeys.toggle_overlay).toBe("F1");
      expect(result.current.config.hotkeys.next_step).toBe("F3");
      expect(result.current.config.hotkeys.previous_step).toBe("F2");
    });
  });

  describe("setConfig", () => {
    it("sets entire config and marks loading false", () => {
      const { result } = renderHook(() => useConfigStore());

      const newConfig: AppConfig = {
        ...DEFAULT_CONFIG,
        overlay_opacity: 0.5,
        font_size: "large",
        theme: "light",
      };

      act(() => {
        result.current.setConfig(newConfig);
      });

      expect(result.current.config.overlay_opacity).toBe(0.5);
      expect(result.current.config.font_size).toBe("large");
      expect(result.current.config.theme).toBe("light");
      expect(result.current.isLoading).toBe(false);
    });

    it("replaces entire config object", () => {
      const { result } = renderHook(() => useConfigStore());

      const customConfig: AppConfig = {
        ...DEFAULT_CONFIG,
        hotkeys: {
          ...DEFAULT_CONFIG.hotkeys,
          toggle_overlay: "Escape",
        },
      };

      act(() => {
        result.current.setConfig(customConfig);
      });

      expect(result.current.config.hotkeys.toggle_overlay).toBe("Escape");
    });
  });

  describe("updateConfig", () => {
    it("partially updates config", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.updateConfig({ overlay_opacity: 0.75 });
      });

      expect(result.current.config.overlay_opacity).toBe(0.75);
      // Other fields should remain unchanged
      expect(result.current.config.font_size).toBe("medium");
      expect(result.current.config.theme).toBe("dark");
    });

    it("updates multiple fields at once", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.updateConfig({
          overlay_opacity: 0.8,
          compact_mode: true,
          click_through: false,
        });
      });

      expect(result.current.config.overlay_opacity).toBe(0.8);
      expect(result.current.config.compact_mode).toBe(true);
      expect(result.current.config.click_through).toBe(false);
    });

    it("updates nested config properties", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.updateConfig({
          hotkeys: {
            ...DEFAULT_CONFIG.hotkeys,
            toggle_overlay: "Home",
          },
        });
      });

      expect(result.current.config.hotkeys.toggle_overlay).toBe("Home");
    });
  });

  describe("setOpacity", () => {
    it("sets overlay opacity", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setOpacity(0.6);
      });

      expect(result.current.config.overlay_opacity).toBe(0.6);
    });

    it("handles edge values", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setOpacity(0);
      });

      expect(result.current.config.overlay_opacity).toBe(0);

      act(() => {
        result.current.setOpacity(1);
      });

      expect(result.current.config.overlay_opacity).toBe(1);
    });

    it("preserves other config values", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setOpacity(0.5);
      });

      expect(result.current.config.font_size).toBe("medium");
      expect(result.current.config.theme).toBe("dark");
    });
  });

  describe("setFontSize", () => {
    it("sets font size to small", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setFontSize("small");
      });

      expect(result.current.config.font_size).toBe("small");
    });

    it("sets font size to large", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setFontSize("large");
      });

      expect(result.current.config.font_size).toBe("large");
    });

    it("preserves other config values", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setFontSize("large");
      });

      expect(result.current.config.overlay_opacity).toBe(0.95);
      expect(result.current.config.theme).toBe("dark");
    });
  });

  describe("setTheme", () => {
    it("sets theme to light", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.config.theme).toBe("light");
    });

    it("sets theme to system", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setTheme("system");
      });

      expect(result.current.config.theme).toBe("system");
    });

    it("preserves other config values", () => {
      const { result } = renderHook(() => useConfigStore());

      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.config.overlay_opacity).toBe(0.95);
      expect(result.current.config.font_size).toBe("medium");
    });
  });
});

describe("configStore selectors", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useConfigStore());
    act(() => {
      result.current.setConfig(DEFAULT_CONFIG);
    });
  });

  describe("useOpacity", () => {
    it("returns current opacity", () => {
      const { result: selectorResult } = renderHook(() => useOpacity());

      expect(selectorResult.current).toBe(0.95);
    });

    it("updates when opacity changes", () => {
      const { result: storeResult } = renderHook(() => useConfigStore());
      const { result: selectorResult } = renderHook(() => useOpacity());

      act(() => {
        storeResult.current.setOpacity(0.7);
      });

      expect(selectorResult.current).toBe(0.7);
    });
  });

  describe("useFontSize", () => {
    it("returns current font size", () => {
      const { result: selectorResult } = renderHook(() => useFontSize());

      expect(selectorResult.current).toBe("medium");
    });

    it("updates when font size changes", () => {
      const { result: storeResult } = renderHook(() => useConfigStore());
      const { result: selectorResult } = renderHook(() => useFontSize());

      act(() => {
        storeResult.current.setFontSize("small");
      });

      expect(selectorResult.current).toBe("small");
    });
  });

  describe("useTheme", () => {
    it("returns current theme", () => {
      const { result: selectorResult } = renderHook(() => useTheme());

      expect(selectorResult.current).toBe("dark");
    });

    it("updates when theme changes", () => {
      const { result: storeResult } = renderHook(() => useConfigStore());
      const { result: selectorResult } = renderHook(() => useTheme());

      act(() => {
        storeResult.current.setTheme("light");
      });

      expect(selectorResult.current).toBe("light");
    });
  });

  describe("useHotkeys", () => {
    it("returns current hotkeys", () => {
      const { result: selectorResult } = renderHook(() => useHotkeys());

      expect(selectorResult.current.toggle_overlay).toBe("F1");
      expect(selectorResult.current.next_step).toBe("F3");
      expect(selectorResult.current.previous_step).toBe("F2");
    });

    it("updates when hotkeys change", () => {
      const { result: storeResult } = renderHook(() => useConfigStore());
      const { result: selectorResult } = renderHook(() => useHotkeys());

      act(() => {
        storeResult.current.updateConfig({
          hotkeys: {
            ...DEFAULT_CONFIG.hotkeys,
            toggle_overlay: "Escape",
          },
        });
      });

      expect(selectorResult.current.toggle_overlay).toBe("Escape");
    });
  });
});
