import { useState, useEffect } from "react";
import { useFormDirty } from "@/hooks/useFormDirty";
import { z } from "zod";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { updateTraineeGroup, TraineeGroupDetailDto } from "@/services/traineeGroup.services";

// ─── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
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
  coachId: z.string().min(1, "Coach is required"),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

interface TraineeGroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  group: TraineeGroupDetailDto | null;
}

export function TraineeGroupEditModal({
  open,
  onOpenChange,
  onSuccess,
  group,
}: TraineeGroupEditModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [coaches, setCoaches] = useState<SelectOption[]>([]);
  const [allCoaches, setAllCoaches] = useState<
    { id: number; name: string; branchName: string }[]
  >([]);
  const [coachesLoading, setCoachesLoading] = useState(false);

  const [form, setForm] = useState({
    skillLevel: "",
    maximumCapacity: "",
    durationInMinutes: "",
    gender: "",
    coachId: "",
  });

  // ── Hydrate form when modal opens ─────────────────────────────────────────
  useEffect(() => {
    if (!open || !group) return;
    resetDirty();
    setApiErrors([]);
    setFieldErrors({});

    // Populate all fields from existing group data immediately
    setForm({
      skillLevel: group.skillLevel ?? "",
      maximumCapacity: String(group.maximumCapacity),
      durationInMinutes: String(group.durationInMinutes),
      gender: group.gender ?? "",
      coachId: "", // resolved after coaches load
    });

    // Load coaches to resolve current coach ID from name
    setCoachesLoading(true);
    apiFetch<{
      data: {
        id: number;
        employeeFirstName: string;
        employeeLastName: string;
        branchName: string;
      }[];
      isSuccess: boolean;
    }>("/api/Coach/get-all")
      .then((res) => {
        if (res.isSuccess) {
          const mapped = res.data.map((c) => ({
            id: c.id,
            name: `${c.employeeFirstName} ${c.employeeLastName}`,
            branchName: c.branchName,
          }));
          setAllCoaches(mapped);

          // Filter to same branch for display and resolve current coach by name
          const branchCoaches = mapped.filter((c) => c.branchName === group.branchName);
          const displayCoaches =
            branchCoaches.length > 0 ? branchCoaches : mapped;
          setCoaches(displayCoaches.map((c) => ({ value: String(c.id), label: c.name })));

          const match = mapped.find((c) => c.name === group.coachName);
          if (match) setForm((f) => ({ ...f, coachId: String(match.id) }));
        }
      })
      .catch(() => {})
      .finally(() => setCoachesLoading(false));
  }, [open, group]);

  const set = (key: keyof typeof form) => (val: string) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    setApiErrors([]);
    setFieldErrors({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof FieldErrors;
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const result = await updateTraineeGroup(group.id, {
        skillLevel: form.skillLevel,
        maximumCapacity: Number(form.maximumCapacity),
        durationInMinutes: Number(form.durationInMinutes),
        gender: form.gender,
        coachId: Number(form.coachId),
      });

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode ?? 400, {
          message: result.message || "Failed to update group.",
        });
      }

      toast({ title: "Group updated successfully" });
      resetDirty();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to update group."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Trainee Group"
      description="Update group details. Branch cannot be changed after creation."
      onSubmit={handleSubmit}
      loading={loading}
      errors={apiErrors}
      submitLabel="Save Changes"
      isDirty={isDirty}
    >
      {/* Read-only display */}
      <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Read-only
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Sport</span>
          <span className="font-medium">{group?.sportName ?? "—"}</span>
          <span className="text-muted-foreground">Branch</span>
          <span className="font-medium">{group?.branchName ?? "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormSelect
          id="skillLevel"
          label="Skill Level"
          value={form.skillLevel}
          onChange={set("skillLevel")}
          required
          error={fieldErrors.skillLevel}
          options={[
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" },
          ]}
          placeholder="Select level"
        />
        <FormSelect
          id="gender"
          label="Gender"
          value={form.gender}
          onChange={set("gender")}
          required
          error={fieldErrors.gender}
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
          id="maximumCapacity"
          label="Max Capacity"
          value={form.maximumCapacity}
          onChange={set("maximumCapacity")}
          type="number"
          min={1}
          required
          error={fieldErrors.maximumCapacity}
        />
        <FormInput
          id="durationInMinutes"
          label="Duration (min)"
          value={form.durationInMinutes}
          onChange={set("durationInMinutes")}
          type="number"
          min={15}
          required
          hint="Minimum 15 minutes"
          error={fieldErrors.durationInMinutes}
        />
      </div>

      <FormSelect
        id="coachId"
        label="Coach"
        value={form.coachId}
        onChange={set("coachId")}
        options={coaches}
        required
        loading={coachesLoading}
        emptyMessage="No coaches available"
        placeholder="Select coach"
        hint={group?.branchName ? `Showing coaches in ${group.branchName}` : undefined}
        error={fieldErrors.coachId}
      />
    </BaseModal>
  );
}
