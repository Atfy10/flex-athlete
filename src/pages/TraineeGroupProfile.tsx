import { useParams, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { TraineeGroupFormModal } from "@/components/modals/TraineeGroupFormModal";
import { useEffect, useState } from "react";
import { Users, MapPin, Trophy, Clock, Layers, Shield } from "lucide-react";
import {
  getTraineeGroupById,
  deleteTraineeGroup,
  TraineeGroupDetailDto,
} from "@/services/traineeGroup.services";

const LEVEL_COLOR: Record<string, string> = {
  Beginner: "bg-secondary/10 text-secondary",
  Intermediate: "bg-primary/10 text-primary",
  Advanced: "bg-success/10 text-success",
  Mixed: "bg-warning/10 text-warning",
};

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
      const res = await getTraineeGroupById(id);
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
      await deleteTraineeGroup(id!);
      toast({ title: "Group deleted successfully." });
      navigate("/trainee-groups");
    } catch {
      toast({ title: "Failed to delete group.", variant: "destructive" });
    }
  };

  const sections: ProfileSection[] = group
    ? [
        {
          title: "Group Information",
          fields: [
            { label: "Sport",    value: group.sportName,  icon: <Trophy className="h-3.5 w-3.5" /> },
            { label: "Coach",    value: group.coachName,  icon: <Users className="h-3.5 w-3.5" /> },
            { label: "Branch",   value: group.branchName, icon: <MapPin className="h-3.5 w-3.5" /> },
            { label: "Gender",   value: group.gender,     icon: <Shield className="h-3.5 w-3.5" /> },
            group.skillLevel
              ? { label: "Skill Level", value: group.skillLevel, icon: <Layers className="h-3.5 w-3.5" /> }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Session Details",
          fields: [
            {
              label: "Max Capacity",
              value: `${group.maximumCapacity} trainees`,
              icon: <Users className="h-3.5 w-3.5" />,
            },
            {
              label: "Enrolled",
              value: (
                <span>
                  {group.traineesCount} / {group.maximumCapacity}
                  {group.maximumCapacity > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({Math.round((group.traineesCount / group.maximumCapacity) * 100)}%)
                    </span>
                  )}
                </span>
              ),
              icon: <Users className="h-3.5 w-3.5" />,
            },
            {
              label: "Duration",
              value: `${group.durationInMinutes} min`,
              icon: <Clock className="h-3.5 w-3.5" />,
            },
            group.startTime
              ? {
                  label: "Start Time",
                  value: group.startTime.slice(0, 5),
                  icon: <Clock className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
      ]
    : [];

  return (
    <>
      <ProfileViewLayout
        loading={loading}
        error={error}
        fullName={group ? `${group.sportName} — ${group.branchName}` : ""}
        roleBadge={group?.skillLevel ?? "Group"}
        roleBadgeVariant="secondary"
        statusBadge={group ? (group.traineesCount >= group.maximumCapacity ? "Full" : "Active") : ""}
        statusBadgeClass={
          group && group.traineesCount >= group.maximumCapacity
            ? "bg-warning/10 text-warning"
            : "bg-success/10 text-success"
        }
        sections={sections}
        backPath="/trainee-groups"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <TraineeGroupFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => {
              setEditOpen(false);
              fetchGroup();
            }}
          />
        }
      />
    </>
  );
}
