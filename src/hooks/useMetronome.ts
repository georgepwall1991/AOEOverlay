import { useEffect, useRef } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useConfigStore } from '@/stores/configStore';
import { useSound } from './useSound';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_METRONOME_CONFIG } from '@/types';

// Duration to show pulse effect after tick (ms)
const PULSE_DURATION_MS = 1000;

export function useMetronome() {
  const { config } = useConfigStore();
  const metronomeConfig = config.metronome ?? DEFAULT_METRONOME_CONFIG;
  const { enabled, intervalSeconds: interval } = metronomeConfig;
  const { recordTick, setPulsing } = useMetronomeStore();
  const { playSound } = useSound();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
      return;
    }

    const tick = async () => {
      // Trigger Audio
      try {
        const played = await playSound('metronomeTick');
        if (!played) {
          await invoke('speak', { text: 'Tick', rate: 1.0 });
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
    };

    // Initial clear to avoid double intervals
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(tick, interval * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, [enabled, interval, recordTick, setPulsing, playSound]);
}
