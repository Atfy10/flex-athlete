import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { FormToggle } from "./FormToggle";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SportsFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SportsFormModal({ open, onOpenChange, onSuccess }: SportsFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", description: "", category: "", isRequireHealthTest: false,
  });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ name: "", description: "", category: "", isRequireHealthTest: false });
  }, [open]);

  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/Sports/create", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          isRequireHealthTest: form.isRequireHealthTest,
        }),
      });
      toast({ title: "Sport created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create sport."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="Add Sport" description="Create a new sport discipline" onSubmit={handleSubmit} loading={loading} errors={errors}>
      <FormInput id="name" label="Name" value={form.name} onChange={set("name")} required />
      <FormInput id="description" label="Description" value={form.description} onChange={set("description")} />
      <FormSelect id="category" label="Category" value={form.category} onChange={set("category")} required options={[
        { value: "Individual", label: "Individual" },
        { value: "Team", label: "Team" },
      ]} />
      <FormToggle id="isRequireHealthTest" label="Requires Health Test" checked={form.isRequireHealthTest} onChange={(v) => setForm((f) => ({ ...f, isRequireHealthTest: v }))} description="Enable if trainees need a health clearance" />
    </BaseModal>
  );
}
