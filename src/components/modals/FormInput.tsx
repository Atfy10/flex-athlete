import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormInputProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  /** Render as a <textarea> instead of <input> */
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  step?: string;
  disabled?: boolean;
  readOnly?: boolean;
  hint?: string;
}

export function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  rows = 3,
  placeholder,
  required = false,
  error,
  min,
  max,
  maxLength,
  minLength,
  step,
  disabled = false,
  readOnly = false,
  hint,
}: FormInputProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const sharedClass = cn(
    error && "border-destructive focus-visible:ring-destructive",
    readOnly && "bg-muted/50 cursor-default",
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn(disabled && "opacity-60")}>
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden>*</span>}
      </Label>

      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={sharedClass}
          /* Enter inside textarea = newline, NOT form submit */
          onKeyDown={(e) => {
            if (e.key === "Enter") e.stopPropagation();
          }}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          maxLength={maxLength}
          minLength={minLength}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={sharedClass}
        />
      )}

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

