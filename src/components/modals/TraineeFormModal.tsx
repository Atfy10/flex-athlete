import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormMultiSelect, MultiSelectOption } from "./FormMultiSelect";
import { FormDatePicker } from "./FormDatePicker";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TraineeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TraineeFormModal({ open, onOpenChange, onSuccess }: TraineeFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [sportsOptions, setSportsOptions] = useState<MultiSelectOption[]>([]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", ssn: "", parentNumber: "", guardianName: "",
    birthDate: undefined as Date | undefined, gender: "", branchId: "", sportIds: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ firstName: "", lastName: "", ssn: "", parentNumber: "", guardianName: "", birthDate: undefined, gender: "", branchId: "", sportIds: [] });
    Promise.all([
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch/get-all"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Sports/get-all"),
    ]).then(([brRes, spRes]) => {
      if (brRes.isSuccess) setBranches(brRes.data.map((b) => ({ value: String(b.id), label: b.name })));
      if (spRes.isSuccess) setSportsOptions(spRes.data.map((s) => ({ value: String(s.id), label: s.name })));
    }).catch(() => {});
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/Trainee/create", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          ssn: form.ssn,
          parentNumber: form.parentNumber,
          guardianName: form.guardianName,
          birthDate: form.birthDate ? format(form.birthDate, "yyyy-MM-dd") : null,
          gender: form.gender,
          branchId: Number(form.branchId),
          sportIds: form.sportIds.map(Number),
        }),
      });
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
    <BaseModal open={open} onOpenChange={onOpenChange} title="Add Trainee" description="Register a new trainee" onSubmit={handleSubmit} loading={loading} errors={errors}>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="firstName" label="First Name" value={form.firstName} onChange={set("firstName")} required />
        <FormInput id="lastName" label="Last Name" value={form.lastName} onChange={set("lastName")} required />
      </div>
      <FormInput id="ssn" label="SSN" value={form.ssn} onChange={set("ssn")} required />
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="parentNumber" label="Parent Number" value={form.parentNumber} onChange={set("parentNumber")} />
        <FormInput id="guardianName" label="Guardian Name" value={form.guardianName} onChange={set("guardianName")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormDatePicker id="birthDate" label="Birth Date" value={form.birthDate} onChange={(d) => setForm((f) => ({ ...f, birthDate: d }))} required />
        <FormSelect id="gender" label="Gender" value={form.gender} onChange={set("gender")} required options={[
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
        ]} />
      </div>
      <FormSelect id="branchId" label="Branch" value={form.branchId} onChange={set("branchId")} options={branches} required placeholder="Select branch" />
      <FormMultiSelect id="sportIds" label="Sports" values={form.sportIds} onChange={(v) => setForm((f) => ({ ...f, sportIds: v }))} options={sportsOptions} placeholder="Select sports" />
    </BaseModal>
  );
}
