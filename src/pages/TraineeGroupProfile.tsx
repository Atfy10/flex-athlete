import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { TraineeGroupFormModal } from "@/components/modals/TraineeGroupFormModal";
import { useEffect, useState } from "react";
import { Users, MapPin, Trophy, Clock, Calendar, Layers } from "lucide-react";

interface GroupScheduleDto {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface TraineeGroupDetailDto {
  id: number;
  name: string;
  sport?: string;
  sportName?: string;
  coach?: string;
  coachName?: string;
  branch?: string;
  branchName?: string;
  level?: string;
  capacity?: number;
  enrolledCount?: number;
  status?: string;
  schedules?: GroupScheduleDto[];
  durationInMinutes?: number;
  startTime?: string;
  traineesCount?: number;
}

export default function TraineeGroupProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [group, setGroup] = useState<TraineeGroupDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchGroup = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<TraineeGroupDetailDto>>(`/api/trainee-group/${id}`);
      if (res.isSuccess && res.data) {
        setGroup(res.data);
      } else {
        setError(res.message || "Group not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load group.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/trainee-group/${id}`, { method: "DELETE" });
      toast({ title: "Group deleted successfully." });
      navigate("/trainee-groups");
    } catch {
      toast({ title: "Failed to delete group.", variant: "destructive" });
    }
  };

  const sportName = group?.sport ?? group?.sportName;
  const coachName = group?.coach ?? group?.coachName;
  const branchName = group?.branch ?? group?.branchName;
  const enrolled = group?.enrolledCount ?? group?.traineesCount;

  const sections: ProfileSection[] = group
    ? [
        {
          title: "Group Information",
          fields: [
            sportName ? { label: "Sport", value: sportName, icon: <Trophy className="h-3.5 w-3.5" /> } : null,
            coachName ? { label: "Coach", value: coachName, icon: <Users className="h-3.5 w-3.5" /> } : null,
            branchName ? { label: "Branch", value: branchName, icon: <MapPin className="h-3.5 w-3.5" /> } : null,
            group.level ? { label: "Level", value: group.level, icon: <Layers className="h-3.5 w-3.5" /> } : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Enrollment",
          fields: [
            group.capacity !== undefined
              ? { label: "Capacity", value: `${group.capacity} students`, icon: <Users className="h-3.5 w-3.5" /> }
              : null,
            enrolled !== undefined
              ? {
                  label: "Enrolled",
                  value: group.capacity !== undefined
                    ? (
                      <span>
                        {enrolled} / {group.capacity}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({Math.round((enrolled / group.capacity) * 100)}%)
                        </span>
                      </span>
                    )
                    : `${enrolled} trainees`,
                  icon: <Users className="h-3.5 w-3.5" />,
                }
              : null,
            group.durationInMinutes !== undefined
              ? { label: "Duration", value: `${group.durationInMinutes} min`, icon: <Clock className="h-3.5 w-3.5" /> }
              : null,
            group.startTime
              ? { label: "Start Time", value: group.startTime, icon: <Clock className="h-3.5 w-3.5" /> }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(group.schedules && group.schedules.length > 0
          ? [
              {
                title: "Weekly Schedule",
                fields: group.schedules.map((s) => ({
                  label: s.dayOfWeek,
                  value: `${s.startTime} – ${s.endTime}`,
                  icon: <Calendar className="h-3.5 w-3.5" />,
                })),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <ProfileViewLayout
        loading={loading}
        error={error}
        fullName={group?.name ?? ""}
        roleBadge={group?.level ?? "Group"}
        roleBadgeVariant="secondary"
        statusBadge={group?.status ?? "Active"}
        statusBadgeClass={
          group?.status === "Active" || !group?.status
            ? "bg-success/10 text-success"
            : group?.status === "Full"
            ? "bg-warning/10 text-warning"
            : "bg-muted text-muted-foreground"
        }
        sections={sections}
        backPath="/trainee-groups"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <TraineeGroupFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchGroup(); }}
          />
        }
      />
    </>
  );
}
