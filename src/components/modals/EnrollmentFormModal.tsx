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

// ─── Validation schema ────────────────────────────────────────────────────────
const enrollmentSchema = z
  .object({
    traineeId: z.string().min(1, "Trainee is required"),
    traineeGroupId: z.string().min(1, "Trainee group is required"),
    enrollmentDate: z.date({ required_error: "Enrollment date is required" }),
    expiryDate: z.date({ required_error: "Expiry date is required" }),
    sessionAllowed: z
      .string()
      .refine((v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 1, {
        message: "Sessions allowed must be a whole number ≥ 1",
      }),
    subscriptionDetailsId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) => !d.expiryDate || !d.enrollmentDate || d.expiryDate > d.enrollmentDate,
    { message: "Expiry date must be after enrollment date.", path: ["expiryDate"] },
  );

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;
type FieldErrors = Partial<Record<keyof EnrollmentFormValues, string>>;

interface EnrollmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnrollmentFormModal({ open, onOpenChange, onSuccess }: EnrollmentFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [trainees, setTrainees] = useState<SelectOption[]>([]);
  const [traineesLoading, setTraineesLoading] = useState(false);
  const [groups, setGroups] = useState<SelectOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);

  const [form, setForm] = useState({
    enrollmentDate: new Date() as Date | undefined,
    expiryDate: undefined as Date | undefined,
    sessionAllowed: "",
    traineeId: "",
    traineeGroupId: "",
    subscriptionDetailsId: "",
  });

  useEffect(() => {
    if (!open) return;
    setApiErrors([]);
    setFieldErrors({});
    setForm({
      enrollmentDate: new Date(), expiryDate: undefined,
      sessionAllowed: "", traineeId: "", traineeGroupId: "",
      subscriptionDetailsId: "",
    });

    setTraineesLoading(true);
    setGroupsLoading(true);
    setSubscriptionsLoading(true);

    Promise.allSettled([
      apiFetch<{ data: { id: number; firstName: string; lastName: string }[]; isSuccess: boolean }>("/api/Trainee/get-all"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/TraineeGroup/get-all-dropdown"),
      apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/SubscriptionDetails/get-all"),
    ]).then(([tRes, gRes, sRes]) => {
      if (tRes.status === "fulfilled" && tRes.value.isSuccess)
        setTrainees(tRes.value.data.map((t) => ({ value: String(t.id), label: `${t.firstName} ${t.lastName}` })));
      if (gRes.status === "fulfilled" && gRes.value.isSuccess)
        setGroups(gRes.value.data.map((g) => ({ value: String(g.id), label: g.name })));
      if (sRes.status === "fulfilled" && sRes.value.isSuccess)
        setSubscriptions(sRes.value.data.map((s) => ({ value: String(s.id), label: s.name })));
    }).finally(() => {
      setTraineesLoading(false);
      setGroupsLoading(false);
      setSubscriptionsLoading(false);
    });
  }, [open]);

  const set = (key: keyof typeof form) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors([]);
    setFieldErrors({});

    const parsed = enrollmentSchema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof EnrollmentFormValues;
        if (!fe[key]) fe[key] = issue.message;
      }
      setFieldErrors(fe);
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
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to create enrollment."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open} onOpenChange={onOpenChange}
      title="New Enrollment"
      description="Enroll a trainee in a group. Fields marked with * are required."
      onSubmit={handleSubmit} loading={loading} errors={apiErrors}
    >
      <FormSelect
        id="traineeId" label="Trainee"
        value={form.traineeId} onChange={(v) => { set("traineeId")(v); }}
        options={trainees} required
        placeholder="Select trainee"
        loading={traineesLoading}
        emptyMessage="No trainees available"
        error={fieldErrors.traineeId}
      />
      <FormSelect
        id="traineeGroupId" label="Trainee Group"
        value={form.traineeGroupId} onChange={(v) => { set("traineeGroupId")(v); }}
        options={groups} required
        placeholder="Select group"
        loading={groupsLoading}
        emptyMessage="No groups available"
        error={fieldErrors.traineeGroupId}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormDatePicker
          id="enrollmentDate" label="Enrollment Date"
          value={form.enrollmentDate}
          onChange={(d) => {
            setForm((f) => ({ ...f, enrollmentDate: d }));
            setFieldErrors((fe) => ({ ...fe, enrollmentDate: undefined }));
          }}
          required error={fieldErrors.enrollmentDate}
        />
        <FormDatePicker
          id="expiryDate" label="Expiry Date"
          value={form.expiryDate}
          onChange={(d) => {
            setForm((f) => ({ ...f, expiryDate: d }));
            setFieldErrors((fe) => ({ ...fe, expiryDate: undefined }));
          }}
          required error={fieldErrors.expiryDate}
        />
      </div>

      <FormInput
        id="sessionAllowed" label="Sessions Allowed"
        value={form.sessionAllowed} onChange={set("sessionAllowed")}
        type="number" min={1} required
        placeholder="e.g. 24"
        hint="Total number of sessions the trainee may attend"
        error={fieldErrors.sessionAllowed}
      />

      <FormSelect
        id="subscriptionDetailsId" label="Subscription (optional)"
        value={form.subscriptionDetailsId} onChange={set("subscriptionDetailsId")}
        options={subscriptions}
        placeholder="No subscription"
        loading={subscriptionsLoading}
      />
    </BaseModal>
  );
}
