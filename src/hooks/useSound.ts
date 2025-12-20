import { useCallback } from 'react';
import { useConfigStore } from '@/stores';
import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_COACH_PACK_CONFIG } from '@/types';

export type SoundEvent = 
  | 'stepAdvance'
  | 'reminderVillager'
  | 'reminderScout'
  | 'reminderHouse'
  | 'behindPace'
  | 'ageUp'
  | 'metronomeTick';

export function useSound() {
  const { config } = useConfigStore();
  const coachPack = config.coach_pack ?? DEFAULT_COACH_PACK_CONFIG;

  const playSound = useCallback(async (event: SoundEvent) => {
    if (!coachPack.enabled) return false;

    const fileName = coachPack.files[event];
    if (!fileName) return false;

    const fullPath = `${coachPack.basePath}/${fileName}`;
    try {
      await invoke('play_sound', { path: fullPath });
      return true;
    } catch (error) {
      console.error(`Failed to play sound for event ${event}:`, error);
      return false;
    }
  }, [coachPack]);

  return { playSound };
}
