import { useEffect, useState } from "react";
import { connectionManager, ConnectionStatus } from "./connectionManager";

/**
 * Returns the current SignalR connection status.
 * Subscribes to status changes and re-renders when they occur.
 */
export function useSignalRConnection(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    connectionManager.currentStatus,
  );

  useEffect(() => {
    const unsub = connectionManager.onStatusChange(setStatus);
    // Sync once in case status changed before mount
    setStatus(connectionManager.currentStatus);
    return unsub;
  }, []);

  return status;
}
