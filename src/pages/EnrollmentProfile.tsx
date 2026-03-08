import { useParams, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { EnrollmentEditModal, EnrollmentEditData } from "@/components/modals/EnrollmentEditModal";
import { useEffect, useState, useCallback } from "react";
import {
  User, Trophy, MapPin, Users, Calendar, DollarSign, TrendingUp,
  CheckCircle, PlayCircle, PauseCircle, CreditCard,
} from "lucide-react";
import {
  getEnrollmentById,
  deleteEnrollment,
  activateEnrollment,
  suspendEnrollment,
  updatePaymentStatus,
} from "@/services/enrollment.services";

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
  expiryDate?: string;
  monthlyFee?: number;
  paymentStatus?: string;
  status?: string;
  sessionsCompleted?: number;
  totalSessions?: number;
  sessionAllowed?: number;
  subscriptionDetailsId?: number;
}

export default function EnrollmentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [enrollment, setEnrollment] = useState<EnrollmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEnrollment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getEnrollmentById(id) as {
        isSuccess: boolean;
        data: EnrollmentDetailDto;
        message: string;
      };
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
  }, [id]);

  useEffect(() => { fetchEnrollment(); }, [fetchEnrollment]);

  const handleDelete = async () => {
    try {
      await deleteEnrollment(id!);
      toast({ title: "Enrollment removed successfully." });
      navigate("/enrollments");
    } catch {
      toast({ title: "Failed to delete enrollment.", variant: "destructive" });
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await activateEnrollment(id!);
      toast({ title: "Enrollment activated." });
      fetchEnrollment();
    } catch {
      toast({ title: "Failed to activate enrollment.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await suspendEnrollment(id!);
      toast({ title: "Enrollment suspended." });
      fetchEnrollment();
    } catch {
      toast({ title: "Failed to suspend enrollment.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await updatePaymentStatus(id!, status);
      toast({ title: `Payment status updated to ${status}.` });
      fetchEnrollment();
    } catch {
      toast({ title: "Failed to update payment status.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getPaymentBadgeClass = (status?: string) => {
    switch (status) {
      case "Paid":    return "bg-success/10 text-success border-0";
      case "Pending": return "bg-warning/10 text-warning border-0";
      case "Overdue": return "bg-destructive/10 text-destructive border-0";
      default:        return "bg-muted text-muted-foreground border-0";
    }
  };

  const progress =
    enrollment?.sessionsCompleted !== undefined && enrollment?.totalSessions !== undefined
      ? Math.round((enrollment.sessionsCompleted / enrollment.totalSessions) * 100)
      : null;

  const isActive = enrollment?.status === "Active";

  // Build edit payload
  const editData: EnrollmentEditData | null = enrollment
    ? {
        id: enrollment.id,
        traineeName: enrollment.traineeName,
        traineeEmail: enrollment.traineeEmail,
        sport: enrollment.sport,
        program: enrollment.program,
        expiryDate: enrollment.expiryDate ?? enrollment.endDate,
        sessionAllowed: enrollment.sessionAllowed ?? enrollment.totalSessions,
        subscriptionDetailsId: enrollment.subscriptionDetailsId,
        status: enrollment.status,
        paymentStatus: enrollment.paymentStatus,
      }
    : null;

  const sections: ProfileSection[] = enrollment
    ? [
        {
          title: "Trainee",
          fields: [
            enrollment.traineeName
              ? { label: "Name", value: enrollment.traineeName, icon: <User className="h-3.5 w-3.5" /> }
              : null,
            enrollment.traineeEmail
              ? { label: "Email", value: enrollment.traineeEmail, icon: <User className="h-3.5 w-3.5" /> }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Program Details",
          fields: [
            enrollment.sport
              ? { label: "Sport", value: enrollment.sport, icon: <Trophy className="h-3.5 w-3.5" /> }
              : null,
            enrollment.program
              ? { label: "Program", value: enrollment.program, icon: <Trophy className="h-3.5 w-3.5" /> }
              : null,
            enrollment.branch
              ? { label: "Branch", value: enrollment.branch, icon: <MapPin className="h-3.5 w-3.5" /> }
              : null,
            enrollment.coach
              ? { label: "Coach", value: enrollment.coach, icon: <Users className="h-3.5 w-3.5" /> }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Dates & Fees",
          fields: [
            enrollment.enrollmentDate
              ? {
                  label: "Enrolled On",
                  value: new Date(enrollment.enrollmentDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  }),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
            enrollment.startDate
              ? {
                  label: "Start Date",
                  value: new Date(enrollment.startDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  }),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
            enrollment.endDate
              ? {
                  label: "End Date",
                  value: new Date(enrollment.endDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  }),
                  icon: <Calendar className="h-3.5 w-3.5" />,
                }
              : null,
            enrollment.monthlyFee !== undefined
              ? { label: "Monthly Fee", value: `$${enrollment.monthlyFee}`, icon: <DollarSign className="h-3.5 w-3.5" /> }
              : null,
            enrollment.paymentStatus
              ? {
                  label: "Payment",
                  value: (
                    <Badge className={getPaymentBadgeClass(enrollment.paymentStatus)}>
                      {enrollment.paymentStatus}
                    </Badge>
                  ),
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
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
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
          isActive
            ? "bg-success/10 text-success"
            : enrollment?.status === "Suspended"
            ? "bg-destructive/10 text-destructive"
            : "bg-warning/10 text-warning"
        }
        sections={sections}
        backPath="/enrollments"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        onToggleActive={isActive ? handleSuspend : handleActivate}
        toggleLabel={
          actionLoading
            ? "Updating…"
            : isActive
            ? "Suspend Enrollment"
            : "Activate Enrollment"
        }
        dropdownExtra={[
          {
            label: "Mark as Paid",
            icon: <CreditCard className="h-3.5 w-3.5" />,
            onClick: () => handlePaymentStatus("Paid"),
          },
          {
            label: "Mark as Pending",
            icon: <CreditCard className="h-3.5 w-3.5" />,
            onClick: () => handlePaymentStatus("Pending"),
          },
          {
            label: "Mark as Overdue",
            icon: <CreditCard className="h-3.5 w-3.5" />,
            onClick: () => handlePaymentStatus("Overdue"),
          },
        ]}
        editModal={
          <EnrollmentEditModal
            open={editOpen}
            onOpenChange={setEditOpen}
            enrollment={editData}
            onSuccess={() => { setEditOpen(false); fetchEnrollment(); }}
          />
        }
      />
    </>
  );
}
