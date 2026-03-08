import { useState, useEffect, useCallback } from "react";
import { useFormDirty } from "@/hooks/useFormDirty";
import { z } from "zod";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormMultiSelect, MultiSelectOption } from "./FormMultiSelect";
import {
  SearchableSelect,
  SearchableOption,
} from "@/components/ui/SearchableSelect";
import { FormDatePicker } from "./FormDatePicker";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getBranches } from "@/services/branch.services";
import { getSports } from "@/services/sport.services";
import { getFamilies } from "@/services/family.services";
import { getNationalityCategories } from "@/services/nationalityCategory.services";
import { createTrainee } from "@/services/trainee.service";
import { CreateTraineeCommand } from "@/types/commands/createTraineeCommand";

// ─── Validation schema ────────────────────────────────────────────────────────
const traineeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  ssn: z
    .string()
    .trim()
    .min(5, "SSN must be at least 5 characters")
    .max(30, "SSN must be at most 30 characters"),
  parentNumber: z
    .string()
    .trim()
    .max(20, "Phone must be at most 20 characters")
    .optional()
    .or(z.literal("")),
  guardianName: z
    .string()
    .trim()
    .max(100, "Guardian name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  gender: z.string().min(1, "Gender is required"),
  branchId: z.string().min(1, "Branch is required"),
  nationalityCategoryId: z.string().min(1, "Nationality category is required"),
  sportIds: z.array(z.string()).min(1, "At least one sport must be selected"),
  birthDate: z.date({ required_error: "Birth date is required" }),
});

type TraineeFormValues = z.infer<typeof traineeSchema>;
type FieldErrors = Partial<Record<keyof TraineeFormValues, string>>;

