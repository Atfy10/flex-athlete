import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollmentRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import {
  UserPlus, Users, Plus, Calendar, DollarSign, CheckCircle, Clock,
  Eye, MoreHorizontal, Pencil, Trash2, PlayCircle, PauseCircle, CreditCard,
  Download, XCircle,
} from "lucide-react";
import { EnrollmentFormModal } from "@/components/modals/EnrollmentFormModal";
import { EnrollmentEditModal, EnrollmentEditData } from "@/components/modals/EnrollmentEditModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { useToast } from "@/hooks/use-toast";
import {
  listEnrollments, searchEnrollments, countAllEnrollments, countActiveEnrollments,
  countPendingPayments, activateEnrollment, suspendEnrollment,
  updatePaymentStatus, deleteEnrollment,
} from "@/services/enrollment.services";
import { EnrollmentCardDto } from "@/types/EnrollmentCardDto";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { useSortable } from "@/hooks/useSortable";
import { RowActions } from "@/components/ui/RowActions";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionsBar } from "@/components/ui/BulkActionsBar";

const PAGE_SIZE = 10;

interface EnrollmentStats { total: number; active: number; pendingPayment: number; }

type SortKey = "traineeName" | "sport" | "branch" | "status" | "paymentStatus" | "enrollmentDate";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-success text-success-foreground";
    case "Pending": return "bg-warning text-warning-foreground";
    case "Suspended":
    case "Cancelled": return "bg-destructive text-destructive-foreground";
    case "Completed": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Paid": return "bg-success text-success-foreground";
    case "Pending": return "bg-warning text-warning-foreground";
    case "Overdue": return "bg-destructive text-destructive-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

const progressPct = (completed = 0, total = 0) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

