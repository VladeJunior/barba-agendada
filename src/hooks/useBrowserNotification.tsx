import { useEffect, useState, useCallback } from "react";

export function useBrowserNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Browser doesn't support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return;
      }

      if (Notification.permission === "granted") {
        // Check if page is not visible
        if (document.hidden) {
          try {
            const notification = new Notification(title, {
              icon: "/favicon.png",
              badge: "/favicon.png",
              ...options,
            });

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Focus window when notification is clicked
            notification.onclick = () => {
              window.focus();
              notification.close();
            };

            return notification;
          } catch (error) {
            console.error("Error showing notification:", error);
          }
        }
      } else if (Notification.permission === "default") {
        requestPermission();
      }
    },
    [requestPermission]
  );

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
}
