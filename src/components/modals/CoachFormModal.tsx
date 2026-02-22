import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CoachFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CoachFormModal({ open, onOpenChange, onSuccess }: CoachFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [employees, setEmployees] = useState<SelectOption[]>([]);
  const [sports, setSports] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({ employeeId: "", sportId: "", skillLevel: "" });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ employeeId: "", sportId: "", skillLevel: "" });

    Promise.all([
      apiFetch<{ data: { id: number; firstName: string; lastName: string }[]; isSuccess: boolean }>("/api/Emplopyee/get-non-coaches"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Sports/get-all"),
    ]).then(([empRes, sportRes]) => {
      if (empRes.isSuccess) {
        setEmployees(empRes.data.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` })));
      }
      if (sportRes.isSuccess) {
        setSports(sportRes.data.map((s) => ({ value: String(s.id), label: s.name })));
      }
    }).catch(() => {});
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/Coach/create", {
        method: "POST",
        body: JSON.stringify({
          employeeId: Number(form.employeeId),
          sportId: Number(form.sportId),
          skillLevel: form.skillLevel,
        }),
      });
      toast({ title: "Coach created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create coach."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="Add Coach" description="Assign an employee as a coach" onSubmit={handleSubmit} loading={loading} errors={errors}>
      <FormSelect id="employeeId" label="Employee" value={form.employeeId} onChange={set("employeeId")} options={employees} required placeholder="Select employee" />
      <FormSelect id="sportId" label="Sport" value={form.sportId} onChange={set("sportId")} options={sports} required placeholder="Select sport" />
      <FormSelect id="skillLevel" label="Skill Level" value={form.skillLevel} onChange={set("skillLevel")} required options={[
        { value: "Beginner", label: "Beginner" },
        { value: "Intermediate", label: "Intermediate" },
        { value: "Advanced", label: "Advanced" },
      ]} />
    </BaseModal>
  );
}
