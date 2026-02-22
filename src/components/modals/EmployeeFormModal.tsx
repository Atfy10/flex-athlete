import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormDatePicker } from "./FormDatePicker";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeFormModal({ open, onOpenChange, onSuccess }: EmployeeFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    ssn: "",
    salary: "",
    gender: "",
    birthDate: undefined as Date | undefined,
    email: "",
    nationality: "",
    street: "",
    city: "",
    phoneNumber: "",
    secondNumber: "",
    position: "",
    branchId: "",
  });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({
      firstName: "", lastName: "", ssn: "", salary: "", gender: "",
      birthDate: undefined, email: "", nationality: "", street: "",
      city: "", phoneNumber: "", secondNumber: "", position: "", branchId: "",
    });
    apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Branch/get-all")
      .then((res) => {
        if (res.isSuccess) {
          setBranches(res.data.map((b) => ({ value: String(b.id), label: b.name })));
        }
      })
      .catch(() => {});
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/Emplopyee/create", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          ssn: form.ssn,
          salary: Number(form.salary),
          gender: form.gender,
          birthDate: form.birthDate ? format(form.birthDate, "yyyy-MM-dd") : null,
          email: form.email,
          nationality: form.nationality,
          street: form.street,
          city: form.city,
          phoneNumber: form.phoneNumber,
          secondNumber: form.secondNumber || null,
          position: form.position,
          branchId: Number(form.branchId),
        }),
      });
      toast({ title: "Employee created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.getValidationErrors());
      } else {
        setErrors(["Failed to create employee."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee"
      description="Fill in employee details"
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="firstName" label="First Name" value={form.firstName} onChange={set("firstName")} required />
        <FormInput id="lastName" label="Last Name" value={form.lastName} onChange={set("lastName")} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="ssn" label="SSN" value={form.ssn} onChange={set("ssn")} required />
        <FormInput id="salary" label="Salary" value={form.salary} onChange={set("salary")} type="number" min={0} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormSelect id="gender" label="Gender" value={form.gender} onChange={set("gender")} required options={[
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
        ]} />
        <FormDatePicker id="birthDate" label="Birth Date" value={form.birthDate} onChange={(d) => setForm((f) => ({ ...f, birthDate: d }))} required />
      </div>
      <FormInput id="email" label="Email" value={form.email} onChange={set("email")} type="email" />
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="nationality" label="Nationality" value={form.nationality} onChange={set("nationality")} />
        <FormInput id="position" label="Position" value={form.position} onChange={set("position")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="street" label="Street" value={form.street} onChange={set("street")} />
        <FormInput id="city" label="City" value={form.city} onChange={set("city")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput id="phoneNumber" label="Phone Number" value={form.phoneNumber} onChange={set("phoneNumber")} required />
        <FormInput id="secondNumber" label="Second Number" value={form.secondNumber} onChange={set("secondNumber")} />
      </div>
      <FormSelect id="branchId" label="Branch" value={form.branchId} onChange={set("branchId")} options={branches} required placeholder="Select branch" />
    </BaseModal>
  );
}
