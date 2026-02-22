import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface GenerateSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  traineeGroupId?: number;
  groupName?: string;
  schedules?: { id: number; dayOfWeek: string; startTime: string; endTime: string }[];
}

export function GenerateSessionsModal({
  open,
  onOpenChange,
  onSuccess,
  traineeGroupId,
  groupName,
  schedules = [],
}: GenerateSessionsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({ durationInDays: "30", groupScheduleId: "" });

  const scheduleOptions: SelectOption[] = schedules.map((s) => ({
    value: String(s.id),
    label: `${s.dayOfWeek} ${s.startTime} - ${s.endTime}`,
  }));

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setForm({ durationInDays: "30", groupScheduleId: "" });
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await apiFetch("/api/SessionOccurrence/generate", {
        method: "POST",
        body: JSON.stringify({
          traineeGroupId,
          durationInDays: Number(form.durationInDays),
          groupScheduleId: form.groupScheduleId ? Number(form.groupScheduleId) : null,
        }),
      });
      toast({ title: "Sessions generated", description: `Sessions generated for "${groupName}"` });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to generate sessions."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} title="Generate Sessions" description={`Generate session occurrences for "${groupName}"`} onSubmit={handleSubmit} loading={loading} errors={errors} submitLabel="Generate">
      <FormInput id="durationInDays" label="Duration (days)" value={form.durationInDays} onChange={(v) => setForm((f) => ({ ...f, durationInDays: v }))} type="number" min={1} />
      {scheduleOptions.length > 0 && (
        <FormSelect id="groupScheduleId" label="Schedule (optional)" value={form.groupScheduleId} onChange={(v) => setForm((f) => ({ ...f, groupScheduleId: v }))} options={scheduleOptions} placeholder="All schedules" />
      )}
    </BaseModal>
  );
}
