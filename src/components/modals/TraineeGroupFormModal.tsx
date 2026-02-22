import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TraineeGroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TraineeGroupFormModal({ open, onOpenChange, onSuccess }: TraineeGroupFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [coaches, setCoaches] = useState<SelectOption[]>([]);
  const [allCoaches, setAllCoaches] = useState<{ id: number; name: string; branchId: number }[]>([]);

  const [form, setForm] = useState({
    skillLevel: "", maximumCapacity: "", durationInMinutes: "", gender: "", branchId: "", coachId: "",
  });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ skillLevel: "", maximumCapacity: "", durationInMinutes: "", gender: "", branchId: "", coachId: "" });
    Promise.all([
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch/get-all"),
      apiFetch<{ data: { id: number; employeeFirstName: string; employeeLastName: string; branchId: number }[]; isSuccess: boolean }>("/api/Coach/get-all"),
    ]).then(([brRes, coachRes]) => {
      if (brRes.isSuccess) setBranches(brRes.data.map((b) => ({ value: String(b.id), label: b.name })));
      if (coachRes.isSuccess) {
        setAllCoaches(coachRes.data.map((c) => ({ id: c.id, name: `${c.employeeFirstName} ${c.employeeLastName}`, branchId: c.branchId })));
      }
    }).catch(() => {});
  }, [open]);

  // Filter coaches by selected branch
  useEffect(() => {
    if (form.branchId) {
      const filtered = allCoaches.filter((c) => c.branchId === Number(form.branchId));
      setCoaches(filtered.map((c) => ({ value: String(c.id), label: c.name })));
      // Reset coach if not in filtered list
      if (!filtered.find((c) => String(c.id) === form.coachId)) {
        setForm((f) => ({ ...f, coachId: "" }));
      }
    } else {
      setCoaches(allCoaches.map((c) => ({ value: String(c.id), label: c.name })));
    }
  }, [form.branchId, allCoaches]);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/TraineeGroup/create", {
        method: "POST",
        body: JSON.stringify({
          skillLevel: form.skillLevel,
          maximumCapacity: Number(form.maximumCapacity),
          durationInMinutes: Number(form.durationInMinutes),
          gender: form.gender,
          branchId: Number(form.branchId),
          coachId: Number(form.coachId),
        }),
      });
      toast({ title: "Trainee group created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create trainee group."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="Create Trainee Group" description="Set up a new training group" onSubmit={handleSubmit} loading={loading} errors={errors}>
      <div className="grid grid-cols-2 gap-3">
        <FormSelect id="skillLevel" label="Skill Level" value={form.skillLevel} onChange={set("skillLevel")} required options={[
          { value: "Beginner", label: "Beginner" },
          { value: "Intermediate", label: "Intermediate" },
          { value: "Advanced", label: "Advanced" },
        ]} />
        <FormSelect id="gender" label="Gender" value={form.gender} onChange={set("gender")} required options={[
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
          { value: "Mixed", label: "Mixed" },
        ]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="maximumCapacity" label="Max Capacity" value={form.maximumCapacity} onChange={set("maximumCapacity")} type="number" min={1} required />
        <FormInput id="durationInMinutes" label="Duration (min)" value={form.durationInMinutes} onChange={set("durationInMinutes")} type="number" min={1} required />
      </div>
      <FormSelect id="branchId" label="Branch" value={form.branchId} onChange={set("branchId")} options={branches} required placeholder="Select branch" />
      <FormSelect id="coachId" label="Coach" value={form.coachId} onChange={set("coachId")} options={coaches} required placeholder="Select coach" disabled={!form.branchId} />
    </BaseModal>
  );
}
