import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserPlus,
  Users,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { EnrollmentFormModal } from "@/components/modals/EnrollmentFormModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listEnrollments,
  searchEnrollments,
  countAllEnrollments,
  countActiveEnrollments,
  countPendingPayments,
} from "@/services/enrollment.services";
import { EnrollmentCardDto } from "@/types/EnrollmentCardDto";

const PAGE_SIZE = 10;

interface EnrollmentStats {
  total: number;
  active: number;
  pendingPayment: number;
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function EnrollmentRowSkeleton() {
  return (
    <Card className="card-athletic">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4 lg:w-1/4">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="lg:w-1/4 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="lg:w-1/4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="lg:w-1/4 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EnrollmentsEmptyState({
  term,
  onAdd,
}: {
  term: string;
  onAdd: () => void;
}) {
  return (
    <Card className="card-athletic">
      <CardContent className="py-16">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <UserPlus className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {term ? `No results for "${term}"` : "No enrollments yet"}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {term
                ? "Try a different search term."
                : "Create the first enrollment to get started."}
            </p>
          </div>
          {!term && (
            <Button className="btn-hero" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              New Enrollment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":   return "bg-success text-success-foreground";
    case "Pending":  return "bg-warning text-warning-foreground";
    case "Suspended":
    case "Cancelled": return "bg-destructive text-destructive-foreground";
    case "Completed": return "bg-muted text-muted-foreground";
    default:         return "bg-muted text-muted-foreground";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Paid":    return "bg-success text-success-foreground";
    case "Pending": return "bg-warning text-warning-foreground";
    case "Overdue": return "bg-destructive text-destructive-foreground";
    default:        return "bg-muted text-muted-foreground";
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

const progressPct = (completed = 0, total = 0) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

// ── Main page ─────────────────────────────────────────────────────────────────
const Enrollments = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    active: 0,
    pendingPayment: 0,
  });

  const {
    items: enrollments,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
  } = useEntitySearch<EnrollmentCardDto>({
    listFn: listEnrollments,
    searchFn: searchEnrollments,
    pageSize: PAGE_SIZE,
    minLength: 2,
  });

  // Fetch stats independently
  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      const results = await Promise.allSettled([
        countAllEnrollments(),
        countActiveEnrollments(),
        countPendingPayments(),
      ]);
      if (!active) return;
      const [totalRes, activeRes, pendingRes] = results;
      setStats({
        total:
          totalRes.status === "fulfilled" && totalRes.value?.isSuccess
            ? totalRes.value.data
            : 0,
        active:
          activeRes.status === "fulfilled" && activeRes.value?.isSuccess
            ? activeRes.value.data
            : 0,
        pendingPayment:
          pendingRes.status === "fulfilled" && pendingRes.value?.isSuccess
            ? pendingRes.value.data
            : 0,
      });
    };
    fetchStats();
    return () => { active = false; };
  }, []);

  const handleRefresh = useCallback(() => {
    setTerm("");
    setPage(1);
  }, [setTerm, setPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Enrollment Management
          </h1>
          <p className="text-muted-foreground">
            Track student registrations and program participation
          </p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Enrollment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% active rate`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payment
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayment}</div>
            <p className="text-xs text-muted-foreground">Need follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search enrollments by trainee name or sport…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <EnrollmentRowSkeleton key={i} />
          ))}

        {/* Empty state */}
        {!loading && enrollments.length === 0 && (
          <EnrollmentsEmptyState term={term} onAdd={() => setModalOpen(true)} />
        )}

        {/* Enrollment rows */}
        {!loading &&
          enrollments.map((enrollment) => {
            const pct = progressPct(
              enrollment.sessionsCompleted,
              enrollment.totalSessions,
            );
            return (
              <Card key={enrollment.id} className="card-athletic">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Trainee */}
                    <div className="flex items-center gap-4 lg:w-1/4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {getInitials(enrollment.traineeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {enrollment.traineeName}
                        </h3>
                        {enrollment.traineeEmail && (
                          <p className="text-sm text-muted-foreground truncate">
                            {enrollment.traineeEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Program info */}
                    <div className="lg:w-1/4 space-y-1">
                      <p className="font-medium">{enrollment.sport}</p>
                      {enrollment.program && (
                        <p className="text-sm text-muted-foreground">
                          {enrollment.program}
                        </p>
                      )}
                      {(enrollment.coachName || enrollment.branch) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {[enrollment.coachName, enrollment.branch]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="lg:w-1/4 space-y-2">
                      {enrollment.totalSessions != null && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {enrollment.sessionsCompleted ?? 0}/
                              {enrollment.totalSessions}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {pct}% complete
                          </p>
                        </>
                      )}
                      {enrollment.startDate && enrollment.endDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {enrollment.startDate} → {enrollment.endDate}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div className="lg:w-1/4 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                        {enrollment.paymentStatus && (
                          <Badge
                            className={getPaymentStatusColor(
                              enrollment.paymentStatus,
                            )}
                          >
                            {enrollment.paymentStatus}
                          </Badge>
                        )}
                      </div>
                      {enrollment.monthlyFee != null && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            ${enrollment.monthlyFee}/month
                          </span>
                        </div>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() =>
                          navigate(`/enrollments/${enrollment.id}`)
                        }
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Pagination */}
      {!loading && enrollments.length > 0 && (
        <BasePagination
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(1)}
        />
      )}

      <EnrollmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default Enrollments;
