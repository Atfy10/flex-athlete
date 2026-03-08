import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { buildHubConnection } from "./signalrClient";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

type StatusListener = (status: ConnectionStatus) => void;

class ConnectionManager {
  private connection: HubConnection | null = null;
  private statusListeners = new Set<StatusListener>();
  private tokenFactory: (() => string | null) | null = null;
  private started = false;

  // ── Status broadcasting ──────────────────────────────────────────────────
  private emit(status: ConnectionStatus) {
    this.statusListeners.forEach((l) => l(status));
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  get currentStatus(): ConnectionStatus {
    if (!this.connection) return "disconnected";
    switch (this.connection.state) {
      case HubConnectionState.Connected:
        return "connected";
      case HubConnectionState.Connecting:
        return "connecting";
      case HubConnectionState.Reconnecting:
        return "reconnecting";
      default:
        return "disconnected";
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** Call once after authentication is confirmed. */
  async start(tokenFactory: () => string | null): Promise<void> {
    if (this.started) return;

    // If the token factory returns nothing (dev-login scenario) we skip connecting —
    // the hub requires a real JWT bearer token.
    if (!tokenFactory()) {
      if (import.meta.env.DEV) {
        console.info("[SignalR] Skipping connection — no JWT token available (dev-login).");
      }
      return;
    }

    this.tokenFactory = tokenFactory;
    this.started = true;

    this.connection = buildHubConnection(tokenFactory);

    this.connection.onreconnecting(() => this.emit("reconnecting"));
    this.connection.onreconnected(() => this.emit("connected"));
    this.connection.onclose(() => {
      this.emit("disconnected");
      this.started = false;
    });

    this.emit("connecting");

    try {
      await this.connection.start();
      this.emit("connected");
      if (import.meta.env.DEV) {
        console.info("[SignalR] Connected to hub.");
      }
    } catch (err) {
      this.emit("disconnected");
      this.started = false;
      if (import.meta.env.DEV) {
        console.warn("[SignalR] Connection failed:", err);
      }
    }
  }

  /** Call on logout. Cleans up the connection. */
  async stop(): Promise<void> {
    if (!this.connection) return;
    this.started = false;
    try {
      await this.connection.stop();
    } catch {
      // Silently ignore stop errors
    } finally {
      this.connection = null;
      this.emit("disconnected");
    }
  }

  // ── Event subscription ───────────────────────────────────────────────────

  on<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.connection?.on(eventName, handler);
  }

  off<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.connection?.off(eventName, handler);
  }
}

/** Singleton instance shared across the app. */
export const connectionManager = new ConnectionManager();
