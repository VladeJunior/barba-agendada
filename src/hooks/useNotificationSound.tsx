import { useRef, useCallback } from "react";

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create AudioContext on first use
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      
      // Create a simple notification sound (two tones)
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Configure oscillators for a pleasant notification sound
      oscillator1.frequency.value = 800; // First tone (higher)
      oscillator2.frequency.value = 600; // Second tone (lower)
      oscillator1.type = "sine";
      oscillator2.type = "sine";

      // Configure volume envelope (fade in/out)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      // Connect nodes
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play first tone
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.15);

      // Play second tone slightly after
      oscillator2.start(audioContext.currentTime + 0.1);
      oscillator2.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, []);

  return { playNotificationSound };
}