interface TraineeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TraineeFormModal({
  open,
  onOpenChange,
  onSuccess,
}: TraineeFormModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [sportsOptions, setSportsOptions] = useState<MultiSelectOption[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [nationalityCategories, setNationalityCategories] = useState<SelectOption[]>([]);
  const [natLoading, setNatLoading] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<SearchableOption | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    ssn: "",
    parentNumber: "",
    guardianName: "",
    birthDate: undefined as Date | undefined,
    gender: "",
    branchId: "",
    sportIds: [] as string[],
    nationalityCategoryId: "",
  });

  // Clear state and load options on open
  useEffect(() => {
    if (!open) return;
    setApiErrors([]);
    setFieldErrors({});
    setForm({
      firstName: "", lastName: "", ssn: "", parentNumber: "",
      guardianName: "", birthDate: undefined, gender: "", branchId: "",
      sportIds: [], nationalityCategoryId: "",
    });
    setSelectedFamily(null);

    setBranchesLoading(true);
    setSportsLoading(true);
    setNatLoading(true);

    Promise.allSettled([getBranches(), getSports(), getNationalityCategories()])
      .then(([brRes, spRes, natRes]) => {
        if (brRes.status === "fulfilled" && brRes.value.isSuccess)
          setBranches(brRes.value.data.map((b) => ({ value: String(b.id), label: b.name })));
        if (spRes.status === "fulfilled" && spRes.value.isSuccess)
          setSportsOptions(spRes.value.data.map((s) => ({ value: String(s.id), label: s.name })));
        if (natRes.status === "fulfilled" && natRes.value.isSuccess)
          setNationalityCategories(natRes.value.data.map((n) => ({ value: String(n.id), label: n.name })));
      })
      .finally(() => {
        setBranchesLoading(false);
        setSportsLoading(false);
        setNatLoading(false);
      });
  }, [open]);

  // Helper: set a single form field and clear its error
  const set = (key: keyof typeof form) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const fetchFamiliesById = useCallback(
    async (query: string): Promise<SearchableOption[]> => {
      const baseOption: SearchableOption = { value: "0", label: "Without family (new)" };
      const trimmed = query.trim();
      if (!trimmed) return [baseOption];
      if (!/^\d+$/.test(trimmed)) return [baseOption];
      if (trimmed === "0") return [baseOption];
      try {
        const res = await getFamilies(trimmed);
        if (!res.isSuccess || !Array.isArray(res.data)) return [baseOption];
        return [baseOption, ...res.data.map((f) => ({ value: String(f.id), label: `Family Code: ${f.code}` }))];
      } catch {
        return [baseOption];
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors([]);
    setFieldErrors({});

    // Client-side Zod validation
    const parsed = traineeSchema.safeParse({ ...form, birthDate: form.birthDate });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof TraineeFormValues;
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const familyId = selectedFamily ? Number(selectedFamily.value) : 0;
      const command: CreateTraineeCommand = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        ssn: form.ssn.trim(),
        parentNumber: form.parentNumber.trim() || null,
        guardianName: form.guardianName.trim() || null,
        birthDate: format(form.birthDate!, "yyyy-MM-dd"),
        gender: form.gender,
        branchId: parseInt(form.branchId),
        sportIds: form.sportIds.map((id) => parseInt(id)),
        familyId,
        nationalityCategoryId: parseInt(form.nationalityCategoryId),
      };

      const result = await createTrainee(command);
      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to create trainee." });
      }

      toast({ title: "Trainee created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to create trainee."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Trainee"
      description="Register a new trainee. Fields marked with * are required."
      onSubmit={handleSubmit}
      loading={loading}
      errors={apiErrors}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="firstName" label="First Name"
          value={form.firstName} onChange={set("firstName")}
          required maxLength={50} minLength={2}
          error={fieldErrors.firstName}
          placeholder="e.g. Ahmed"
        />
        <FormInput
          id="lastName" label="Last Name"
          value={form.lastName} onChange={set("lastName")}
          required maxLength={50} minLength={2}
          error={fieldErrors.lastName}
          placeholder="e.g. Al-Mansouri"
        />
      </div>

      <FormInput
        id="ssn" label="SSN"
        value={form.ssn} onChange={set("ssn")}
        required maxLength={30} minLength={5}
        error={fieldErrors.ssn}
        placeholder="National ID or passport number"
      />

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="parentNumber" label="Parent Number"
          value={form.parentNumber} onChange={set("parentNumber")}
          maxLength={20} error={fieldErrors.parentNumber}
          placeholder="e.g. +962..."
        />
        <FormInput
          id="guardianName" label="Guardian Name"
          value={form.guardianName} onChange={set("guardianName")}
          maxLength={100} error={fieldErrors.guardianName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormDatePicker
          id="birthDate" label="Birth Date"
          value={form.birthDate}
          onChange={(d) => {
            setForm((f) => ({ ...f, birthDate: d }));
            setFieldErrors((fe) => ({ ...fe, birthDate: undefined }));
          }}
          required error={fieldErrors.birthDate}
        />
        <FormSelect
          id="gender" label="Gender"
          value={form.gender} onChange={(v) => { set("gender")(v); }}
          required
          options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]}
          error={fieldErrors.gender}
        />
      </div>

      <FormSelect
        id="branchId" label="Branch"
        value={form.branchId} onChange={(v) => { set("branchId")(v); }}
        options={branches} required
        placeholder="Select branch"
        loading={branchesLoading}
        error={fieldErrors.branchId}
        emptyMessage="No branches available"
      />

      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          id="familyId" label="Family"
          placeholder="Type family ID…"
          value={selectedFamily} onChange={setSelectedFamily}
          onSearch={fetchFamiliesById}
          debounceMs={300}
          hint="Leave blank to create without a family"
        />
        <FormSelect
          id="nationalityCategoryId" label="Nationality Category"
          value={form.nationalityCategoryId} onChange={(v) => { set("nationalityCategoryId")(v); }}
          options={nationalityCategories} required
          placeholder="Select category"
          loading={natLoading}
          error={fieldErrors.nationalityCategoryId}
        />
      </div>

      <FormMultiSelect
        id="sportIds" label="Sports"
        values={form.sportIds}
        onChange={(v) => {
          setForm((f) => ({ ...f, sportIds: v }));
          setFieldErrors((fe) => ({ ...fe, sportIds: undefined }));
        }}
        options={sportsOptions}
        placeholder={sportsLoading ? "Loading sports…" : "Select sports"}
        error={fieldErrors.sportIds}
      />
    </BaseModal>
  );
}
