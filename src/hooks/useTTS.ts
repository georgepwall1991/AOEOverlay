import { useCallback, useRef } from "react";
import { useConfigStore } from "@/stores";
import { speak as tauriSpeak, stopSpeaking as tauriStop } from "@/lib/tauri";
import { DEFAULT_VOICE_CONFIG } from "@/types";
import { useSound, type SoundEvent } from "./useSound";
import { useBoundedQueue } from "./useBoundedQueue";

// Maximum queue size to prevent memory leaks if TTS fails repeatedly
const MAX_QUEUE_SIZE = 10;

// Only speak delta warnings when significantly behind pace
const SPEAK_DELTA_THRESHOLD_SECONDS = 30;

export function useTTS() {
  const isSpeakingRef = useRef(false);
  const queue = useBoundedQueue<string>(MAX_QUEUE_SIZE);
  const { playSound } = useSound();

  const getVoiceConfig = useCallback(() => {
    const config = useConfigStore.getState().config;
    return config.voice ?? DEFAULT_VOICE_CONFIG;
  }, []);

  const speak = useCallback(
    async (text: string, soundEvent?: SoundEvent) => {
      // 1. Try playing sound from Coach Pack if event provided
      if (soundEvent) {
        const played = await playSound(soundEvent);
        if (played) return; // Sound played successfully, skip TTS
      }

      const voiceConfig = getVoiceConfig();

      if (!voiceConfig.enabled) {
        return;
      }

      // Add to queue if currently speaking (bounded queue prevents memory leaks)
      if (isSpeakingRef.current) {
        if (queue.isFull()) {
          console.warn("TTS queue full, dropping oldest message");
        }
        queue.push(text);
        return;
      }

      isSpeakingRef.current = true;

      try {
        await tauriSpeak(text, voiceConfig.rate);
      } catch (error) {
        console.error("TTS speak failed:", error);
      } finally {
        isSpeakingRef.current = false;

        // Process queue - use setTimeout to prevent deep recursion stack
        if (!queue.isEmpty()) {
          const next = queue.shift();
          if (next) {
            // Schedule next speak on next tick to avoid stack overflow
            setTimeout(() => {
              speak(next).catch((error) => {
                console.error("TTS queue processing failed:", error);
              });
            }, 0);
          }
        }
      }
    },
    [getVoiceConfig, playSound, queue]
  );

  const speakStep = useCallback(
    async (description: string) => {
      const voiceConfig = getVoiceConfig();
      if (!voiceConfig.speakSteps) return;
      await speak(description, 'stepAdvance');
    },
    [speak, getVoiceConfig]
  );

  const speakReminder = useCallback(
    async (message: string, event?: SoundEvent) => {
      const voiceConfig = getVoiceConfig();
      if (!voiceConfig.speakReminders) return;
      await speak(message, event);
    },
    [speak, getVoiceConfig]
  );

  const speakDelta = useCallback(
    async (deltaSeconds: number) => {
      const voiceConfig = getVoiceConfig();
      if (!voiceConfig.speakDelta) return;
      if (deltaSeconds <= SPEAK_DELTA_THRESHOLD_SECONDS) return;

      const message = `You're ${deltaSeconds} seconds behind pace`;
      await speak(message, 'behindPace');
    },
    [speak, getVoiceConfig]
  );

  const stopSpeaking = useCallback(async () => {
    queue.clear();
    isSpeakingRef.current = false;
    try {
      await tauriStop();
    } catch (error) {
      console.error("TTS stop failed:", error);
    }
  }, [queue]);

  const isSpeaking = useCallback(() => isSpeakingRef.current, []);

  return {
    speak,
    speakStep,
    speakReminder,
    speakDelta,
    stopSpeaking,
    isSpeaking,
  };
}