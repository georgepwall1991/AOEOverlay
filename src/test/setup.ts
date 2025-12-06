import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import "./mocks/tauri";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Set mock environment variable
vi.stubEnv("VITE_MOCK_TAURI", "true");

// Mock window.speechSynthesis for TTS tests
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  paused: false,
  pending: false,
  onvoiceschanged: null,
};

Object.defineProperty(window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
});

// Mock SpeechSynthesisUtterance
global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  lang: "",
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
})) as unknown as typeof SpeechSynthesisUtterance;
