import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface FormMultiSelectProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function FormMultiSelect({
  id,
  label,
  values,
  onChange,
  options,
  placeholder = "Select...",
  required = false,
  error,
}: FormMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const selectedLabels = options.filter((o) => values.includes(o.value));

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            className={`w-full justify-between font-normal h-auto min-h-10 ${
              error ? "border-destructive" : ""
            }`}
          >
            <div className="flex flex-wrap gap-1">
              {selectedLabels.length > 0 ? (
                selectedLabels.map((s) => (
                  <Badge key={s.value} variant="secondary" className="text-xs">
                    {s.label}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(s.value);
                      }}
                    />
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2 pointer-events-auto" align="start">
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={values.includes(opt.value)}
                  onCheckedChange={() => toggle(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
