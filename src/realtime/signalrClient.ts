import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const HUB_PATH = "/hubs/notification";
const IS_DEV = import.meta.env.DEV;

/** Factory function — callers must supply a token getter so that each
 *  reconnect attempt picks up the freshest JWT. */
export function buildHubConnection(
  accessTokenFactory: () => string | null,
): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}${HUB_PATH}`, {
      accessTokenFactory: () => accessTokenFactory() ?? "",
      withCredentials: false,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential back-off capped at 30 s
        const delays = [0, 2_000, 5_000, 10_000, 30_000];
        return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
      },
    })
    .configureLogging(IS_DEV ? LogLevel.Information : LogLevel.Error)
    .build();
}

export { HubConnectionState };
