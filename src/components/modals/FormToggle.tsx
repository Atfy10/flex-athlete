import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FormToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function FormToggle({
  id,
  label,
  checked,
  onChange,
  description,
}: FormToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
