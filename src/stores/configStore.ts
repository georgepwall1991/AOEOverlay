import { create } from "zustand";
import type { AppConfig, FontSize, Theme } from "@/types";
import { DEFAULT_CONFIG } from "@/types";

interface ConfigState {
  config: AppConfig;
  isLoading: boolean;

  // Actions
  setConfig: (config: AppConfig) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  setOpacity: (opacity: number) => void;
  setFontSize: (size: FontSize) => void;
  setTheme: (theme: Theme) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  isLoading: true,

  setConfig: (config) =>
    set({
      config,
      isLoading: false,
    }),

  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
    })),

  setOpacity: (opacity) =>
    set((state) => ({
      config: { ...state.config, overlay_opacity: opacity },
    })),

  setFontSize: (font_size) =>
    set((state) => ({
      config: { ...state.config, font_size },
    })),

  setTheme: (theme) =>
    set((state) => ({
      config: { ...state.config, theme },
    })),
}));

// Selectors
export const useOpacity = () =>
  useConfigStore((state) => state.config.overlay_opacity);

export const useFontSize = () =>
  useConfigStore((state) => state.config.font_size);

export const useTheme = () => useConfigStore((state) => state.config.theme);

export const useHotkeys = () =>
  useConfigStore((state) => state.config.hotkeys);
