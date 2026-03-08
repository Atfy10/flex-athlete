import { useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "./ConfirmDialog";

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
  errors?: string[];
  /**
   * When true, closing the modal via Escape, the × button, or
   * backdrop click will prompt the user to confirm discarding changes.
   */
  isDirty?: boolean;
}

export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  loading = false,
  submitLabel = "Save",
  errors = [],
  isDirty = false,
}: BaseModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  /**
   * Central close gate — intercepts every close trigger.
   * If the form is dirty we ask for confirmation first.
   *
   * Radix Dialog natively handles:
   *  - Focus trap (Tab/Shift+Tab cycle only within the dialog)
   *  - Escape key → fires onOpenChange(false)
   *  - Return focus to the trigger element on close
   *  - Initial focus on the first focusable element inside the content
   */
  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onOpenChange(false);
    }
  }, [isDirty, onOpenChange]);

  /** Radix fires onOpenChange(false) for Escape + backdrop click */
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      requestClose();
    } else {
      onOpenChange(true);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/*
         * DialogContent uses Radix FocusScope internally:
         *  - `trapped` keeps Tab/Shift+Tab inside the dialog
         *  - `loop` wraps focus from last → first focusable element
         *  - No aria-modal override needed; Radix sets it automatically
         */}
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          // Let Radix auto-focus the first focusable descendant on open.
          // Do NOT set onAnimationEnd focus manually — it races with
          // Radix's own FocusScope and can steal focus mid-animation.
          onOpenAutoFocus={(e) => {
            // Prefer the first real input/select/textarea inside the form.
            const first = formRef.current?.querySelector<HTMLElement>(
              "input:not([type='hidden']):not([disabled]):not([readonly])," +
              "select:not([disabled])," +
              "textarea:not([disabled]):not([readonly])"
            );
            if (first) {
              e.preventDefault(); // cancel Radix default
              first.focus();
            }
            // If no input found, Radix will fall back to focusing the
            // dialog container itself, keeping focus inside.
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
            {errors.length > 0 && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1">
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {children}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={requestClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} aria-busy={loading}>
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discard-changes confirmation — rendered outside the main Dialog
          so it can open while the parent Dialog stays mounted */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Are you sure you want to close this form? Your changes will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}
