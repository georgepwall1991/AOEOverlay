import { useEffect, useRef } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useConfigStore } from '@/stores/configStore';
import { useSound } from './useSound';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_METRONOME_CONFIG } from '@/types';

export function useMetronome() {
  const { config } = useConfigStore();
  const metronomeConfig = config.metronome ?? DEFAULT_METRONOME_CONFIG;
  const { enabled, intervalSeconds: interval, volume } = metronomeConfig;
  const { recordTick, setPulsing } = useMetronomeStore();
  const { playSound } = useSound();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
      setTimeout(() => setPulsing(false), 1000); // Pulse for 1 second
    };

    // Initial clear to avoid double intervals
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(tick, interval * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, interval, volume, recordTick, setPulsing, playSound]);
}
