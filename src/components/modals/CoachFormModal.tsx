import { useState, useEffect, useCallback } from "react";
import { BaseModal } from "./BaseModal";
import { FormSelect } from "./FormSelect";
import { SearchableSelect, SearchableOption } from "@/components/ui/SearchableSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CoachFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SKILL_LEVELS = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Professional", label: "Professional" },
];

export function CoachFormModal({ open, onOpenChange, onSuccess }: CoachFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<SearchableOption | null>(null);
  const [selectedSport, setSelectedSport] = useState<SearchableOption | null>(null);
  const [skillLevel, setSkillLevel] = useState("");

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    setSelectedEmployee(null);
    setSelectedSport(null);
    setSkillLevel("");
  }, [open]);

  const searchEmployees = useCallback(async (query: string): Promise<SearchableOption[]> => {
    if (!query.trim()) return [];
    try {
      const res = await apiFetch<{ id: number; firstName: string; lastName: string; email: string }[]>(
        `/api/employee/search?query=${encodeURIComponent(query)}`
      );
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return list.map((e: any) => ({
        value: String(e.id),
        label: `${e.firstName} ${e.lastName}`,
        sublabel: e.email,
      }));
    } catch {
      return [];
    }
  }, []);

  const searchSports = useCallback(async (query: string): Promise<SearchableOption[]> => {
    if (!query.trim()) return [];
    try {
      const res = await apiFetch<{ id: number; name: string }[]>(
        `/api/sports/search?query=${encodeURIComponent(query)}`
      );
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return list.map((s: any) => ({
        value: String(s.id),
        label: s.name,
      }));
    } catch {
      return [];
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const errs: string[] = [];
    if (!selectedEmployee) errs.push("Please select an employee.");
    if (!selectedSport) errs.push("Please select a sport.");
    if (!skillLevel) errs.push("Please select a skill level.");
    if (errs.length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await apiFetch("/api/coaches", {
        method: "POST",
        body: JSON.stringify({
          employeeId: Number(selectedEmployee!.value),
          sportId: Number(selectedSport!.value),
          skillLevel,
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
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Coach"
      description="Assign an employee as a coach for a sport"
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
    >
      <SearchableSelect
        id="employeeId"
        label="Employee"
        placeholder="Search employee by name or email..."
        value={selectedEmployee}
        onChange={setSelectedEmployee}
        onSearch={searchEmployees}
        required
      />

      <SearchableSelect
        id="sportId"
        label="Sport"
        placeholder="Search sport by name..."
        value={selectedSport}
        onChange={setSelectedSport}
        onSearch={searchSports}
        required
      />

      <FormSelect
        id="skillLevel"
        label="Skill Level"
        value={skillLevel}
        onChange={setSkillLevel}
        required
        options={SKILL_LEVELS}
        placeholder="Select skill level"
      />
    </BaseModal>
  );
}
