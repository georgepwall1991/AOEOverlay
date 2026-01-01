import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetronome } from './useMetronome';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useConfigStore } from '@/stores/configStore';
import { DEFAULT_CONFIG } from '@/types';

// Mock useTTS
const mockSpeakReminder = vi.fn().mockResolvedValue(undefined);
vi.mock('./useTTS', () => ({
  useTTS: () => ({
    speakReminder: mockSpeakReminder,
  }),
}));

// Mock useSound
vi.mock('./useSound', () => ({
  useSound: () => ({
    playSound: vi.fn().mockResolvedValue(false),
  }),
}));

describe('useMetronome', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMetronomeStore.setState({
      lastTickTimestamp: 0,
      isPulsing: false,
      currentTaskIndex: 0,
    });
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        metronome: {
          enabled: false,
          intervalSeconds: 1,
          volume: 0.5,
          coachLoop: true,
        }
      }
    });
    mockSpeakReminder.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not tick when disabled', () => {
    renderHook(() => useMetronome());
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(mockSpeakReminder).not.toHaveReturned();
  });

  it('should tick and speak macro task when enabled', async () => {
    act(() => {
      useConfigStore.setState({
        config: {
          ...DEFAULT_CONFIG,
          metronome: {
            enabled: true,
            intervalSeconds: 1,
            volume: 0.5,
            coachLoop: true,
          }
        }
      });
    });
    
    renderHook(() => useMetronome());
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    
    expect(mockSpeakReminder).toHaveBeenCalledWith('Check town center');
  });

  it('should update lastTickTimestamp after tick', async () => {
    act(() => {
      useConfigStore.setState({
        config: {
          ...DEFAULT_CONFIG,
          metronome: {
            enabled: true,
            intervalSeconds: 1,
            volume: 0.5,
            coachLoop: true,
          }
        }
      });
    });
    
    renderHook(() => useMetronome());
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    
    expect(useMetronomeStore.getState().lastTickTimestamp).toBeGreaterThan(0);
  });
});
