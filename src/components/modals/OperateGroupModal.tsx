import { useState, useEffect, useCallback } from "react";
import { BaseModal } from "./BaseModal";
import { FormInput } from "./FormInput";
import { ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Trophy, MapPin, Clock, X } from "lucide-react";
import {
  listTraineeGroupsForPicker,
  searchTraineeGroupsForPicker,
  generateSessions,
} from "@/services/session.services";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";

interface OperateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function formatTime(t: string) {
  return t?.slice(0, 5) ?? "";
}

function GroupPickerRow({
  group,
  onSelect,
}: {
  group: ListTraineeGroupDto;
  onSelect: (g: ListTraineeGroupDto) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/60 hover:border-primary/40 transition-colors text-left group"
    >
      <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
        <Trophy className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {group.sportName}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {group.coachName}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {group.branchName}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(group.startTime)}
          </span>
        </div>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {group.traineesCount} trainees
      </Badge>
    </button>
  );
}

export function OperateGroupModal({
  open,
  onOpenChange,
  onSuccess,
}: OperateGroupModalProps) {
  const { toast } = useToast();

  // Form state
  const [durationInDays, setDurationInDays] = useState("30");
  const [selectedGroup, setSelectedGroup] = useState<ListTraineeGroupDto | null>(null);

  // Group picker state
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState<ListTraineeGroupDto[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Submission
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setDurationInDays("30");
    setSelectedGroup(null);
    setSearchTerm("");
    setErrors([]);
  }, [open]);

  // Fetch groups with debounce
  const fetchGroups = useCallback(async (term: string) => {
    setGroupsLoading(true);
    try {
      const res = term.trim().length >= 2
        ? await searchTraineeGroupsForPicker(term.trim(), 1, 20)
        : await listTraineeGroupsForPicker(1, 20);
      if (res.isSuccess) setGroups(res.data.items);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || selectedGroup) return;
    const t = setTimeout(() => fetchGroups(searchTerm), 300);
    return () => clearTimeout(t);
  }, [open, searchTerm, selectedGroup, fetchGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!selectedGroup) {
      setErrors(["Please select a Trainee Group."]);
      return;
    }
    const days = Number(durationInDays);
    if (!days || days < 1) {
      setErrors(["Duration must be at least 1 day."]);
      return;
    }

    setLoading(true);
    try {
      const res = await generateSessions({
        traineeGroupId: selectedGroup.id,
        durationInDays: days,
      });
      if (!res.isSuccess) throw new Error(res.message);
      toast({
        title: "Sessions generated",
        description: `${days}-day schedule created for "${selectedGroup.sportName}" (${selectedGroup.branchName}).`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors([(err as Error).message || "Failed to generate sessions."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Operate Group — Generate Sessions"
      description="Select a Trainee Group and specify how many days forward to generate session occurrences."
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
      submitLabel="Generate Sessions"
    >
      {/* ── Group Picker ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label>
          Trainee Group <span className="text-destructive">*</span>
        </Label>

        {selectedGroup ? (
          /* Selected state — show chip with clear button */
          <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/40 bg-primary/5">
            <Trophy className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{selectedGroup.sportName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedGroup.coachName} · {selectedGroup.branchName}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                setSelectedGroup(null);
                setSearchTerm("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          /* Search + list */
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sport, coach, or branch…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>

            <div className="max-h-[220px] overflow-y-auto rounded-lg border border-border space-y-1 p-1.5">
              {groupsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {searchTerm.length >= 2
                    ? "No groups match your search."
                    : "No trainee groups found."}
                </p>
              ) : (
                groups.map((g) => (
                  <GroupPickerRow key={g.id} group={g} onSelect={setSelectedGroup} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Duration ────────────────────────────────────────────────── */}
      <FormInput
        id="durationInDays"
        label="Duration (days)"
        value={durationInDays}
        onChange={setDurationInDays}
        type="number"
        min={1}
        required
      />

      {/* ── Info hint ────────────────────────────────────────────────── */}
      {selectedGroup && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Sessions will be generated for <strong>{selectedGroup.sportName}</strong> starting from today,
          following the group's weekly schedule for <strong>{durationInDays} days</strong>.
        </p>
      )}
    </BaseModal>
  );
}
