import { useState, useEffect, useCallback } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormMultiSelect, MultiSelectOption } from "./FormMultiSelect";
import {
  SearchableSelect,
  SearchableOption,
} from "@/components/ui/SearchableSelect";
import { FormDatePicker } from "./FormDatePicker";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getBranches } from "@/services/branch.services";
import { getSports } from "@/services/sport.services";
import { getFamilies } from "@/services/family.services";
import { getNationalityCategories } from "@/services/nationalityCategory.services";
import { createTrainee } from "@/services/trainee.service";
import { CreateTraineeCommand } from "@/types/commands/createTraineeCommand";

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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [sportsOptions, setSportsOptions] = useState<MultiSelectOption[]>([]);
  const [nationalityCategories, setNationalityCategories] = useState<
    SelectOption[]
  >([]);
  const [selectedFamily, setSelectedFamily] = useState<SearchableOption | null>(
    null,
  );

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

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({
      firstName: "",
      lastName: "",
      ssn: "",
      parentNumber: "",
      guardianName: "",
      birthDate: undefined,
      gender: "",
      branchId: "",
      sportIds: [],
      nationalityCategoryId: "",
    });
    Promise.all([getBranches(), getSports(), getNationalityCategories()])
      .then(([brRes, spRes, natRes]) => {
        if (brRes.isSuccess)
          setBranches(
            brRes.data.map((b) => ({ value: String(b.id), label: b.name })),
          );
        if (spRes.isSuccess)
          setSportsOptions(
            spRes.data.map((s) => ({ value: String(s.id), label: s.name })),
          );
        if (natRes.isSuccess)
          setNationalityCategories(
            natRes.data.map((n) => ({ value: String(n.id), label: n.name })),
          );
      })
      .catch(() => {});
    setSelectedFamily(null);
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const fetchFamiliesById = useCallback(
    async (query: string): Promise<SearchableOption[]> => {
      const baseOption: SearchableOption = {
        value: "0",
        label: "Without family (new)",
      };

      const trimmed = query.trim();

      if (!trimmed) return [baseOption];

      // Only allow numeric IDs
      if (!/^\d+$/.test(trimmed)) return [baseOption];

      // If user types 0, keep it as the special "no family" option
      if (trimmed === "0") return [baseOption];

      try {
        const res = await getFamilies(trimmed);
        if (!res.isSuccess || !Array.isArray(res.data)) return [baseOption];

        const apiOptions = res.data.map((f) => ({
          value: String(f.id),
          label: `Family Code: ${f.code}`,
        }));

        return [baseOption, ...apiOptions];
      } catch {
        return [baseOption];
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const familyId = selectedFamily ? Number(selectedFamily.value) : 0;

      const command: CreateTraineeCommand = {
        firstName: form.firstName,
        lastName: form.lastName,
        ssn: form.ssn,
        parentNumber: form.parentNumber || null,
        guardianName: form.guardianName || null,
        birthDate: format(form.birthDate!, "yyyy-MM-dd"),
        gender: form.gender as string,
        branchId: parseInt(form.branchId),
        sportIds: form.sportIds.map((id) => parseInt(id)),
        familyId,
        nationalityCategoryId: parseInt(form.nationalityCategoryId),
      };

      const result = await createTrainee(command);

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, {
          message: result.message || "Failed to create trainee.",
        });
      }

      toast({ title: "Trainee created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create trainee."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Trainee"
      description="Register a new trainee"
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="firstName"
          label="First Name"
          value={form.firstName}
          onChange={set("firstName")}
          required
        />
        <FormInput
          id="lastName"
          label="Last Name"
          value={form.lastName}
          onChange={set("lastName")}
          required
        />
      </div>
      <FormInput
        id="ssn"
        label="SSN"
        value={form.ssn}
        onChange={set("ssn")}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="parentNumber"
          label="Parent Number"
          value={form.parentNumber}
          onChange={set("parentNumber")}
        />
        <FormInput
          id="guardianName"
          label="Guardian Name"
          value={form.guardianName}
          onChange={set("guardianName")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormDatePicker
          id="birthDate"
          label="Birth Date"
          value={form.birthDate}
          onChange={(d) => setForm((f) => ({ ...f, birthDate: d }))}
          required
        />
        <FormSelect
          id="gender"
          label="Gender"
          value={form.gender}
          onChange={set("gender")}
          required
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]}
        />
      </div>
      <FormSelect
        id="branchId"
        label="Branch"
        value={form.branchId}
        onChange={set("branchId")}
        options={branches}
        required
        placeholder="Select branch"
      />
      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          id="familyId"
          label="Family"
          placeholder="Type family ID..."
          value={selectedFamily}
          onChange={setSelectedFamily}
          onSearch={fetchFamiliesById}
          debounceMs={2000}
        />
        <FormSelect
          id="nationalityCategoryId"
          label="Nationality Category"
          value={form.nationalityCategoryId}
          onChange={set("nationalityCategoryId")}
          options={nationalityCategories}
          required
          placeholder="Select nationality category"
        />
      </div>
      <FormMultiSelect
        id="sportIds"
        label="Sports"
        values={form.sportIds}
        onChange={(v) => setForm((f) => ({ ...f, sportIds: v }))}
        options={sportsOptions}
        placeholder="Select sports"
      />
    </BaseModal>
  );
}
