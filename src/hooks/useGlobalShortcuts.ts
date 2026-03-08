import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Returns true when the event target is a focusable input element. */
function isInputTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
  if (["input", "textarea", "select"].includes(tag)) return true;
  if ((e.target as HTMLElement)?.isContentEditable) return true;
  return false;
}

/**
 * Registers global keyboard shortcuts for the application.
 *
 * Shortcuts:
 *   Alt + D          → navigate to /  (Dashboard)
 *   Ctrl + Shift + D → navigate to /  (alternate for keyboards where Alt+D conflicts)
 *
 * Both shortcuts are silently ignored when the user is focused in a form field.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputTarget(e)) return;

      // Alt + D
      const isAltD = e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "d";
      // Ctrl + Shift + D (alternate)
      const isCtrlShiftD = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d";

      if (isAltD || isCtrlShiftD) {
        e.preventDefault();
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
