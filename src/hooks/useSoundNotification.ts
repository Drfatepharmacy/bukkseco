import { useCallback } from "react";

type SoundType = "order" | "delivery" | "transaction" | "chat" | "alert";

const FREQUENCIES: Record<SoundType, number[]> = {
  order: [523, 659, 784],
  delivery: [784, 659, 523, 784],
  transaction: [440, 554, 659],
  chat: [880, 1047],
  alert: [440, 440, 554, 659],
};

const DURATIONS: Record<SoundType, number> = {
  order: 150,
  delivery: 120,
  transaction: 200,
  chat: 80,
  alert: 100,
};

export const useSoundNotification = () => {
  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = new AudioContext();
      const freqs = FREQUENCIES[type];
      const dur = DURATIONS[type] / 1000;

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * dur);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * dur);
        osc.start(ctx.currentTime + i * dur);
        osc.stop(ctx.currentTime + (i + 1) * dur);
      });
    } catch {
      // Audio not supported
    }
  }, []);

  const speakNotification = useCallback((message: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }, []);

  return { playSound, speakNotification };
};
