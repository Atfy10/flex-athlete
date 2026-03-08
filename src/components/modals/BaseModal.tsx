import { useRef } from "react";
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
}: BaseModalProps) {
  const formRef = useRef<HTMLFormElement>(null);

  /** Auto-focus the first interactive field when the dialog finishes opening */
  const handleAnimationEnd = () => {
    if (!open) return;
    const first = formRef.current?.querySelector<HTMLElement>(
      "input:not([type='hidden']):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])"
    );
    first?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Escape key is handled natively by Radix Dialog */}
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-modal="true"
        onAnimationEnd={handleAnimationEnd}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="space-y-4"
          noValidate
        >
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

