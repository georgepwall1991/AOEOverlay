import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetronome } from './useMetronome';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useConfigStore } from '@/stores/configStore';
import { DEFAULT_CONFIG } from '@/types';

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

describe('useMetronome', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMetronomeStore.setState({
      lastTickTimestamp: 0,
      isPulsing: false,
    });
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        metronome: {
          enabled: false,
          intervalSeconds: 1,
          volume: 0.5,
        }
      }
    });
    mockInvoke.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not tick when disabled', () => {
    renderHook(() => useMetronome());
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(mockInvoke).not.toHaveBeenCalledWith('speak', expect.anything());
  });

  it('should tick when enabled', async () => {
    act(() => {
      useConfigStore.setState({
        config: {
          ...DEFAULT_CONFIG,
          metronome: {
            enabled: true,
            intervalSeconds: 1,
            volume: 0.5,
          }
        }
      });
    });
    
    renderHook(() => useMetronome());
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    
    expect(mockInvoke).toHaveBeenCalledWith('speak', expect.objectContaining({
      text: 'Tick'
    }));
  });

  it('should update lastTickTimestamp after tick', async () => {
    const now = 10000;
    vi.setSystemTime(now);
    
    act(() => {
      useConfigStore.setState({
        config: {
          ...DEFAULT_CONFIG,
          metronome: {
            enabled: true,
            intervalSeconds: 1,
            volume: 0.5,
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