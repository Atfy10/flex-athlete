import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SportEditModal } from "@/components/modals/SportEditModal";
import { AddSkillLevelModal } from "@/components/modals/AddSkillLevelModal";
import { useEffect, useState } from "react";
import { Trophy, Users, Clock, DollarSign, Star, MapPin, Tag, Target } from "lucide-react";

interface SportDetailDto {
  id: number;
  name: string;
  category?: string;
  description?: string;
  status?: string;
  duration?: string;
  maxParticipants?: number;
  currentEnrollment?: number;
  monthlyFee?: number;
  coaches?: number;
  skillLevel?: string[];
  ageGroups?: string[];
  branches?: string[];
  isRequireHealthTest?: boolean;
}

export default function SportProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sport, setSport] = useState<SportDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchSport = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<SportDetailDto>>(`/api/sport/${id}`);
      if (res.isSuccess && res.data) {
        setSport(res.data);
      } else {
        setError(res.message || "Sport not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load sport.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSport();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/sport/${id}`, { method: "DELETE" });
      toast({ title: "Sport deleted successfully." });
      navigate("/sports");
    } catch {
      toast({ title: "Failed to delete sport.", variant: "destructive" });
    }
  };

  const sections: ProfileSection[] = sport
    ? [
        {
          title: "Overview",
          fields: [
            sport.category ? { label: "Category", value: sport.category, icon: <Tag className="h-3.5 w-3.5" /> } : null,
            sport.description ? { label: "Description", value: sport.description, icon: <Trophy className="h-3.5 w-3.5" /> } : null,
            sport.isRequireHealthTest !== undefined
              ? {
                  label: "Health Test Required",
                  value: (
                    <Badge variant={sport.isRequireHealthTest ? "destructive" : "secondary"} className="text-xs">
                      {sport.isRequireHealthTest ? "Yes" : "No"}
                    </Badge>
                  ),
                  icon: <Target className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Program Info",
          fields: [
            sport.duration ? { label: "Session Duration", value: sport.duration, icon: <Clock className="h-3.5 w-3.5" /> } : null,
            sport.maxParticipants !== undefined ? { label: "Max Participants", value: `${sport.maxParticipants} per session`, icon: <Users className="h-3.5 w-3.5" /> } : null,
            sport.currentEnrollment !== undefined ? { label: "Enrolled", value: `${sport.currentEnrollment} trainees`, icon: <Users className="h-3.5 w-3.5" /> } : null,
            sport.monthlyFee !== undefined ? { label: "Monthly Fee", value: `$${sport.monthlyFee}`, icon: <DollarSign className="h-3.5 w-3.5" /> } : null,
            sport.coaches !== undefined ? { label: "Coaches Assigned", value: `${sport.coaches}`, icon: <Star className="h-3.5 w-3.5" /> } : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(sport.skillLevel && sport.skillLevel.length > 0
          ? [
              {
                title: "Skill Levels",
                fields: [
                  {
                    label: "Available Levels",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {sport.skillLevel!.map((level, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{level}</Badge>
                        ))}
                      </div>
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(sport.ageGroups && sport.ageGroups.length > 0
          ? [
              {
                title: "Age Groups",
                fields: [
                  {
                    label: "Accepts",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {sport.ageGroups!.map((age, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{age} years</Badge>
                        ))}
                      </div>
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(sport.branches && sport.branches.length > 0
          ? [
              {
                title: "Available At",
                fields: [
                  {
                    label: "Branches",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {sport.branches!.map((b, i) => (
                          <Badge key={i} className="text-xs bg-primary/10 text-primary">{b}</Badge>
                        ))}
                      </div>
                    ),
                    icon: <MapPin className="h-3.5 w-3.5" />,
                  },
                ],
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
        fullName={sport?.name ?? ""}
        roleBadge={sport?.category ?? "Sport"}
        roleBadgeVariant="secondary"
        statusBadge={sport?.status ?? "Active"}
        statusBadgeClass={
          sport?.status === "Active" || !sport?.status
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }
        sections={sections}
        backPath="/sports"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <SportsFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchSport(); }}
          />
        }
      />
    </>
  );
}
