import { useCallback, useEffect, useRef } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useConfigStore } from '@/stores/configStore';
import { useSound } from './useSound';
import { useInterval } from './useInterval';
import { useTTS } from './useTTS';
import { DEFAULT_METRONOME_CONFIG } from '@/types';

// Duration to show pulse effect after tick (ms)
const PULSE_DURATION_MS = 1000;

const MACRO_TASKS = [
  "Check town center",
  "Glance at minimap",
  "Spend your resources",
  "Check idle villagers",
];

export function useMetronome() {
  const { config } = useConfigStore();
  const metronomeConfig = config.metronome ?? DEFAULT_METRONOME_CONFIG;
  const { enabled, intervalSeconds: interval, coachLoop } = metronomeConfig;
  const { recordTick, setPulsing, nextTask, currentTaskIndex } = useMetronomeStore();
  const { playSound } = useSound();
  const { speakReminder } = useTTS();
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(async () => {
    // Trigger Audio
    try {
      const played = await playSound('metronomeTick');
      
      if (coachLoop) {
        const task = MACRO_TASKS[currentTaskIndex];
        // Speak task using TTS hook
        await speakReminder(task);
        nextTask();
      } else if (!played) {
        // Fallback tick sound via TTS if needed, though usually metronomeTick sound exists
        // await speakReminder('Tick');
      }
    } catch (error) {
      console.error('Failed to play metronome tick:', error);
    }

    // Trigger Visual
    recordTick(Date.now());
    setPulsing(true);

    // Clear any pending pulse timeout before setting a new one
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = setTimeout(() => setPulsing(false), PULSE_DURATION_MS);
  }, [playSound, recordTick, setPulsing, coachLoop, currentTaskIndex, nextTask]);

  // Use interval hook (null delay pauses the interval)
  useInterval(tick, enabled ? interval * 1000 : null);

  // Cleanup pulse timeout when disabled
  useEffect(() => {
    if (!enabled && pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
  }, [enabled]);
}
