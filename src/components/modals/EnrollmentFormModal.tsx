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
import { suggestSessionsAllowed } from "@/lib/enrollmentUtils";
import { Sparkles, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

/** Shape returned by the group detail / schedule endpoint */
interface GroupScheduleDto {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface EnrollmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnrollmentFormModal({ open, onOpenChange, onSuccess }: EnrollmentFormModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [trainees, setTrainees] = useState<SelectOption[]>([]);
  const [traineesLoading, setTraineesLoading] = useState(false);
  const [groups, setGroups] = useState<SelectOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);

  // Weekly frequency derived from the selected group's schedules
  const [weeklyFrequency, setWeeklyFrequency] = useState<number | null>(null);
  const [frequencyLoading, setFrequencyLoading] = useState(false);
  // Tracks whether the user has manually edited sessionsAllowed
  const [userOverrode, setUserOverrode] = useState(false);

  const [form, setForm] = useState({
    enrollmentDate: new Date() as Date | undefined,
    expiryDate: undefined as Date | undefined,
    sessionAllowed: "",
    traineeId: "",
    traineeGroupId: "",
    subscriptionDetailsId: "",
  });

  // ── Load dropdown data on open ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    resetDirty();
    setApiErrors([]);
    setFieldErrors({});
    setWeeklyFrequency(null);
    setUserOverrode(false);
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

  // ── Fetch group schedules when group changes ──────────────────────────────
  useEffect(() => {
    if (!form.traineeGroupId) {
      setWeeklyFrequency(null);
      return;
    }
    setFrequencyLoading(true);
    apiFetch<{ data: { schedules?: GroupScheduleDto[] }; isSuccess: boolean }>(
      `/api/TraineeGroup/${form.traineeGroupId}`,
    )
      .then((res) => {
        if (res.isSuccess && res.data?.schedules) {
          setWeeklyFrequency(res.data.schedules.length);
        } else {
          // Fallback: assume 1 session/week if no schedule data is returned
          setWeeklyFrequency(null);
        }
      })
      .catch(() => setWeeklyFrequency(null))
      .finally(() => setFrequencyLoading(false));
  }, [form.traineeGroupId]);

  // ── Auto-suggest sessionsAllowed ──────────────────────────────────────────
  const suggested = suggestSessionsAllowed(form.enrollmentDate, form.expiryDate, weeklyFrequency);

  // Apply suggestion automatically when not overridden by user
  useEffect(() => {
    if (userOverrode) return;
    if (suggested !== null) {
      setForm((f) => ({ ...f, sessionAllowed: String(suggested) }));
    }
  }, [suggested, userOverrode]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = (key: keyof typeof form) => (val: string) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const applysuggested = () => {
    if (suggested === null) return;
    setUserOverrode(false);
    setForm((f) => ({ ...f, sessionAllowed: String(suggested) }));
    setFieldErrors((fe) => ({ ...fe, sessionAllowed: undefined }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
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
      resetDirty();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setApiErrors(err.getValidationErrors());
      else setApiErrors(["Failed to create enrollment."]);
    } finally {
      setLoading(false);
    }
  };

  // Whether we can show a suggestion at all
  const showSuggestion = suggested !== null && !frequencyLoading;
  const isOverridden = userOverrode && showSuggestion && form.sessionAllowed !== String(suggested);

  return (
    <BaseModal
      open={open} onOpenChange={onOpenChange}
      title="New Enrollment"
      description="Enroll a trainee in a group. Fields marked with * are required."
      onSubmit={handleSubmit} loading={loading} errors={apiErrors}
      isDirty={isDirty}
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
        value={form.traineeGroupId} onChange={(v) => {
          markDirty();
          setUserOverrode(false);
          setForm((f) => ({ ...f, traineeGroupId: v, sessionAllowed: "" }));
          setFieldErrors((fe) => ({ ...fe, traineeGroupId: undefined }));
        }}
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
            markDirty();
            setUserOverrode(false);
            setForm((f) => ({ ...f, enrollmentDate: d }));
            setFieldErrors((fe) => ({ ...fe, enrollmentDate: undefined }));
          }}
          required error={fieldErrors.enrollmentDate}
        />
        <FormDatePicker
          id="expiryDate" label="Expiry Date"
          value={form.expiryDate}
          onChange={(d) => {
            markDirty();
            setUserOverrode(false);
            setForm((f) => ({ ...f, expiryDate: d }));
            setFieldErrors((fe) => ({ ...fe, expiryDate: undefined }));
          }}
          required error={fieldErrors.expiryDate}
        />
      </div>

      {/* Sessions Allowed with auto-suggest */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">
            Sessions Allowed <span className="text-destructive ml-1" aria-hidden>*</span>
          </span>
          {showSuggestion && (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="gap-1 text-xs font-normal bg-primary/10 text-primary border-primary/20"
              >
                <Sparkles className="h-3 w-3" />
                Suggested: {suggested}
                {weeklyFrequency && (
                  <span className="text-primary/70">
                    &nbsp;({weeklyFrequency}×/wk)
                  </span>
                )}
              </Badge>
              {isOverridden && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-xs text-muted-foreground hover:text-primary"
                  onClick={applysuggested}
                  title="Reset to suggested value"
                >
                  <RotateCcw className="h-3 w-3 mr-0.5" />
                  Reset
                </Button>
              )}
            </div>
          )}
          {frequencyLoading && form.traineeGroupId && (
            <span className="text-xs text-muted-foreground animate-pulse">Calculating…</span>
          )}
        </div>
        <FormInput
          id="sessionAllowed" label=""
          value={form.sessionAllowed}
          onChange={(v) => {
            setUserOverrode(true);
            set("sessionAllowed")(v);
          }}
          type="number" min={1} required
          placeholder={showSuggestion ? `Suggested: ${suggested}` : "e.g. 24"}
          hint={
            !showSuggestion
              ? "Select group, enrollment & expiry dates to auto-calculate"
              : undefined
          }
          error={fieldErrors.sessionAllowed}
        />
      </div>

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
