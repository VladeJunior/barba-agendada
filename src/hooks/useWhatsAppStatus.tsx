import { useState, useEffect, useCallback } from "react";
import { useShop } from "./useShop";

type ConnectionStatus = "disconnected" | "connected" | "loading";

export function useWhatsAppStatus() {
  const { data: shop } = useShop();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("loading");
  const [isLoading, setIsLoading] = useState(true);

  const wapiInstanceId = (shop as any)?.wapi_instance_id;
  const wapiToken = (shop as any)?.wapi_token;
  const isWapiConfigured = !!(wapiInstanceId && wapiToken);

  const checkStatus = useCallback(async () => {
    if (!wapiInstanceId || !wapiToken) {
      setConnectionStatus("disconnected");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://barber-bot-production.up.railway.app/v1/instance/status-instance?instanceId=${wapiInstanceId}`,
        {
          headers: {
            Authorization: `Bearer ${wapiToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.connected ? "connected" : "disconnected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      setConnectionStatus("disconnected");
    } finally {
      setIsLoading(false);
    }
  }, [wapiInstanceId, wapiToken]);

  useEffect(() => {
    if (shop) {
      checkStatus();
    }
  }, [shop, checkStatus]);

  return {
    connectionStatus,
    isWapiConfigured,
    isLoading,
    refetch: checkStatus,
  };
}
