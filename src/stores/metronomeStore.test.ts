import { describe, it, expect, beforeEach } from 'vitest';
import { useMetronomeStore } from './metronomeStore';

describe('useMetronomeStore', () => {
  beforeEach(() => {
    useMetronomeStore.setState({
      lastTickTimestamp: 0,
      isPulsing: false,
    });
  });

  it('should have initial state', () => {
    const state = useMetronomeStore.getState();
    expect(state.lastTickTimestamp).toBe(0);
    expect(state.isPulsing).toBe(false);
  });

  it('should update lastTickTimestamp', () => {
    const now = Date.now();
    useMetronomeStore.getState().recordTick(now);
    expect(useMetronomeStore.getState().lastTickTimestamp).toBe(now);
  });

  it('should update isPulsing', () => {
    useMetronomeStore.getState().setPulsing(true);
    expect(useMetronomeStore.getState().isPulsing).toBe(true);
    useMetronomeStore.getState().setPulsing(false);
    expect(useMetronomeStore.getState().isPulsing).toBe(false);
  });
});