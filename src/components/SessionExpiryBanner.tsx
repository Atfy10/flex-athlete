import { useEffect, useState, useRef } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Shows a dismissible warning banner when the JWT is within WARN_BEFORE_MS of expiry.
 * The user can either dismiss it (banner won't re-appear until next load) or
 * trigger a full re-login to extend their session.
 *
 * Because there is no refresh-token endpoint yet, "Extend Session" routes
 * the user back to /login. Once a silent-refresh endpoint exists this
 * component can be updated to call it instead.
 */

const WARN_BEFORE_MS = 5 * 60 * 1000; // 5 minutes

export function SessionExpiryBanner() {
  const { expiresAt, devUser, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const dismissedRef = useRef(false);

  useEffect(() => {
    // Dev sessions never expire
    if (devUser || !expiresAt) return;

    const tick = () => {
      if (dismissedRef.current) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setVisible(false);
        return;
      }
      if (remaining <= WARN_BEFORE_MS) {
        setSecondsLeft(Math.ceil(remaining / 1000));
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    tick();
    const id = setInterval(tick, 10_000); // re-check every 10 s
    return () => clearInterval(id);
  }, [expiresAt, devUser]);

  const handleDismiss = () => {
    dismissedRef.current = true;
    setVisible(false);
  };

  const handleReLogin = () => {
    logout();
    // AuthContext logout clears state; ProtectedRoute will redirect to /login
  };

  if (!visible) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const label =
    mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 rounded-xl border border-warning/40 bg-warning/10 backdrop-blur-sm
                 px-4 py-3 shadow-lg text-sm text-foreground max-w-md w-[calc(100%-2rem)]"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      <span className="flex-1">
        Your session expires in{" "}
        <span className="font-semibold tabular-nums text-warning">{label}</span>.
        Re-login to continue.
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-warning hover:bg-warning/20 shrink-0"
        onClick={handleReLogin}
      >
        <RefreshCw className="h-3.5 w-3.5 mr-1" />
        Re-login
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted shrink-0"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
