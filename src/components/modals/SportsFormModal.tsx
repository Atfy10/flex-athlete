import { useState, useEffect } from "react";
import { z } from "zod";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { FormToggle } from "./FormToggle";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useFormDirty } from "@/hooks/useFormDirty";

// ─── Validation schema ────────────────────────────────────────────────────────
const sportSchema = z.object({
  name: z
    .string().trim()
    .min(2, "Sport name must be at least 2 characters")
    .max(80, "Sport name must be at most 80 characters"),
  description: z
    .string().trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  isRequireHealthTest: z.boolean(),
});

type SportFormValues = z.infer<typeof sportSchema>;
type FieldErrors = Partial<Record<keyof SportFormValues, string>>;

interface SportsFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SportsFormModal({ open, onOpenChange, onSuccess }: SportsFormModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    name: "", description: "", category: "", isRequireHealthTest: false,
  });

  useEffect(() => {
    if (!open) return;
    resetDirty();
    setApiErrors([]);
    setFieldErrors({});
    setForm({ name: "", description: "", category: "", isRequireHealthTest: false });
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors([]);
    setFieldErrors({});

    const parsed = sportSchema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof SportFormValues;
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/Sports/create", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category,
          isRequireHealthTest: form.isRequireHealthTest,
        }),
      });
      toast({ title: "Sport created successfully" });
      resetDirty();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to create sport."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open} onOpenChange={onOpenChange}
      title="Add Sport"
      description="Create a new sport discipline. Fields marked with * are required."
      onSubmit={handleSubmit} loading={loading} errors={apiErrors}
      isDirty={isDirty}
    >
      <FormInput
        id="name" label="Sport Name"
        value={form.name} onChange={set("name")}
        required maxLength={80} minLength={2}
        placeholder="e.g. Swimming"
        error={fieldErrors.name}
      />
      <FormInput
        id="description" label="Description"
        value={form.description} onChange={set("description")}
        maxLength={500}
        placeholder="Brief description of the sport (optional)"
        hint="Up to 500 characters"
        error={fieldErrors.description}
      />
      <FormSelect
        id="category" label="Category"
        value={form.category} onChange={(v) => { set("category")(v); }}
        required
        error={fieldErrors.category}
        options={[
          { value: "Individual", label: "Individual" },
          { value: "Team", label: "Team" },
        ]}
        placeholder="Select category"
      />
      <FormToggle
        id="isRequireHealthTest"
        label="Requires Health Test"
        checked={form.isRequireHealthTest}
        onChange={(v) => setForm((f) => ({ ...f, isRequireHealthTest: v }))}
        description="Enable if trainees need a health clearance before joining"
      />
    </BaseModal>
  );
}
