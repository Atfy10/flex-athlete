import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FilterBar } from "@/components/FilterBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  UserPlus,
  Users,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  PlayCircle,
  PauseCircle,
  CreditCard,
} from "lucide-react";
import { EnrollmentFormModal } from "@/components/modals/EnrollmentFormModal";
import { EnrollmentEditModal, EnrollmentEditData } from "@/components/modals/EnrollmentEditModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { useToast } from "@/hooks/use-toast";
import {
  listEnrollments,
  searchEnrollments,
  countAllEnrollments,
  countActiveEnrollments,
  countPendingPayments,
  activateEnrollment,
  suspendEnrollment,
  updatePaymentStatus,
  deleteEnrollment,
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
function EnrollmentsEmptyState({ term, onAdd }: { term: string; onAdd: () => void }) {
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
              {term ? "Try a different search term." : "Create the first enrollment to get started."}
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
    case "Active":    return "bg-success text-success-foreground";
    case "Pending":   return "bg-warning text-warning-foreground";
    case "Suspended":
    case "Cancelled": return "bg-destructive text-destructive-foreground";
    case "Completed": return "bg-muted text-muted-foreground";
    default:          return "bg-muted text-muted-foreground";
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
  name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

const progressPct = (completed = 0, total = 0) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

// ── Main page ─────────────────────────────────────────────────────────────────
const Enrollments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentEditData | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [stats, setStats] = useState<EnrollmentStats>({ total: 0, active: 0, pendingPayment: 0 });

  const {
    items: enrollments,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<EnrollmentCardDto>({
    listFn: listEnrollments,
    searchFn: searchEnrollments,
    pageSize: PAGE_SIZE,
    minLength: 2,
  });

  const fetchStats = useCallback(async () => {
    const results = await Promise.allSettled([
      countAllEnrollments(),
      countActiveEnrollments(),
      countPendingPayments(),
    ]);
    const [totalRes, activeRes, pendingRes] = results;
    setStats({
      total:          totalRes.status  === "fulfilled" && totalRes.value?.isSuccess  ? totalRes.value.data  : 0,
      active:         activeRes.status === "fulfilled" && activeRes.value?.isSuccess ? activeRes.value.data : 0,
      pendingPayment: pendingRes.status === "fulfilled" && pendingRes.value?.isSuccess ? pendingRes.value.data : 0,
    });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleRefresh = useCallback(() => {
    refresh?.();
    fetchStats();
  }, [refresh, fetchStats]);

  const openEdit = (enrollment: EnrollmentCardDto) => {
    setSelectedEnrollment({
      id: enrollment.id,
      traineeName: enrollment.traineeName,
      traineeEmail: enrollment.traineeEmail,
      sport: enrollment.sport,
      program: enrollment.program,
      status: enrollment.status,
      paymentStatus: enrollment.paymentStatus,
    });
    setEditOpen(true);
  };

  const handleActivate = async (id: number) => {
    setActionLoadingId(id);
    try {
      await activateEnrollment(id);
      toast({ title: "Enrollment activated." });
      handleRefresh();
    } catch {
      toast({ title: "Failed to activate enrollment.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSuspend = async (id: number) => {
    setActionLoadingId(id);
    try {
      await suspendEnrollment(id);
      toast({ title: "Enrollment suspended." });
      handleRefresh();
    } catch {
      toast({ title: "Failed to suspend enrollment.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePaymentStatus = async (id: number, status: string) => {
    setActionLoadingId(id);
    try {
      await updatePaymentStatus(id, status);
      toast({ title: `Payment status updated to ${status}.` });
      handleRefresh();
    } catch {
      toast({ title: "Failed to update payment status.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoadingId(id);
    try {
      await deleteEnrollment(id);
      toast({ title: "Enrollment removed." });
      handleRefresh();
    } catch {
      toast({ title: "Failed to remove enrollment.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Enrollment Management</h1>
          <p className="text-muted-foreground">Track student registrations and program participation</p>
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
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
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
              {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% active rate` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
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
        {loading && Array.from({ length: 5 }).map((_, i) => <EnrollmentRowSkeleton key={i} />)}

        {!loading && enrollments.length === 0 && (
          <EnrollmentsEmptyState term={term} onAdd={() => setModalOpen(true)} />
        )}

        {!loading &&
          enrollments.map((enrollment) => {
            const pct = progressPct(enrollment.sessionsCompleted, enrollment.totalSessions);
            const isLoading = actionLoadingId === enrollment.id;
            const isActive = enrollment.status === "Active";

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
                        <h3 className="font-semibold truncate">{enrollment.traineeName}</h3>
                        {enrollment.traineeEmail && (
                          <p className="text-sm text-muted-foreground truncate">{enrollment.traineeEmail}</p>
                        )}
                      </div>
                    </div>

                    {/* Program info */}
                    <div className="lg:w-1/4 space-y-1">
                      <p className="font-medium">{enrollment.sport}</p>
                      {enrollment.program && (
                        <p className="text-sm text-muted-foreground">{enrollment.program}</p>
                      )}
                      {(enrollment.coachName || enrollment.branch) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {[enrollment.coachName, enrollment.branch].filter(Boolean).join(" • ")}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="lg:w-1/4 space-y-2">
                      {enrollment.totalSessions != null && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment.sessionsCompleted ?? 0}/{enrollment.totalSessions}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{pct}% complete</p>
                        </>
                      )}
                      {enrollment.startDate && enrollment.endDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{enrollment.startDate} → {enrollment.endDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div className="lg:w-1/4 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(enrollment.status)}>{enrollment.status}</Badge>
                        {enrollment.paymentStatus && (
                          <Badge className={getPaymentStatusColor(enrollment.paymentStatus)}>
                            {enrollment.paymentStatus}
                          </Badge>
                        )}
                      </div>
                      {enrollment.monthlyFee != null && (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">${enrollment.monthlyFee}/month</span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/enrollments/${enrollment.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Button>

                        {/* Dropdown actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                              disabled={isLoading}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                              Actions
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => openEdit(enrollment)}
                              className="gap-2 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Details
                            </DropdownMenuItem>

                            {isActive ? (
                              <DropdownMenuItem
                                onClick={() => handleSuspend(enrollment.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <PauseCircle className="h-3.5 w-3.5" />
                                Suspend Enrollment
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivate(enrollment.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <PlayCircle className="h-3.5 w-3.5" />
                                Activate Enrollment
                              </DropdownMenuItem>
                            )}

                            {/* Payment status sub-menu */}
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                                <CreditCard className="h-3.5 w-3.5" />
                                Payment Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {["Paid", "Pending", "Overdue"].map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => handlePaymentStatus(enrollment.id, s)}
                                    className="gap-2 cursor-pointer"
                                    disabled={enrollment.paymentStatus === s}
                                  >
                                    {s}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />

                            {/* Delete with confirm */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove Enrollment
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Enrollment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove the enrollment for{" "}
                                    <strong>{enrollment.traineeName}</strong>. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(enrollment.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      <EnrollmentEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        enrollment={selectedEnrollment}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default Enrollments;
