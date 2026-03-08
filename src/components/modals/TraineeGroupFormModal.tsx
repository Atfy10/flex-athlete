import { useState, useEffect } from "react";
import { useFormDirty } from "@/hooks/useFormDirty";
import { z } from "zod";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── Validation schema ────────────────────────────────────────────────────────
const traineeGroupSchema = z.object({
  skillLevel: z.string().min(1, "Skill level is required"),
  gender: z.string().min(1, "Gender is required"),
  maximumCapacity: z
    .string()
    .refine((v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Capacity must be a whole number ≥ 1",
    }),
  durationInMinutes: z
    .string()
    .refine((v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 15, {
      message: "Duration must be at least 15 minutes",
    }),
  branchId: z.string().min(1, "Branch is required"),
  coachId: z.string().min(1, "Coach is required"),
});

type GroupFormValues = z.infer<typeof traineeGroupSchema>;
type FieldErrors = Partial<Record<keyof GroupFormValues, string>>;

interface TraineeGroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TraineeGroupFormModal({ open, onOpenChange, onSuccess }: TraineeGroupFormModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [coaches, setCoaches] = useState<SelectOption[]>([]);
  const [allCoaches, setAllCoaches] = useState<{ id: number; name: string; branchId: number }[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(false);

  const [form, setForm] = useState({
    skillLevel: "", maximumCapacity: "", durationInMinutes: "",
    gender: "", branchId: "", coachId: "",
  });

  useEffect(() => {
    if (!open) return;
    resetDirty();
    setApiErrors([]);
    setFieldErrors({});
    setForm({ skillLevel: "", maximumCapacity: "", durationInMinutes: "", gender: "", branchId: "", coachId: "" });

    setBranchesLoading(true);
    setCoachesLoading(true);

    Promise.allSettled([
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch/get-all"),
      apiFetch<{ data: { id: number; employeeFirstName: string; employeeLastName: string; branchId: number }[]; isSuccess: boolean }>("/api/Coach/get-all"),
    ]).then(([brRes, coachRes]) => {
      if (brRes.status === "fulfilled" && brRes.value.isSuccess)
        setBranches(brRes.value.data.map((b) => ({ value: String(b.id), label: b.name })));
      if (coachRes.status === "fulfilled" && coachRes.value.isSuccess)
        setAllCoaches(coachRes.value.data.map((c) => ({
          id: c.id,
          name: `${c.employeeFirstName} ${c.employeeLastName}`,
          branchId: c.branchId,
        })));
    }).finally(() => {
      setBranchesLoading(false);
      setCoachesLoading(false);
    });
  }, [open]);

  // Filter coaches by selected branch
  useEffect(() => {
    if (form.branchId) {
      const filtered = allCoaches.filter((c) => c.branchId === Number(form.branchId));
      setCoaches(filtered.map((c) => ({ value: String(c.id), label: c.name })));
      if (!filtered.find((c) => String(c.id) === form.coachId)) {
        setForm((f) => ({ ...f, coachId: "" }));
        setFieldErrors((fe) => ({ ...fe, coachId: undefined }));
      }
    } else {
      setCoaches(allCoaches.map((c) => ({ value: String(c.id), label: c.name })));
    }
  }, [form.branchId, allCoaches]);

  const set = (key: keyof typeof form) => (val: string) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors([]);
    setFieldErrors({});

    const parsed = traineeGroupSchema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof GroupFormValues;
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

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
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to create trainee group."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open} onOpenChange={onOpenChange}
      title="Create Trainee Group"
      description="Set up a new training group. Fields marked with * are required."
      onSubmit={handleSubmit} loading={loading} errors={apiErrors}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormSelect
          id="skillLevel" label="Skill Level"
          value={form.skillLevel} onChange={(v) => { set("skillLevel")(v); }}
          required error={fieldErrors.skillLevel}
          options={[
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" },
          ]}
          placeholder="Select level"
        />
        <FormSelect
          id="gender" label="Gender"
          value={form.gender} onChange={(v) => { set("gender")(v); }}
          required error={fieldErrors.gender}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Mixed", label: "Mixed" },
          ]}
          placeholder="Select gender"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="maximumCapacity" label="Max Capacity"
          value={form.maximumCapacity} onChange={set("maximumCapacity")}
          type="number" min={1} required
          placeholder="e.g. 20"
          error={fieldErrors.maximumCapacity}
        />
        <FormInput
          id="durationInMinutes" label="Duration (min)"
          value={form.durationInMinutes} onChange={set("durationInMinutes")}
          type="number" min={15} required
          placeholder="e.g. 60"
          hint="Minimum 15 minutes"
          error={fieldErrors.durationInMinutes}
        />
      </div>

      <FormSelect
        id="branchId" label="Branch"
        value={form.branchId} onChange={(v) => { set("branchId")(v); }}
        options={branches} required
        placeholder="Select branch"
        loading={branchesLoading}
        emptyMessage="No branches available"
        error={fieldErrors.branchId}
      />

      <FormSelect
        id="coachId" label="Coach"
        value={form.coachId} onChange={(v) => { set("coachId")(v); }}
        options={coaches} required
        placeholder={form.branchId ? "Select coach" : "Select a branch first"}
        loading={coachesLoading}
        emptyMessage={form.branchId ? "No coaches in this branch" : "Select a branch first"}
        disabled={!form.branchId}
        error={fieldErrors.coachId}
        hint={form.branchId ? "Only coaches in the selected branch are shown" : undefined}
      />
    </BaseModal>
  );
}
