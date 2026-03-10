import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { FormDatePicker } from "./FormDatePicker";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { updateEnrollment } from "@/services/enrollment.services";
import { apiFetch } from "@/lib/api";
import { useFormDirty } from "@/hooks/useFormDirty";

export interface EnrollmentEditData {
  id: number;
  traineeName?: string;
  traineeEmail?: string;
  sport?: string;
  program?: string;
  expiryDate?: string;
  sessionAllowed?: number;
  subscriptionDetailsId?: number;
  status?: string;
  paymentStatus?: string;
}

interface EnrollmentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  enrollment: EnrollmentEditData | null;
}

export function EnrollmentEditModal({
  open,
  onOpenChange,
  onSuccess,
  enrollment,
}: EnrollmentEditModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({
    expiryDate: undefined as Date | undefined,
    sessionAllowed: "",
    subscriptionDetailsId: "",
  });

  useEffect(() => {
    if (!open || !enrollment) return;
    resetDirty();
    setErrors([]);
    // Initialise all fields from prop immediately
    setForm({
      expiryDate: enrollment.expiryDate ? parseISO(enrollment.expiryDate) : undefined,
      sessionAllowed: enrollment.sessionAllowed != null ? String(enrollment.sessionAllowed) : "",
      // subscriptionDetailsId resolved after options load to avoid blank select
      subscriptionDetailsId: "",
    });

    apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>(
      "/api/SubscriptionDetails/get-all",
    )
      .then((res) => {
        if (res.isSuccess) {
          setSubscriptions(res.data.map((s) => ({ value: String(s.id), label: s.name })));
          // Set value only after options are available so the select renders correctly
          if (enrollment.subscriptionDetailsId != null) {
            setForm((f) => ({ ...f, subscriptionDetailsId: String(enrollment.subscriptionDetailsId) }));
          }
        }
      })
      .catch(() => {});
  }, [open, enrollment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    setErrors([]);

    if (!form.sessionAllowed || Number(form.sessionAllowed) < 1) {
      setErrors(["Sessions allowed must be at least 1."]);
      return;
    }

    setLoading(true);
    try {
      const result = await updateEnrollment(enrollment.id, {
        expiryDate: form.expiryDate ? format(form.expiryDate, "yyyy-MM-dd") : null,
        sessionAllowed: form.sessionAllowed ? Number(form.sessionAllowed) : null,
        subscriptionDetailsId: form.subscriptionDetailsId
          ? Number(form.subscriptionDetailsId)
          : null,
      }) as { isSuccess: boolean; message?: string; statusCode: number };

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to update enrollment." });
      }

      toast({ title: "Enrollment updated successfully" });
      resetDirty();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to update enrollment."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Enrollment"
      description="Update enrollment details"
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
      submitLabel="Save Changes"
      isDirty={isDirty}
    >
      {/* Read-only summary */}
      <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Read-only
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Trainee</span>
          <span className="font-medium">{enrollment?.traineeName ?? "—"}</span>
          {enrollment?.sport && (
            <>
              <span className="text-muted-foreground">Sport</span>
              <span className="font-medium">{enrollment.sport}</span>
            </>
          )}
          {enrollment?.program && (
            <>
              <span className="text-muted-foreground">Program</span>
              <span className="font-medium">{enrollment.program}</span>
            </>
          )}
          {enrollment?.status && (
            <>
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{enrollment.status}</span>
            </>
          )}
          {enrollment?.paymentStatus && (
            <>
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">{enrollment.paymentStatus}</span>
            </>
          )}
        </div>
      </div>

      {/* Editable fields */}
      <FormDatePicker
        id="expiryDate"
        label="Expiry Date"
        value={form.expiryDate}
        onChange={(d) => { markDirty(); setForm((f) => ({ ...f, expiryDate: d })); }}
        minDate={new Date(new Date().setHours(0, 0, 0, 0) + 86400000)}
        maxDate={new Date(new Date().getFullYear() + 10, 11, 31)}
      />
      <FormInput
        id="sessionAllowed"
        label="Sessions Allowed"
        value={form.sessionAllowed}
        onChange={(v) => { markDirty(); setForm((f) => ({ ...f, sessionAllowed: v })); }}
        type="number"
        min={1}
      />
      <FormSelect
        id="subscriptionDetailsId"
        label="Subscription"
        value={form.subscriptionDetailsId}
        onChange={(v) => { markDirty(); setForm((f) => ({ ...f, subscriptionDetailsId: v })); }}
        options={subscriptions}
        placeholder="Keep current subscription"
      />
    </BaseModal>
  );
}
