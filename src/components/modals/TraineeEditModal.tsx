import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormMultiSelect, MultiSelectOption } from "./FormMultiSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TraineeEditData {
  id: number;
  firstName: string;
  lastName: string;
  parentNumber?: string;
  guardianName?: string;
  branchName?: string;
  sports?: string[];
}

interface TraineeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  trainee: TraineeEditData | null;
}

export function TraineeEditModal({ open, onOpenChange, onSuccess, trainee }: TraineeEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [sportsOptions, setSportsOptions] = useState<MultiSelectOption[]>([]);

  const [form, setForm] = useState({
    parentNumber: "",
    guardianName: "",
    branchId: "",
    sportIds: [] as string[],
  });

  useEffect(() => {
    if (!open || !trainee) return;
    setErrors([]);
    setForm({
      parentNumber: trainee.parentNumber ?? "",
      guardianName: trainee.guardianName ?? "",
      branchId: "",
      sportIds: [],
    });
    Promise.all([
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch/get-all"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Sports/get-all"),
    ]).then(([brRes, spRes]) => {
      if (brRes.isSuccess) setBranches(brRes.data.map((b) => ({ value: String(b.id), label: b.name })));
      if (spRes.isSuccess) setSportsOptions(spRes.data.map((s) => ({ value: String(s.id), label: s.name })));
    }).catch(() => {});
  }, [open, trainee]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee) return;
    setErrors([]);
    setLoading(true);
    try {
      const result = await apiFetch(`/api/Trainee/${trainee.id}`, {
        method: "PUT",
        body: JSON.stringify({
          parentNumber: form.parentNumber || null,
          guardianName: form.guardianName || null,
          branchId: form.branchId ? Number(form.branchId) : undefined,
          sportIds: form.sportIds.length > 0 ? form.sportIds.map(Number) : undefined,
        }),
      }) as { isSuccess: boolean; message?: string; statusCode: number };

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to update trainee." });
      }

      toast({ title: "Trainee updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to update trainee."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Trainee"
      description="Update editable trainee details"
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
      submitLabel="Save Changes"
    >
      {/* Read-only display */}
      <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Read-only</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{trainee?.firstName} {trainee?.lastName}</span>
        </div>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="parentNumber" label="Parent Number" value={form.parentNumber} onChange={set("parentNumber")} />
        <FormInput id="guardianName" label="Guardian Name" value={form.guardianName} onChange={set("guardianName")} />
      </div>
      <FormSelect id="branchId" label="Branch" value={form.branchId} onChange={set("branchId")} options={branches} placeholder="Keep current branch" />
      <FormMultiSelect id="sportIds" label="Sports" values={form.sportIds} onChange={(v) => setForm((f) => ({ ...f, sportIds: v }))} options={sportsOptions} placeholder="Keep current sports" />
    </BaseModal>
  );
}
