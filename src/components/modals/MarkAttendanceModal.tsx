import { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Clock, XCircle, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAttendanceBySession, bulkMarkAttendance } from "@/services/attendance.services";
import { AttendanceRecordDto, AttendanceStatus, MarkAttendanceCommand } from "@/types/AttendanceDto";

interface MarkAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  sessionOccurrenceId?: number;
  sessionLabel?: string;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "Present", label: "Present", color: "bg-success/10 text-success border-success/30 hover:bg-success/20", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  { value: "Late",    label: "Late",    color: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",   icon: <Clock className="h-3.5 w-3.5" /> },
  { value: "Absent",  label: "Absent",  color: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20", icon: <XCircle className="h-3.5 w-3.5" /> },
  { value: "Excused", label: "Excused", color: "bg-muted text-muted-foreground border-border hover:bg-muted/80",       icon: <Clock className="h-3.5 w-3.5" /> },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function MarkAttendanceModal({
  open,
  onOpenChange,
  onSuccess,
  sessionOccurrenceId,
  sessionLabel,
}: MarkAttendanceModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});

  // Load roster when modal opens
  useEffect(() => {
    if (!open || !sessionOccurrenceId) return;
    setErrors([]);
    setRecords([]);
    setStatuses({});
    setFetchLoading(true);

    getAttendanceBySession(sessionOccurrenceId)
      .then((res) => {
        if (res.isSuccess) {
          setRecords(res.data);
          const initial: Record<number, AttendanceStatus> = {};
          res.data.forEach((r) => { initial[r.traineeId] = r.status; });
          setStatuses(initial);
        } else {
          setErrors(["Failed to load attendance roster."]);
        }
      })
      .catch(() => setErrors(["Network error loading roster."]))
      .finally(() => setFetchLoading(false));
  }, [open, sessionOccurrenceId]);

  const markAll = (status: AttendanceStatus) => {
    const next: Record<number, AttendanceStatus> = {};
    records.forEach((r) => { next[r.traineeId] = status; });
    setStatuses(next);
  };

  const toggle = (traineeId: number, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [traineeId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionOccurrenceId) return;
    setErrors([]);
    setLoading(true);
    try {
      const commands: MarkAttendanceCommand[] = records.map((r) => ({
        sessionOccurrenceId,
        traineeId: r.traineeId,
        status: statuses[r.traineeId] ?? "Absent",
      }));
      const res = await bulkMarkAttendance(commands);
      if (!res.isSuccess) {
        setErrors([res.message || "Failed to mark attendance."]);
        return;
      }
      toast({ title: "Attendance saved", description: `${commands.length} trainees updated.` });
      onSuccess();
      onOpenChange(false);
    } catch {
      setErrors(["Failed to submit attendance."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Mark Attendance"
      description={sessionLabel ? `Session: ${sessionLabel}` : "Mark presence for each trainee"}
      onSubmit={handleSubmit}
      loading={loading}
      errors={errors}
      submitLabel="Save Attendance"
    >
      {fetchLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
          Loading roster…
        </div>
      ) : records.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
          No enrolled trainees found for this session.
        </div>
      ) : (
        <>
          {/* Bulk actions */}
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <span className="text-xs text-muted-foreground font-medium mr-1">Mark all as:</span>
            {STATUS_OPTIONS.map((s) => (
              <Button key={s.value} variant="outline" size="sm" className={`h-7 text-xs gap-1 ${s.color}`} type="button" onClick={() => markAll(s.value)}>
                <CheckCheck className="h-3 w-3" />
                {s.label}
              </Button>
            ))}
          </div>

          {/* Roster */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {records.map((record) => {
              const currentStatus = statuses[record.traineeId] ?? "Absent";
              return (
                <div key={record.traineeId} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(record.traineeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{record.traineeName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggle(record.traineeId, s.value)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                          currentStatus === s.value
                            ? `${s.color} ring-2 ring-offset-1 ring-current`
                            : "border-border text-muted-foreground hover:bg-muted/60"
                        }`}
                      >
                        {s.icon}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
            {STATUS_OPTIONS.map((s) => {
              const count = Object.values(statuses).filter((v) => v === s.value).length;
              return count > 0 ? (
                <Badge key={s.value} className={`${s.color} gap-1`}>
                  {s.icon}{count} {s.label}
                </Badge>
              ) : null;
            })}
          </div>
        </>
      )}
    </BaseModal>
  );
}
