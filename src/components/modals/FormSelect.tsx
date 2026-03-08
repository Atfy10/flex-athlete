import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  /** Show a spinner inside the trigger while options are being fetched */
  loading?: boolean;
  /** Message shown when options array is empty and not loading */
  emptyMessage?: string;
  hint?: string;
}

export function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required = false,
  error,
  disabled = false,
  loading = false,
  emptyMessage = "No options available",
  hint,
}: FormSelectProps) {
  const isDisabled = disabled || loading;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn(isDisabled && "opacity-60")}>
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden>*</span>}
      </Label>

      <Select value={value} onValueChange={onChange} disabled={isDisabled}>
        <SelectTrigger
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(error && "border-destructive focus:ring-destructive")}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 && !loading ? (
            <div className="py-3 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive flex items-center gap-1">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
