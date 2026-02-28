import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { FormSelect, SelectOption } from "./FormSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CoachEditData {
  id: number;
  firstName: string;
  lastName: string;
  sportName?: string;
  skillLevel?: string;
}

interface CoachEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  coach: CoachEditData | null;
}

export function CoachEditModal({ open, onOpenChange, onSuccess, coach }: CoachEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sports, setSports] = useState<SelectOption[]>([]);

  const [form, setForm] = useState({ sportId: "", skillLevel: "" });

  useEffect(() => {
    if (!open || !coach) return;
    setErrors([]);
    setForm({ sportId: "", skillLevel: coach.skillLevel ?? "" });
    apiFetch<{ data: { id: number; name: string }[]; isSuccess: boolean }>("/api/Sports/get-all")
      .then((res) => {
        if (res.isSuccess) setSports(res.data.map((s) => ({ value: String(s.id), label: s.name })));
      })
      .catch(() => {});
  }, [open, coach]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach) return;
    setErrors([]);
    setLoading(true);
    try {
      const result = await apiFetch(`/api/Coach/${coach.id}`, {
        method: "PUT",
        body: JSON.stringify({
          sportId: form.sportId ? Number(form.sportId) : undefined,
          skillLevel: form.skillLevel || undefined,
        }),
      }) as { isSuccess: boolean; message?: string; statusCode: number };

      if (!result.isSuccess) {
        throw new ApiError(result.statusCode, { message: result.message || "Failed to update coach." });
      }

      toast({ title: "Coach updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to update coach."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Coach"
      description="Update editable coach details"
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
          <span className="font-medium">{coach?.firstName} {coach?.lastName}</span>
          <span className="text-muted-foreground">Current Sport</span>
          <span className="font-medium">{coach?.sportName ?? "—"}</span>
        </div>
      </div>

      <FormSelect
        id="sportId"
        label="Change Sport"
        value={form.sportId}
        onChange={set("sportId")}
        options={sports}
        placeholder="Keep current sport"
      />
      <FormSelect
        id="skillLevel"
        label="Skill Level"
        value={form.skillLevel}
        onChange={set("skillLevel")}
        options={[
          { value: "Beginner", label: "Beginner" },
          { value: "Intermediate", label: "Intermediate" },
          { value: "Advanced", label: "Advanced" },
        ]}
      />
    </BaseModal>
  );
}
