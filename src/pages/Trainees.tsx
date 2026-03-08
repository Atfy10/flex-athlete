import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import {
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  Eye,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TraineeFormModal } from "@/components/modals/TraineeFormModal";
import { TraineeEditModal } from "@/components/modals/TraineeEditModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listTrainees,
  searchTrainees,
  searchTraineesById,
  countTrainees,
  countActiveTrainees,
  deleteTrainee,
} from "@/services/trainee.service";
import { countSports, getSports } from "@/services/sport.services";
import { getAverageAttendance } from "@/services/attendance.services";
import { TraineeCardDto } from "@/types/TraineeCardDto";
import { useToast } from "@/hooks/use-toast";

interface TraineesStats {
  totalTrainees: number;
  activeTrainees: number;
  sportsCount: number;
  averageAttendance: number;
}

const PAGE_SIZE = 6;

function TraineeCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Trainees() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Modals & dialogs ──────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrainee, setEditTrainee] = useState<TraineeCardDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TraineeCardDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sportOptions, setSportOptions] = useState<{ id: number; name: string }[]>([]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<TraineesStats>({
    totalTrainees: 0,
    activeTrainees: 0,
    sportsCount: 0,
    averageAttendance: 0,
  });

  // ── Load sport options for filter ─────────────────────────────────────────
  useEffect(() => {
    getSports()
      .then((res) => { if (res.isSuccess) setSportOptions(res.data); })
      .catch(() => {});
  }, []);

  // ── Stats fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
          countTrainees(),
          countActiveTrainees(),
          countSports(),
          getAverageAttendance(),
        ]);
        if (!active) return;
        const [countRes, activeRes, sportsRes, attendenceAvg] = results;
        setStats({
          totalTrainees: countRes.status === "fulfilled" && countRes.value?.isSuccess ? countRes.value.data : 0,
          activeTrainees: activeRes.status === "fulfilled" && activeRes.value?.isSuccess ? activeRes.value.data : 0,
          sportsCount: sportsRes.status === "fulfilled" && sportsRes.value?.isSuccess ? sportsRes.value.data : 0,
          averageAttendance: attendenceAvg.status === "fulfilled" && attendenceAvg.value?.isSuccess ? attendenceAvg.value.data : 0,
        });
      } catch (err) {
        console.error("Trainees stats error", err);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, []);

  // ── Search hook ───────────────────────────────────────────────────────────
  const handleSearchFn = useCallback(
    async (searchTerm: string, page: number, pageSize: number) => {
      const isNumericSearch = /^\d+$/.test(searchTerm.trim());
      return isNumericSearch
        ? searchTraineesById(searchTerm, page, pageSize)
        : searchTrainees(searchTerm, page, pageSize);
    },
    [],
  );

  const {
    items: rawTrainees,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<TraineeCardDto>({
    listFn: listTrainees,
    searchFn: handleSearchFn,
    pageSize: PAGE_SIZE,
    minLength: 1,
  });

  // ── Client-side sport + status filters ───────────────────────────────────
  const trainees = rawTrainees.filter((t) => {
    const sportMatch =
      sportFilter === "all" ||
      (t.sportSkills?.some((s) =>
        s.sportName.toLowerCase() === sportFilter.toLowerCase()
      )) ||
      t.sportName?.toLowerCase() === sportFilter.toLowerCase();

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && t.isSubscribed) ||
      (statusFilter === "inactive" && !t.isSubscribed);

    return sportMatch && statusMatch;
  });

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteTrainee(deleteTarget.id);
      toast({ title: "Trainee removed successfully." });
      refresh();
    } catch {
      toast({ title: "Failed to remove trainee.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusColor = (isSubscribed: boolean) =>
    isSubscribed
      ? "bg-success/10 text-success hover:bg-success/20"
      : "bg-destructive/10 text-destructive hover:bg-destructive/20";

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "beginner": return "bg-secondary/10 text-secondary hover:bg-secondary/20";
      case "intermediate": return "bg-primary/10 text-primary hover:bg-primary/20";
      case "advanced": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "expert": return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      default: return "bg-muted";
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);

  const statsCards = [
    { title: "Total Trainees", value: stats.totalTrainees.toString(), change: "+12%", icon: Users },
    { title: "Active Now",     value: stats.activeTrainees.toString(), change: "+5%",  icon: TrendingUp },
    { title: "Sports Covered", value: stats.sportsCount.toString(),    change: "+2",   icon: Trophy },
    { title: "Avg. Attendance",value: `${stats.averageAttendance}%`,   change: "+3%",  icon: Star },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Trainees Management</h1>
          <p className="text-muted-foreground">Manage and track all academy trainees</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="h-5 w-5" />
          Add New Trainee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterBar
            searchValue={term}
            onSearchChange={(v) => { setTerm(v); setPage(1); }}
            searchPlaceholder="Search trainees by name, email, or ID"
            filters={{ sport: sportFilter, status: statusFilter }}
            onFilterChange={(key, val) => {
              if (key === "sport") setSportFilter(val);
              if (key === "status") setStatusFilter(val);
              setPage(1);
            }}
            filterConfigs={[
              {
                key: "sport",
                placeholder: "All Sports",
                options: sportOptions.map((s) => ({ value: s.name, label: s.name })),
              },
              {
                key: "status",
                placeholder: "All Statuses",
                options: [
                  { value: "active", label: "Subscribed" },
                  { value: "inactive", label: "Not Subscribed" },
                ],
              },
            ]}
            onReset={() => { setTerm(""); setSportFilter("all"); setStatusFilter("all"); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <TraineeCardSkeleton key={i} />)
          : trainees.map((trainee) => {
              const fullName = `${trainee.firstName} ${trainee.lastName}`;
              const sportSkills =
                trainee.sportSkills && trainee.sportSkills.length > 0
                  ? trainee.sportSkills
                  : trainee.sportName
                  ? [{ sportName: trainee.sportName, skillLevel: trainee.skillLevel ?? "" }]
                  : [];
              return (
                <Card key={trainee.id} className="card-athletic">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {getInitials(fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{fullName}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Age: {trainee.age} · Joined {new Date(trainee.joinDate).getFullYear()}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/trainees/${trainee.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTimeout(() => setEditTrainee(trainee), 100)}
                          >
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/attendance?traineeId=${trainee.id}`)}
                          >
                            View Attendance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setTimeout(() => setDeleteTarget(trainee), 100)}
                          >
                            Remove Trainee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{trainee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{trainee.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{trainee.branchName}</span>
                      </div>
                    </div>

                    {/* Sport + skill badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {sportSkills.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          <Badge variant="outline" className="font-medium text-xs">{s.sportName}</Badge>
                          {s.skillLevel && (
                            <Badge variant="secondary" className={`${getLevelColor(s.skillLevel)} text-xs`}>
                              {s.skillLevel}
                            </Badge>
                          )}
                        </span>
                      ))}
                      <Badge className={`${getStatusColor(trainee.isSubscribed)} text-xs`}>
                        {trainee.isSubscribed ? "Subscribed" : "Not Subscribed"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{trainee.coachName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Att: {trainee.attendanceRate}%</span>
                      </div>
                    </div>

                    {trainee.medicalConditions && trainee.medicalConditions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Medical</p>
                        <div className="flex flex-wrap gap-1">
                          {trainee.medicalConditions.map((c, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/trainees/${trainee.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/attendance?traineeId=${trainee.id}`)}
                      >
                        Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Empty state / error */}
      {!loading && trainees.length === 0 && (
        <EmptyState
          icon={Users}
          title={term ? `No results for "${term}"` : sportFilter !== "all" ? `No trainees in ${sportFilter}` : "No trainees yet"}
          description={term || sportFilter !== "all" ? "Try adjusting your search or filters." : "Get started by adding your first trainee."}
          actionLabel={!term && sportFilter === "all" ? "Add Trainee" : undefined}
          onAction={!term && sportFilter === "all" ? () => setCreateOpen(true) : undefined}
        />
      )}

      {/* Pagination */}
      {trainees.length > 0 && (
        <BasePagination
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(1)}
        />
      )}

      {/* Create modal */}
      <TraineeFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
      />

      {/* Edit modal */}
      <TraineeEditModal
        open={!!editTrainee}
        onOpenChange={(v) => { if (!v) setEditTrainee(null); }}
        onSuccess={() => { setEditTrainee(null); refresh(); }}
        trainee={
          editTrainee
            ? {
                id: editTrainee.id,
                firstName: editTrainee.firstName,
                lastName: editTrainee.lastName,
                parentNumber: undefined,
                guardianName: undefined,
                branchName: editTrainee.branchName,
                sports: editTrainee.sportSkills?.map((s) => s.sportName) ??
                  (editTrainee.sportName ? [editTrainee.sportName] : []),
              }
            : null
        }
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Remove Trainee?"
        description={`This will permanently remove ${deleteTarget?.firstName} ${deleteTarget?.lastName} from the system. This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
