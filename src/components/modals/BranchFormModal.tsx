import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface BranchFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BranchFormModal({ open, onOpenChange, onSuccess }: BranchFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", city: "", country: "", phoneNumber: "", email: "", coX: "", coY: "",
  });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ name: "", city: "", country: "", phoneNumber: "", email: "", coX: "", coY: "" });
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/Branch/create", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          country: form.country,
          phoneNumber: form.phoneNumber,
          email: form.email,
          coX: form.coX ? Number(form.coX) : null,
          coY: form.coY ? Number(form.coY) : null,
        }),
      });
      toast({ title: "Branch created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create branch."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="Add Branch" description="Add a new academy branch" onSubmit={handleSubmit} loading={loading} errors={errors}>
      <FormInput id="name" label="Name" value={form.name} onChange={set("name")} required />
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="city" label="City" value={form.city} onChange={set("city")} required />
        <FormInput id="country" label="Country" value={form.country} onChange={set("country")} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="phoneNumber" label="Phone Number" value={form.phoneNumber} onChange={set("phoneNumber")} />
        <FormInput id="email" label="Email" value={form.email} onChange={set("email")} type="email" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="coX" label="CoX (Longitude)" value={form.coX} onChange={set("coX")} type="number" />
        <FormInput id="coY" label="CoY (Latitude)" value={form.coY} onChange={set("coY")} type="number" />
      </div>
    </BaseModal>
  );
}
