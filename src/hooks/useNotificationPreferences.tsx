import { useState, useEffect } from "react";

interface NotificationPreferences {
  soundEnabled: boolean;
  browserEnabled: boolean;
}

const STORAGE_KEY = "notification-preferences";

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { soundEnabled: true, browserEnabled: true };
      }
    }
    return { soundEnabled: true, browserEnabled: true };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const toggleSound = () => {
    setPreferences((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleBrowser = () => {
    setPreferences((prev) => ({ ...prev, browserEnabled: !prev.browserEnabled }));
  };

  return {
    preferences,
    toggleSound,
    toggleBrowser,
  };
}
