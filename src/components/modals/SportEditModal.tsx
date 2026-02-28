import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { FormToggle } from "./FormToggle";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SportEditData {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isRequireHealthTest?: boolean;
}

interface SportEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  sport: SportEditData | null;
}

export function SportEditModal({ open, onOpenChange, onSuccess, sport }: SportEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    isRequireHealthTest: false,
  });

  useEffect(() => {
    if (!open || !sport) return;
    setErrors([]);
    setForm({
      name: sport.name ?? "",
      description: sport.description ?? "",
      category: sport.category ?? "",
      isRequireHealthTest: sport.isRequireHealthTest ?? false,
    });
  }, [open, sport]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sport) return;
    setErrors([]);
    setLoading(true);
    try {
      const result = await apiFetch(`/api/Sports/${sport.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          category: form.category,
          isRequireHealthTest: form.isRequireHealthTest,
        }),
      }) as { isSuccess: boolean; message?: string; statusCode: number };

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to update sport." });
      }

      toast({ title: "Sport updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to update sport."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Sport"
      description="Update sport details"
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
      submitLabel="Save Changes"
    >
      <FormInput id="name" label="Name" value={form.name} onChange={set("name")} required />
      <FormInput id="description" label="Description" value={form.description} onChange={set("description")} />
      <FormSelect
        id="category"
        label="Category"
        value={form.category}
        onChange={set("category")}
        required
        options={[
          { value: "Individual", label: "Individual" },
          { value: "Team", label: "Team" },
        ]}
      />
      <FormToggle
        id="isRequireHealthTest"
        label="Requires Health Test"
        checked={form.isRequireHealthTest}
        onChange={(v) => setForm((f) => ({ ...f, isRequireHealthTest: v }))}
        description="Enable if trainees need a health clearance"
      />
    </BaseModal>
  );
}
