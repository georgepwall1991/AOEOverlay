import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReminders } from './useReminders';

const {
  mockConfigStore,
  mockTimerStore,
  mockMatchupStore,
  mockBuildOrderStore
} = vi.hoisted(() => ({
  mockConfigStore: {
    getState: vi.fn().mockReturnValue({
      config: {
        reminders: {
          enabled: true,
          villagerQueue: { enabled: true, intervalSeconds: 25 },
          scout: { enabled: true, intervalSeconds: 45 },
          houses: { enabled: true, intervalSeconds: 40 },
          military: { enabled: true, intervalSeconds: 60 },
          mapControl: { enabled: true, intervalSeconds: 90 },
          macroCheck: { enabled: true, intervalSeconds: 20 },
          sacredSites: { enabled: true },
          matchupAlerts: { enabled: true },
        },
      },
    }),
  },
  mockTimerStore: {
    getState: vi.fn().mockReturnValue({
      isRunning: true,
      elapsedSeconds: 0,
    }),
  },
  mockMatchupStore: {
    getState: vi.fn().mockReturnValue({
      getOpponentFor: vi.fn().mockReturnValue('French'),
    }),
  },
  mockBuildOrderStore: {
    getState: vi.fn().mockReturnValue({
      buildOrders: [{ civilization: 'English' }],
      currentOrderIndex: 0,
    }),
  },
}));

vi.mock('@/stores', () => ({
  useConfigStore: mockConfigStore,
  useTimerStore: mockTimerStore,
  useIsTimerRunning: vi.fn().mockReturnValue(true),
  useMatchupStore: mockMatchupStore,
  useBuildOrderStore: mockBuildOrderStore,
  useCounterGridStore: vi.fn(),
  useEventLogStore: {
    getState: vi.fn().mockReturnValue({
      clear: vi.fn(),
      events: [],
    }),
  },
}));

import { useTimerStore, useMatchupStore } from '@/stores';
import { useTTS } from './useTTS';

// Mock useTTS
vi.mock('./useTTS', () => ({
  useTTS: vi.fn(),
}));

describe('useReminders', () => {
  const mockSpeakReminder = vi.fn();
  const mockIsSpeaking = vi.fn().mockReturnValue(false);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    (useTTS as any).mockReturnValue({
      speakReminder: mockSpeakReminder,
      isSpeaking: mockIsSpeaking,
    });
    
    (useMatchupStore.getState().getOpponentFor as any).mockReturnValue('French');
    (useTimerStore.getState as any).mockReturnValue({
      isRunning: true,
      elapsedSeconds: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers sacred site alerts at 4:30', async () => {
    (useTimerStore.getState as any).mockReturnValue({ elapsedSeconds: 270, isRunning: true });

    renderHook(() => useReminders());

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSpeakReminder).toHaveBeenCalledWith('Sacred sites spawn in 30 seconds');
  });

  it('triggers sacred site alerts at 5:00', async () => {
    (useTimerStore.getState as any).mockReturnValue({ elapsedSeconds: 300, isRunning: true });

    renderHook(() => useReminders());

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSpeakReminder).toHaveBeenCalledWith('Sacred sites are active!');
  });

  it('triggers proactive intel alerts from matchup', async () => {
    // English vs French has a danger timer at 4:20
    (useTimerStore.getState as any).mockReturnValue({ elapsedSeconds: 260, isRunning: true });

    renderHook(() => useReminders());

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSpeakReminder).toHaveBeenCalledWith('First longbows window');
  });

  it('triggers regular reminders based on interval', async () => {
    renderHook(() => useReminders());

    // Advance by 26 seconds (villagerQueue is 25s)
    await act(async () => {
      vi.advanceTimersByTime(26000);
    });

    expect(mockSpeakReminder).toHaveBeenCalledWith('Keep queuing villagers', 'reminderVillager');
  });
});
