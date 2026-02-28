import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { CoachEditModal } from "@/components/modals/CoachEditModal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Star, Trophy, Users, Award, Calendar, Dumbbell } from "lucide-react";

interface CoachDetailDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  branchName: string;
  sportName: string;
  skillLevel: string;
  experience?: string;
  certifications?: string[];
  numberOfTrainees?: number;
  joinDate?: string;
  status: string;
  rating?: number;
}

export default function CoachProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [coach, setCoach] = useState<CoachDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchCoach = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<CoachDetailDto>>(`/api/coach/${id}`);
      if (res.isSuccess && res.data) {
        setCoach(res.data);
      } else {
        setError(res.message || "Coach not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load coach.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoach();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/coach/${id}`, { method: "DELETE" });
      toast({ title: "Coach removed successfully." });
      navigate("/coaches");
    } catch {
      toast({ title: "Failed to delete coach.", variant: "destructive" });
    }
  };

  const getSkillLevelClass = (level: string) => {
    switch (level?.toLowerCase()) {
      case "advanced": return "bg-success/10 text-success border-0";
      case "intermediate": return "bg-primary/10 text-primary border-0";
      default: return "bg-secondary/10 text-secondary border-0";
    }
  };

  const sections: ProfileSection[] = coach
    ? [
        {
          title: "Basic Information",
          fields: [
            { label: "Sport", value: coach.sportName, icon: <Trophy className="h-3.5 w-3.5" /> },
            {
              label: "Skill Level",
              value: (
                <Badge className={getSkillLevelClass(coach.skillLevel)}>
                  {coach.skillLevel}
                </Badge>
              ),
              icon: <Star className="h-3.5 w-3.5" />,
            },
            coach.experience
              ? { label: "Experience", value: coach.experience, icon: <Award className="h-3.5 w-3.5" /> }
              : null,
            coach.joinDate
              ? {
                  label: "Joined",
                  value: new Date(coach.joinDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  }),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Contact Information",
          fields: [
            { label: "Email", value: coach.email, icon: <Mail className="h-3.5 w-3.5" /> },
            { label: "Phone", value: coach.phoneNumber, icon: <Phone className="h-3.5 w-3.5" /> },
          ],
        },
        {
          title: "Organizational Info",
          fields: [
            { label: "Branch", value: coach.branchName, icon: <MapPin className="h-3.5 w-3.5" /> },
            coach.numberOfTrainees !== undefined
              ? {
                  label: "Trainees",
                  value: `${coach.numberOfTrainees} trainees`,
                  icon: <Users className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(coach.certifications && coach.certifications.length > 0
          ? [
              {
                title: "Certifications",
                fields: [
                  {
                    label: "Certificates",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {coach.certifications!.map((cert, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    ),
                    icon: <Dumbbell className="h-3.5 w-3.5" />,
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
        fullName={coach ? `${coach.firstName} ${coach.lastName}` : ""}
        roleBadge="Coach"
        roleBadgeVariant="default"
        statusBadge={coach?.status ?? ""}
        statusBadgeClass={
          coach?.status === "Active"
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning"
        }
        sections={sections}
        backPath="/coaches"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <CoachFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchCoach(); }}
          />
        }
      />
    </>
  );
}