const Enrollments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentEditData | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; traineeName: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [stats, setStats] = useState<EnrollmentStats>({ total: 0, active: 0, pendingPayment: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");
  const { sort, toggle: toggleSort, sortItems } = useSortable<SortKey>();

  const enrollmentFilterParams = useMemo<Record<string, string>>(() => {
    const p: Record<string, string> = {};
    if (statusFilter !== "all") p.status = statusFilter;
    if (paymentFilter !== "all") p.paymentStatus = paymentFilter;
    return p;
  }, [statusFilter, paymentFilter]);

  const {
    items: enrollmentsRaw, loading, term, setTerm, page, setPage, totalPages, refresh,
  } = useEntitySearch<EnrollmentCardDto>({
    listFn: listEnrollments, searchFn: searchEnrollments, pageSize: PAGE_SIZE, minLength: 2,
    extraParams: enrollmentFilterParams,
  });

  const fetchStats = useCallback(async () => {
    const results = await Promise.allSettled([
      countAllEnrollments(), countActiveEnrollments(), countPendingPayments(),
    ]);
    const [totalRes, activeRes, pendingRes] = results;
    setStats({
      total: totalRes.status === "fulfilled" && totalRes.value?.isSuccess ? totalRes.value.data : 0,
      active: activeRes.status === "fulfilled" && activeRes.value?.isSuccess ? activeRes.value.data : 0,
      pendingPayment: pendingRes.status === "fulfilled" && pendingRes.value?.isSuccess ? pendingRes.value.data : 0,
    });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleRefresh = useCallback(() => { refresh?.(); fetchStats(); }, [refresh, fetchStats]);

  // Filtering is now server-side; only sort client-side
  const sortedEnrollments = sortItems(enrollmentsRaw, (e, key) =>
    (e as unknown as Record<string, unknown>)[key] as string ?? ""
  );

  // ── Row selection ─────────────────────────────────────────────────────────
  const {
    selectedIds: enrollmentSelectedIds,
    selectedCount: enrollmentSelectedCount,
    isSelected: isEnrollmentSelected,
    toggle: toggleEnrollmentRow,
    allSelected: allEnrollmentsSelected,
    someSelected: someEnrollmentsSelected,
    toggleAll: toggleAllEnrollments,
    clearSelection: clearEnrollmentSelection,
  } = useTableSelection(sortedEnrollments);

  // ── Bulk export ───────────────────────────────────────────────────────────
  const handleBulkExport = () => {
    const rows = sortedEnrollments.filter((e) => enrollmentSelectedIds.has(e.id));
    const header = ["ID", "Trainee", "Email", "Sport", "Branch", "Status", "Payment", "Fee"];
    const csv = [
      header.join(","),
      ...rows.map((e) =>
        [e.id, e.traineeName, e.traineeEmail ?? "", e.sport, e.branch ?? "", e.status, e.paymentStatus ?? "", e.monthlyFee ?? ""].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enrollments-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    clearEnrollmentSelection();
    toast({ title: `Exported ${rows.length} enrollment${rows.length === 1 ? "" : "s"}.` });
  };

  // ── Bulk cancel ───────────────────────────────────────────────────────────
  const handleBulkCancel = async () => {
    const ids = [...enrollmentSelectedIds] as number[];
    let successCount = 0;
    for (const id of ids) {
      try { await suspendEnrollment(id); successCount++; } catch { /* continue */ }
    }
    toast({ title: `${successCount} enrollment${successCount === 1 ? "" : "s"} suspended.` });
    clearEnrollmentSelection();
    handleRefresh();
  };

  const openEdit = (enrollment: EnrollmentCardDto) => {
    setSelectedEnrollment({
      id: enrollment.id, traineeName: enrollment.traineeName,
      traineeEmail: enrollment.traineeEmail, sport: enrollment.sport,
      program: enrollment.program, status: enrollment.status, paymentStatus: enrollment.paymentStatus,
    });
    setEditOpen(true);
  };

  const handleActivate = async (id: number) => {
    setActionLoadingId(id);
    try { await activateEnrollment(id); toast({ title: "Enrollment activated." }); handleRefresh(); }
    catch { toast({ title: "Failed to activate enrollment.", variant: "destructive" }); }
    finally { setActionLoadingId(null); }
  };

  const handleSuspend = async (id: number) => {
    setActionLoadingId(id);
    try { await suspendEnrollment(id); toast({ title: "Enrollment suspended." }); handleRefresh(); }
    catch { toast({ title: "Failed to suspend enrollment.", variant: "destructive" }); }
    finally { setActionLoadingId(null); }
  };

  const handlePaymentStatus = async (id: number, status: string) => {
    setActionLoadingId(id);
    try { await updatePaymentStatus(id, status); toast({ title: `Payment status updated to ${status}.` }); handleRefresh(); }
    catch { toast({ title: "Failed to update payment status.", variant: "destructive" }); }
    finally { setActionLoadingId(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { await deleteEnrollment(deleteTarget.id); toast({ title: "Enrollment removed." }); handleRefresh(); }
    catch { toast({ title: "Failed to remove enrollment.", variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const ActionMenu = ({ enrollment }: { enrollment: EnrollmentCardDto }) => {
    const isLoading = actionLoadingId === enrollment.id;
    const isActive = enrollment.status === "Active";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-2" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => openEdit(enrollment)} className="gap-2 cursor-pointer">
            <Pencil className="h-3.5 w-3.5" />Edit Details
          </DropdownMenuItem>
          {isActive ? (
            <DropdownMenuItem onClick={() => handleSuspend(enrollment.id)} className="gap-2 cursor-pointer">
              <PauseCircle className="h-3.5 w-3.5" />Suspend Enrollment
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleActivate(enrollment.id)} className="gap-2 cursor-pointer">
              <PlayCircle className="h-3.5 w-3.5" />Activate Enrollment
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
              <CreditCard className="h-3.5 w-3.5" />Payment Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {["Paid", "Pending", "Overdue"].map((s) => (
                <DropdownMenuItem key={s} onClick={() => handlePaymentStatus(enrollment.id, s)}
                  className="gap-2 cursor-pointer" disabled={enrollment.paymentStatus === s}>{s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeleteTarget({ id: enrollment.id, traineeName: enrollment.traineeName }), 0); }}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />Remove Enrollment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
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
          <Plus className="h-4 w-4 mr-2" />New Enrollment
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

      {/* Search & Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FilterBar
                searchValue={term}
                onSearchChange={(v) => { setTerm(v); setPage(1); }}
                searchPlaceholder="Search enrollments by trainee name or sport…"
                filters={{ status: statusFilter, payment: paymentFilter }}
                onFilterChange={(key, val) => {
                  if (key === "status") setStatusFilter(val);
                  if (key === "payment") setPaymentFilter(val);
                  setPage(1);
                }}
                filterConfigs={[
                  {
                    key: "status", placeholder: "All Statuses",
                    options: [
                      { value: "Active", label: "Active" }, { value: "Pending", label: "Pending" },
                      { value: "Suspended", label: "Suspended" }, { value: "Completed", label: "Completed" },
                    ],
                  },
                  {
                    key: "payment", placeholder: "All Payments",
                    options: [
                      { value: "Paid", label: "Paid" }, { value: "Pending", label: "Pending" }, { value: "Overdue", label: "Overdue" },
                    ],
                  },
                ]}
                onReset={() => { setTerm(""); setStatusFilter("all"); setPaymentFilter("all"); setPage(1); }}
              />
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </CardContent>
      </Card>

      {/* List / Table */}
      {view === "grid" ? (
        <div className="space-y-4">
          {loading && Array.from({ length: 5 }).map((_, i) => <EnrollmentRowSkeleton key={i} />)}
          {!loading && sortedEnrollments.length === 0 && (
            <EmptyState
              icon={UserPlus}
              title={term ? `No results for "${term}"` : "No enrollments yet"}
              description={term ? "Try a different search term or adjust your filters." : "Create the first enrollment to get started."}
              actionLabel={!term ? "New Enrollment" : undefined}
              onAction={!term ? () => setModalOpen(true) : undefined}
            />
          )}
          {!loading && sortedEnrollments.map((enrollment) => {
            const pct = progressPct(enrollment.sessionsCompleted, enrollment.totalSessions);
            return (
              <Card key={enrollment.id} className="card-athletic">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
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
                    <div className="lg:w-1/4 space-y-1">
                      <p className="font-medium">{enrollment.sport}</p>
                      {enrollment.program && <p className="text-sm text-muted-foreground">{enrollment.program}</p>}
                      {(enrollment.coachName || enrollment.branch) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {[enrollment.coachName, enrollment.branch].filter(Boolean).join(" • ")}
                        </div>
                      )}
                    </div>
                    <div className="lg:w-1/4 space-y-2">
                      {enrollment.totalSessions != null && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment.sessionsCompleted ?? 0}/{enrollment.totalSessions}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
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
                        <Button variant="default" size="sm" className="flex-1" onClick={() => navigate(`/enrollments/${enrollment.id}`)}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />View
                        </Button>
                        <ActionMenu enrollment={enrollment} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="card-athletic">
          <CardContent className="p-0">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Trainee", "Sport", "Branch", "Status", "Payment", "Fee", ""].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : sortedEnrollments.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <UserPlus className="h-10 w-10 opacity-40 mx-auto mb-3" />
                <p>{term ? `No results for "${term}"` : "No enrollments yet"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Select-all checkbox */}
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allEnrollmentsSelected ? true : someEnrollmentsSelected ? "indeterminate" : false}
                        onCheckedChange={toggleAllEnrollments}
                        aria-label="Select all"
                      />
                    </TableHead>
                    {(
                      [
                        { label: "Trainee", key: "traineeName" },
                        { label: "Sport", key: "sport" },
                        { label: "Branch", key: "branch" },
                        { label: "Status", key: "status" },
                        { label: "Payment", key: "paymentStatus" },
                      ] as { label: string; key: SortKey }[]
                    ).map(({ label, key }) => (
                      <SortableTableHead key={key} col={key} label={label} sort={sort} onSort={toggleSort} />
                    ))}
                    <TableHead>Fee</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEnrollments.map((enrollment) => {
                    const checked = isEnrollmentSelected(enrollment.id);
                    return (
                    <TableRow
                      key={enrollment.id}
                      className={`cursor-pointer transition-colors ${checked ? "bg-primary/5" : ""}`}
                      onClick={() => navigate(`/enrollments/${enrollment.id}`)}
                    >
                      {/* Row checkbox */}
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleEnrollmentRow(enrollment.id)}
                          aria-label={`Select ${enrollment.traineeName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                              {getInitials(enrollment.traineeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{enrollment.traineeName}</p>
                            {enrollment.traineeEmail && (
                              <p className="text-xs text-muted-foreground">{enrollment.traineeEmail}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.sport}</TableCell>
                      <TableCell>{enrollment.branch ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(enrollment.status)} text-xs`}>{enrollment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {enrollment.paymentStatus ? (
                          <Badge className={`${getPaymentStatusColor(enrollment.paymentStatus)} text-xs`}>
                            {enrollment.paymentStatus}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {enrollment.monthlyFee != null ? `$${enrollment.monthlyFee}/mo` : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions viewHref={`/enrollments/${enrollment.id}`}>
                          <DropdownMenuItem onClick={() => openEdit(enrollment)} className="gap-2 cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" />Edit Details
                          </DropdownMenuItem>
                          {enrollment.status === "Active" ? (
                            <DropdownMenuItem onClick={() => handleSuspend(enrollment.id)} className="gap-2 cursor-pointer">
                              <PauseCircle className="h-3.5 w-3.5" />Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivate(enrollment.id)} className="gap-2 cursor-pointer">
                              <PlayCircle className="h-3.5 w-3.5" />Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeleteTarget({ id: enrollment.id, traineeName: enrollment.traineeName }), 0); }}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />Remove
                          </DropdownMenuItem>
                        </RowActions>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && enrollments.length > 0 && (
        <BasePagination
          page={page} totalPages={totalPages} pageSize={PAGE_SIZE}
          onPageChange={setPage} onPageSizeChange={() => setPage(1)}
        />
      )}

      <EnrollmentFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleRefresh} />
      <EnrollmentEditModal open={editOpen} onOpenChange={setEditOpen} enrollment={selectedEnrollment} onSuccess={handleRefresh} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove Enrollment?"
        description={`This will permanently remove the enrollment for ${deleteTarget?.traineeName}. This action cannot be undone.`}
        confirmLabel="Remove" destructive loading={deleteLoading} onConfirm={handleDelete}
      />

      {/* ── Bulk Actions Bar ──────────────────────────────────────────────── */}
      <BulkActionsBar
        selectedCount={enrollmentSelectedCount}
        onClear={clearEnrollmentSelection}
        actions={[
          {
            label: "Export CSV",
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: handleBulkExport,
            variant: "outline",
          },
          {
            label: `Suspend ${enrollmentSelectedCount > 1 ? `(${enrollmentSelectedCount})` : ""}`.trim(),
            icon: <XCircle className="h-3.5 w-3.5" />,
            onClick: handleBulkCancel,
            variant: "destructive",
          },
        ]}
      />
    </div>
  );
};

export default Enrollments;
