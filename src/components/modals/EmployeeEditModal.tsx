import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EmployeeEditData {
  id: number;
  phoneNumber: string;
  secondNumber?: string;
  position: string;
  branchName: string;
  salary?: number;
  street?: string;
  city?: string;
  nationality?: string;
  // read-only display
  firstName: string;
  lastName: string;
  email: string;
}

interface EmployeeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employee: EmployeeEditData | null;
}

export function EmployeeEditModal({ open, onOpenChange, onSuccess, employee }: EmployeeEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({
    phoneNumber: "",
    secondNumber: "",
    position: "",
    salary: "",
    branchId: "",
    street: "",
    city: "",
    nationality: "",
  });

  useEffect(() => {
    if (!open || !employee) return;
    setErrors([]);
    setForm({
      phoneNumber: employee.phoneNumber ?? "",
      secondNumber: employee.secondNumber ?? "",
      position: employee.position ?? "",
      salary: employee.salary !== undefined ? String(employee.salary) : "",
      branchId: "",
      street: employee.street ?? "",
      city: employee.city ?? "",
      nationality: employee.nationality ?? "",
    });
    apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch")
      .then((res) => {
        if (res.isSuccess) {
          setBranches(res.data.map((b) => ({ value: String(b.id), label: b.name })));
        }
      })
      .catch(() => {});
  }, [open, employee]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setErrors([]);
    setLoading(true);
    try {
      const result = await apiFetch(`/api/Employee/${employee.id}`, {
        method: "PUT",
        body: JSON.stringify({
          phoneNumber: form.phoneNumber,
          secondNumber: form.secondNumber || null,
          position: form.position,
          salary: form.salary ? Number(form.salary) : undefined,
          branchId: form.branchId ? Number(form.branchId) : undefined,
          street: form.street || null,
          city: form.city || null,
          nationality: form.nationality || null,
        }),
      }) as { isSuccess: boolean; message?: string; statusCode: number };

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to update employee." });
      }

      toast({ title: "Employee updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to update employee."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Employee"
      description="Update editable employee details"
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
          <span className="font-medium">{employee?.firstName} {employee?.lastName}</span>
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{employee?.email}</span>
        </div>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="phoneNumber" label="Phone Number" value={form.phoneNumber} onChange={set("phoneNumber")} required />
        <FormInput id="secondNumber" label="Second Number" value={form.secondNumber} onChange={set("secondNumber")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="position" label="Position" value={form.position} onChange={set("position")} />
        <FormInput id="salary" label="Salary" value={form.salary} onChange={set("salary")} type="number" min={0} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="nationality" label="Nationality" value={form.nationality} onChange={set("nationality")} />
        <FormSelect id="branchId" label="Branch" value={form.branchId} onChange={set("branchId")} options={branches} placeholder="Keep current branch" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="street" label="Street" value={form.street} onChange={set("street")} />
        <FormInput id="city" label="City" value={form.city} onChange={set("city")} />
      </div>
    </BaseModal>
  );
}
