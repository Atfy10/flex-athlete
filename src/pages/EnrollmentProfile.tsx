import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EnrollmentFormModal } from "@/components/modals/EnrollmentFormModal";
import { useEffect, useState } from "react";
import { User, Trophy, MapPin, Users, Calendar, DollarSign, TrendingUp, CheckCircle } from "lucide-react";

interface EnrollmentDetailDto {
  id: number;
  traineeName?: string;
  traineeEmail?: string;
  sport?: string;
  program?: string;
  branch?: string;
  coach?: string;
  enrollmentDate?: string;
  startDate?: string;
  endDate?: string;
  monthlyFee?: number;
  paymentStatus?: string;
  status?: string;
  sessionsCompleted?: number;
  totalSessions?: number;
}

export default function EnrollmentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [enrollment, setEnrollment] = useState<EnrollmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchEnrollment = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<EnrollmentDetailDto>>(`/api/enrollment/${id}`);
      if (res.isSuccess && res.data) {
        setEnrollment(res.data);
      } else {
        setError(res.message || "Enrollment not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load enrollment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollment();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/enrollment/${id}`, { method: "DELETE" });
      toast({ title: "Enrollment removed successfully." });
      navigate("/enrollments");
    } catch {
      toast({ title: "Failed to delete enrollment.", variant: "destructive" });
    }
  };

  const getPaymentBadgeClass = (status?: string) => {
    switch (status) {
      case "Paid": return "bg-success/10 text-success border-0";
      case "Pending": return "bg-warning/10 text-warning border-0";
      case "Overdue": return "bg-destructive/10 text-destructive border-0";
      default: return "bg-muted text-muted-foreground border-0";
    }
  };

  const progress =
    enrollment?.sessionsCompleted !== undefined && enrollment?.totalSessions !== undefined
      ? Math.round((enrollment.sessionsCompleted / enrollment.totalSessions) * 100)
      : null;

  const sections: ProfileSection[] = enrollment
    ? [
        {
          title: "Trainee",
          fields: [
            enrollment.traineeName ? { label: "Name", value: enrollment.traineeName, icon: <User className="h-3.5 w-3.5" /> } : null,
            enrollment.traineeEmail ? { label: "Email", value: enrollment.traineeEmail, icon: <User className="h-3.5 w-3.5" /> } : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Program Details",
          fields: [
            enrollment.sport ? { label: "Sport", value: enrollment.sport, icon: <Trophy className="h-3.5 w-3.5" /> } : null,
            enrollment.program ? { label: "Program", value: enrollment.program, icon: <Trophy className="h-3.5 w-3.5" /> } : null,
            enrollment.branch ? { label: "Branch", value: enrollment.branch, icon: <MapPin className="h-3.5 w-3.5" /> } : null,
            enrollment.coach ? { label: "Coach", value: enrollment.coach, icon: <Users className="h-3.5 w-3.5" /> } : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Dates & Fees",
          fields: [
            enrollment.enrollmentDate
              ? { label: "Enrolled On", value: new Date(enrollment.enrollmentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), icon: <Calendar className="h-3.5 w-3.5" /> }
              : null,
            enrollment.startDate
              ? { label: "Start Date", value: new Date(enrollment.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), icon: <Calendar className="h-3.5 w-3.5" /> }
              : null,
            enrollment.endDate
              ? { label: "End Date", value: new Date(enrollment.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), icon: <Calendar className="h-3.5 w-3.5" /> }
              : null,
            enrollment.monthlyFee !== undefined
              ? { label: "Monthly Fee", value: `$${enrollment.monthlyFee}`, icon: <DollarSign className="h-3.5 w-3.5" /> }
              : null,
            enrollment.paymentStatus
              ? {
                  label: "Payment",
                  value: <Badge className={getPaymentBadgeClass(enrollment.paymentStatus)}>{enrollment.paymentStatus}</Badge>,
                  icon: <CheckCircle className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(progress !== null
          ? [
              {
                title: "Progress",
                fields: [
                  {
                    label: "Sessions",
                    value: `${enrollment.sessionsCompleted} / ${enrollment.totalSessions} completed`,
                    icon: <TrendingUp className="h-3.5 w-3.5" />,
                  },
                  {
                    label: "Completion",
                    value: (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{progress}%</span>
                        <div className="w-24 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ),
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
        fullName={enrollment?.traineeName ?? `Enrollment #${id}`}
        roleBadge="Enrollment"
        roleBadgeVariant="secondary"
        statusBadge={enrollment?.status ?? ""}
        statusBadgeClass={
          enrollment?.status === "Active"
            ? "bg-success/10 text-success"
            : enrollment?.status === "Suspended"
            ? "bg-destructive/10 text-destructive"
            : "bg-warning/10 text-warning"
        }
        sections={sections}
        backPath="/enrollments"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <EnrollmentFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchEnrollment(); }}
          />
        }
      />
    </>
  );
}
