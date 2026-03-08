import { useState, useEffect } from "react";
import { useFormDirty } from "@/hooks/useFormDirty";
import { z } from "zod";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormDatePicker } from "./FormDatePicker";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ApiResult } from "@/types/api";

// ─── Validation schema ────────────────────────────────────────────────────────
const employeeSchema = z.object({
  firstName: z
    .string().trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string().trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  ssn: z
    .string().trim()
    .min(5, "SSN must be at least 5 characters")
    .max(30, "SSN must be at most 30 characters"),
  salary: z
    .string()
    .refine((v) => v !== "" && !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Salary must be a non-negative number",
    }),
  gender: z.string().min(1, "Gender is required"),
  birthDate: z.date({ required_error: "Birth date is required" }),
  email: z
    .string().trim()
    .email("Must be a valid email address")
    .max(255, "Email must be at most 255 characters")
    .optional()
    .or(z.literal("")),
  nationality: z
    .string().trim()
    .max(60, "Nationality must be at most 60 characters")
    .optional()
    .or(z.literal("")),
  street: z
    .string().trim()
    .max(150, "Street must be at most 150 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string().trim()
    .max(100, "City must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string().trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number must be at most 20 digits"),
  secondNumber: z
    .string().trim()
    .max(20, "Secondary number must be at most 20 digits")
    .optional()
    .or(z.literal("")),
  position: z
    .string().trim()
    .max(100, "Position must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  branchId: z.string().min(1, "Branch is required"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;
type FieldErrors = Partial<Record<keyof EmployeeFormValues, string>>;

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  onSuccess,
}: EmployeeFormModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", ssn: "", salary: "",
    gender: "", birthDate: undefined as Date | undefined,
    email: "", nationality: "", street: "", city: "",
    phoneNumber: "", secondNumber: "", position: "", branchId: "",
  });

  useEffect(() => {
    if (!open) return;
    resetDirty();
    setApiErrors([]);
    setFieldErrors({});
    setForm({
      firstName: "", lastName: "", ssn: "", salary: "",
      gender: "", birthDate: undefined, email: "", nationality: "",
      street: "", city: "", phoneNumber: "", secondNumber: "",
      position: "", branchId: "",
    });

    setBranchesLoading(true);
    apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch")
      .then((res) => {
        if (res.isSuccess)
          setBranches(res.data.map((b) => ({ value: String(b.id), label: b.name })));
      })
      .catch(() => {})
      .finally(() => setBranchesLoading(false));
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors([]);
    setFieldErrors({});

    const parsed = employeeSchema.safeParse({ ...form, birthDate: form.birthDate });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof EmployeeFormValues;
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch<ApiResult<number>>("/api/Employee", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          ssn: form.ssn.trim(),
          salary: Number(form.salary),
          gender: form.gender,
          birthDate: form.birthDate ? format(form.birthDate, "yyyy-MM-dd") : null,
          email: form.email.trim() || null,
          nationality: form.nationality.trim() || null,
          street: form.street.trim() || null,
          city: form.city.trim() || null,
          phoneNumber: form.phoneNumber.trim(),
          secondNumber: form.secondNumber.trim() || null,
          position: form.position.trim() || null,
          branchId: Number(form.branchId),
        }),
      });

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to create employee." });
      }

      toast({ title: "Employee created successfully" });
      resetDirty();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to create employee."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee"
      description="Fill in employee details. Fields marked with * are required."
      onSubmit={handleSubmit}
      loading={loading}
      errors={apiErrors}
      isDirty={isDirty}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="firstName" label="First Name"
          value={form.firstName} onChange={set("firstName")}
          required maxLength={50} minLength={2}
          placeholder="e.g. Sara"
          error={fieldErrors.firstName}
        />
        <FormInput
          id="lastName" label="Last Name"
          value={form.lastName} onChange={set("lastName")}
          required maxLength={50} minLength={2}
          placeholder="e.g. Khalid"
          error={fieldErrors.lastName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="ssn" label="SSN"
          value={form.ssn} onChange={set("ssn")}
          required maxLength={30} minLength={5}
          placeholder="National ID"
          error={fieldErrors.ssn}
        />
        <FormInput
          id="salary" label="Salary"
          value={form.salary} onChange={set("salary")}
          type="number" min={0} required
          placeholder="0.00"
          error={fieldErrors.salary}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormSelect
          id="gender" label="Gender"
          value={form.gender} onChange={(v) => { set("gender")(v); }}
          required
          options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]}
          error={fieldErrors.gender}
        />
        <FormDatePicker
          id="birthDate" label="Birth Date"
          value={form.birthDate}
          onChange={(d) => {
            setForm((f) => ({ ...f, birthDate: d }));
            setFieldErrors((fe) => ({ ...fe, birthDate: undefined }));
          }}
          required error={fieldErrors.birthDate}
        />
      </div>

      <FormInput
        id="email" label="Email Address"
        value={form.email} onChange={set("email")}
        type="email" maxLength={255}
        placeholder="e.g. sara@academy.com"
        error={fieldErrors.email}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="nationality" label="Nationality"
          value={form.nationality} onChange={set("nationality")}
          maxLength={60} error={fieldErrors.nationality}
        />
        <FormInput
          id="position" label="Position"
          value={form.position} onChange={set("position")}
          maxLength={100} error={fieldErrors.position}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="street" label="Street"
          value={form.street} onChange={set("street")}
          maxLength={150} error={fieldErrors.street}
        />
        <FormInput
          id="city" label="City"
          value={form.city} onChange={set("city")}
          maxLength={100} error={fieldErrors.city}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormInput
          id="phoneNumber" label="Phone Number"
          value={form.phoneNumber} onChange={set("phoneNumber")}
          required maxLength={20} minLength={7}
          placeholder="e.g. +962..."
          error={fieldErrors.phoneNumber}
        />
        <FormInput
          id="secondNumber" label="Second Number"
          value={form.secondNumber} onChange={set("secondNumber")}
          maxLength={20} error={fieldErrors.secondNumber}
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
    </BaseModal>
  );
}
