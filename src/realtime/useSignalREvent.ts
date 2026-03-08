import { useEffect, useRef } from "react";
import { connectionManager } from "./connectionManager";
import { RealtimeEventName } from "./realtimeEvents";

/**
 * Subscribe to a SignalR event for the lifetime of the component.
 * Automatically cleans up on unmount. The handler ref is kept stable so
 * callers can pass inline functions without causing re-subscriptions.
 */
export function useSignalREvent<T = unknown>(
  eventName: RealtimeEventName | string,
  handler: (payload: T) => void,
): void {
  // Keep a stable ref to the latest handler to avoid re-subscribing
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const stable = (payload: T) => handlerRef.current(payload);
    connectionManager.on<T>(eventName, stable);
    return () => {
      connectionManager.off<T>(eventName, stable);
    };
  }, [eventName]);
}

