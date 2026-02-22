import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormDatePicker } from "./FormDatePicker";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EnrollmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnrollmentFormModal({ open, onOpenChange, onSuccess }: EnrollmentFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [trainees, setTrainees] = useState<SelectOption[]>([]);
  const [groups, setGroups] = useState<SelectOption[]>([]);
  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({
    enrollmentDate: undefined as Date | undefined,
    expiryDate: undefined as Date | undefined,
    sessionAllowed: "",
    traineeId: "",
    traineeGroupId: "",
    subscriptionDetailsId: "",
  });

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ enrollmentDate: new Date(), expiryDate: undefined, sessionAllowed: "", traineeId: "", traineeGroupId: "", subscriptionDetailsId: "" });
    Promise.all([
      apiFetch<{ data: { id: number; firstName: string; lastName: string }[]; isSuccess: boolean }>("/api/Trainee/get-all"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/TraineeGroup/get-all-dropdown"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/SubscriptionDetails/get-all"),
    ]).then(([tRes, gRes, sRes]) => {
      if (tRes.isSuccess) setTrainees(tRes.data.map((t) => ({ value: String(t.id), label: `${t.firstName} ${t.lastName}` })));
      if (gRes.isSuccess) setGroups(gRes.data.map((g) => ({ value: String(g.id), label: g.name })));
      if (sRes.isSuccess) setSubscriptions(sRes.data.map((s) => ({ value: String(s.id), label: s.name })));
    }).catch(() => {});
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (form.enrollmentDate && form.expiryDate && form.expiryDate <= form.enrollmentDate) {
      setErrors(["Expiry date must be after enrollment date."]);
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/Enrollment/create", {
        method: "POST",
        body: JSON.stringify({
          enrollmentDate: form.enrollmentDate ? format(form.enrollmentDate, "yyyy-MM-dd") : null,
          expiryDate: form.expiryDate ? format(form.expiryDate, "yyyy-MM-dd") : null,
          sessionAllowed: Number(form.sessionAllowed),
          traineeId: Number(form.traineeId),
          traineeGroupId: Number(form.traineeGroupId),
          subscriptionDetailsId: form.subscriptionDetailsId ? Number(form.subscriptionDetailsId) : null,
        }),
      });
      toast({ title: "Enrollment created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create enrollment."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="New Enrollment" description="Enroll a trainee in a group" onSubmit={handleSubmit} loading={loading} errors={errors}>
      <FormSelect id="traineeId" label="Trainee" value={form.traineeId} onChange={set("traineeId")} options={trainees} required placeholder="Select trainee" />
      <FormSelect id="traineeGroupId" label="Trainee Group" value={form.traineeGroupId} onChange={set("traineeGroupId")} options={groups} required placeholder="Select group" />
      <div className="grid grid-cols-2 gap-3">
        <FormDatePicker id="enrollmentDate" label="Enrollment Date" value={form.enrollmentDate} onChange={(d) => setForm((f) => ({ ...f, enrollmentDate: d }))} required />
        <FormDatePicker id="expiryDate" label="Expiry Date" value={form.expiryDate} onChange={(d) => setForm((f) => ({ ...f, expiryDate: d }))} required />
      </div>
      <FormInput id="sessionAllowed" label="Sessions Allowed" value={form.sessionAllowed} onChange={set("sessionAllowed")} type="number" min={1} required />
      <FormSelect id="subscriptionDetailsId" label="Subscription" value={form.subscriptionDetailsId} onChange={set("subscriptionDetailsId")} options={subscriptions} placeholder="Select subscription (optional)" />
    </BaseModal>
  );
}
