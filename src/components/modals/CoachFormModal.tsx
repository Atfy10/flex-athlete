import { useState, useEffect, useCallback } from "react";
import { useFormDirty } from "@/hooks/useFormDirty";
import { BaseModal } from "./BaseModal";
import { FormSelect } from "./FormSelect";
import {
  SearchableSelect,
  SearchableOption,
} from "@/components/ui/SearchableSelect";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { searchEmployees } from "@/services/employees.service";
import { SportDropDownListDto } from "@/types/SportDropDownListDto";
import { searchSportsName } from "@/services/sport.services";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { ApiResult, PagedData } from "@/types/api";
import { createCoach } from "@/services/coaches.service";

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

export function CoachFormModal({
  open,
  onOpenChange,
  onSuccess,
}: CoachFormModalProps) {
  const { toast } = useToast();
  const { isDirty, markDirty, resetDirty } = useFormDirty();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [selectedEmployee, setSelectedEmployee] =
    useState<SearchableOption | null>(null);
  const [selectedSport, setSelectedSport] = useState<SearchableOption | null>(
    null,
  );
  const [skillLevel, setSkillLevel] = useState("");

  useEffect(() => {
    if (!open) return;
    resetDirty();
    setErrors([]);
    setSelectedEmployee(null);
    setSelectedSport(null);
    setSkillLevel("");
  }, [open]);

  const fetchEmployees = useCallback(
    async (query: string): Promise<SearchableOption[]> => {
      if (!query.trim()) return [];
      try {
        const res = await searchEmployees(query, 1, 10);
        const list = Array.isArray(res)
          ? res
          : ((res as ApiResult<PagedData<EmployeeCardDto>>)?.data.items ?? []);
        return list.map((e: EmployeeCardDto) => ({
          value: String(e.id),
          label: `${e.firstName} ${e.lastName}`,
          sublabel: e.email,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  const fetchSports = useCallback(
    async (query: string): Promise<SearchableOption[]> => {
      if (!query.trim()) return [];
      try {
        const res = await searchSportsName(query);
        const list = Array.isArray(res)
          ? res
          : ((res as ApiResult<SportDropDownListDto[]>)?.data ?? []);
        return list.map((s: SportDropDownListDto) => ({
          value: String(s.id),
          label: s.name,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const errs: string[] = [];
    if (!selectedEmployee) errs.push("Please select an employee.");
    if (!selectedSport) errs.push("Please select a sport.");
    if (!skillLevel) errs.push("Please select a skill level.");
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await createCoach({
        employeeId: Number(selectedEmployee!.value),
        sportId: Number(selectedSport!.value),
        skillLevel,
      });

      toast({ title: res.message || "Coach created successfully" });
      resetDirty();
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
      isDirty={isDirty}
    >
      <SearchableSelect
        id="employeeId"
        label="Employee"
        placeholder="Search employee by name or email..."
        value={selectedEmployee}
        onChange={(v) => { markDirty(); setSelectedEmployee(v); }}
        onSearch={fetchEmployees}
        required
      />

      <SearchableSelect
        id="sportId"
        label="Sport"
        placeholder="Search sport by name..."
        value={selectedSport}
        onChange={(v) => { markDirty(); setSelectedSport(v); }}
        onSearch={fetchSports}
        required
      />

      <FormSelect
        id="skillLevel"
        label="Skill Level"
        value={skillLevel}
        onChange={(v) => { markDirty(); setSkillLevel(v); }}
        required
        options={SKILL_LEVELS}
        placeholder="Select skill level"
      />
    </BaseModal>
  );
}
