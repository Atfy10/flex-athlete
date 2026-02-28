import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { TraineeEditModal } from "@/components/modals/TraineeEditModal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Calendar, Users, Shield, TrendingUp } from "lucide-react";

interface TraineeDetailDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  parentNumber?: string;
  guardianName?: string;
  branchName: string;
  birthDate?: string;
  gender?: string;
  sports?: string[];
  status: string;
  attendanceRate?: number;
  enrollmentCount?: number;
  joinDate?: string;
}

export default function TraineeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trainee, setTrainee] = useState<TraineeDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchTrainee = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<TraineeDetailDto>>(`/api/trainee/${id}`);
      if (res.isSuccess && res.data) {
        setTrainee(res.data);
      } else {
        setError(res.message || "Trainee not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load trainee.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainee();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/trainee/${id}`, { method: "DELETE" });
      toast({ title: "Trainee removed successfully." });
      navigate("/trainees");
    } catch {
      toast({ title: "Failed to delete trainee.", variant: "destructive" });
    }
  };

  const sections: ProfileSection[] = trainee
    ? [
        {
          title: "Basic Information",
          fields: [
            trainee.gender
              ? { label: "Gender", value: trainee.gender, icon: <Users className="h-3.5 w-3.5" /> }
              : null,
            trainee.birthDate
              ? {
                  label: "Birth Date",
                  value: new Date(trainee.birthDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  }),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
            trainee.joinDate
              ? {
                  label: "Joined",
                  value: new Date(trainee.joinDate).toLocaleDateString("en-US", {
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
            trainee.email
              ? { label: "Email", value: trainee.email, icon: <Mail className="h-3.5 w-3.5" /> }
              : null,
            trainee.phoneNumber
              ? { label: "Phone", value: trainee.phoneNumber, icon: <Phone className="h-3.5 w-3.5" /> }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Guardian Info",
          fields: [
            trainee.guardianName
              ? { label: "Guardian", value: trainee.guardianName, icon: <Shield className="h-3.5 w-3.5" /> }
              : null,
            trainee.parentNumber
              ? { label: "Parent Number", value: trainee.parentNumber, icon: <Phone className="h-3.5 w-3.5" /> }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Academy Info",
          fields: [
            { label: "Branch", value: trainee.branchName, icon: <MapPin className="h-3.5 w-3.5" /> },
            ...(trainee.sports && trainee.sports.length > 0
              ? [
                  {
                    label: "Sports",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {trainee.sports.map((sport, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    ),
                  },
                ]
              : []),
            trainee.attendanceRate !== undefined
              ? {
                  label: "Attendance Rate",
                  value: (
                    <div className="flex items-center gap-2">
                      <span>{trainee.attendanceRate}%</span>
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${trainee.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  ),
                  icon: <TrendingUp className="h-3.5 w-3.5" />,
                }
              : null,
            trainee.enrollmentCount !== undefined
              ? { label: "Enrollments", value: `${trainee.enrollmentCount} active`, icon: <Users className="h-3.5 w-3.5" /> }
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
        fullName={trainee ? `${trainee.firstName} ${trainee.lastName}` : ""}
        roleBadge="Trainee"
        roleBadgeVariant="outline"
        statusBadge={trainee?.status ?? ""}
        statusBadgeClass={
          trainee?.status === "Active"
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning"
        }
        sections={sections}
        backPath="/trainees"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <TraineeEditModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchTrainee(); }}
            trainee={trainee ? {
              id: trainee.id,
              firstName: trainee.firstName,
              lastName: trainee.lastName,
              parentNumber: trainee.parentNumber,
              guardianName: trainee.guardianName,
              branchName: trainee.branchName,
              sports: trainee.sports,
            } : null}
          />
        }
      />
    </>
  );
}
