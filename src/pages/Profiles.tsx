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
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserCheck,
  GraduationCap,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  listTrainees,
  searchTrainees,
  deleteTrainee,
  countTrainees,
} from "@/services/trainee.service";
import {
  listCoaches,
  searchCoaches,
  deleteCoach,
  countCoaches,
} from "@/services/coaches.service";
import {
  listEmployees,
  searchEmployees,
  deleteEmployee,
  getTotalEmployees,
} from "@/services/employees.service";
import { TraineeCardDto } from "@/types/TraineeCardDto";
import { CoachCardDto } from "@/types/CoachCardDto";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { useToast } from "@/hooks/use-toast";

// ─── Union type ─────────────────────────────────────────────────────────────
type ProfileType = "trainee" | "coach" | "employee";

type UnifiedProfile =
  | ({ _type: "trainee" } & TraineeCardDto)
  | ({ _type: "coach" } & CoachCardDto)
  | ({ _type: "employee" } & EmployeeCardDto);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (first: string, last?: string) =>
  ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";

const PAGE_SIZE = 9;

// ─── Card Skeleton ────────────────────────────────────────────────────────────
function ProfileCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <div className="pt-3 border-t border-border">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Individual profile card ──────────────────────────────────────────────────
function ProfileCard({
  profile,
  onView,
  onEdit,
  onDelete,
}: {
  profile: UnifiedProfile;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const firstName = profile.firstName;
  const lastName = profile.lastName;
  const fullName = `${firstName} ${lastName}`;

  const typeLabel =
    profile._type === "trainee"
      ? "Trainee"
      : profile._type === "coach"
        ? "Coach"
        : "Employee";

  const typeBadgeCls =
    profile._type === "trainee"
      ? "bg-primary/10 text-primary"
      : profile._type === "coach"
        ? "bg-secondary/10 text-secondary"
        : "bg-success/10 text-success";

  const statusLabel =
    profile._type === "trainee"
      ? (profile as TraineeCardDto).isSubscribed
        ? "Active"
        : "Inactive"
      : (profile as EmployeeCardDto).isWork
        ? "Working"
        : "Inactive";

  const statusCls =
    (profile._type === "trainee"
      ? (profile as TraineeCardDto).isSubscribed
      : (profile as EmployeeCardDto).isWork)
      ? "bg-success/10 text-success"
      : "bg-muted text-muted-foreground";

  const subtitle =
    profile._type === "trainee"
      ? `Age ${(profile as TraineeCardDto).age} · Trainee`
      : profile._type === "coach"
        ? `${(profile as CoachCardDto).position || "Coach"} · ${(profile as CoachCardDto).sportName || ""}`
        : (profile as EmployeeCardDto).position || "Employee";

  return (
    <Card className="card-athletic flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {getInitials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {subtitle}
            </p>
            <div className="flex gap-1.5 mt-1.5">
              <Badge className={`${typeBadgeCls} text-xs`}>{typeLabel}</Badge>
              <Badge className={`${statusCls} text-xs`}>{statusLabel}</Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onView} className="gap-2">
                <Eye className="h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTimeout(onEdit, 0)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTimeout(onDelete, 0)}
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate text-muted-foreground">{profile.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {profile._type === "trainee"
              ? (profile as TraineeCardDto).phoneNumber
              : (profile as EmployeeCardDto).phoneNumber}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground truncate">
            {profile.branchName}
          </span>
        </div>
        {profile._type === "trainee" && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Att: {(profile as TraineeCardDto).attendanceRate}%
            </span>
          </div>
        )}
        {profile._type === "coach" && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {(profile as CoachCardDto).totalTrainees} trainees
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE_INNER = PAGE_SIZE;

export default function Profiles() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Type filter ─────────────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState<ProfileType | "all">("all");

  // ── Stats ───────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    trainees: 0,
    coaches: 0,
    employees: 0,
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      countTrainees(),
      countCoaches(),
      getTotalEmployees(),
    ]).then(([tRes, cRes, eRes]) => {
      if (!active) return;
      const t = tRes.status === "fulfilled" && tRes.value?.isSuccess ? tRes.value.data : 0;
      const c = cRes.status === "fulfilled" && cRes.value?.isSuccess ? cRes.value.data : 0;
      const e = eRes.status === "fulfilled" && eRes.value?.isSuccess ? eRes.value.data : 0;
      setStats({ total: t + c + e, trainees: t, coaches: c, employees: e });
    });
    return () => { active = false; };
  }, []);

  // ── Delete state ─────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<UnifiedProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Entity search hooks (one per type) ───────────────────────────────────────
  const traineeSearch = useEntitySearch<TraineeCardDto>({
    listFn: listTrainees,
    searchFn: searchTrainees,
    pageSize: PAGE_SIZE_INNER,
    minLength: 2,
  });

  const coachSearch = useEntitySearch<CoachCardDto>({
    listFn: listCoaches,
    searchFn: searchCoaches,
    pageSize: PAGE_SIZE_INNER,
    minLength: 2,
  });

  const employeeSearch = useEntitySearch<EmployeeCardDto>({
    listFn: listEmployees,
    searchFn: searchEmployees,
    pageSize: PAGE_SIZE_INNER,
    minLength: 2,
  });

  // ── Unified search term (drives all three hooks) ─────────────────────────────
  const [term, setTerm] = useState("");

  const handleTermChange = useCallback(
    (val: string) => {
      setTerm(val);
      traineeSearch.setTerm(val);
      coachSearch.setTerm(val);
      employeeSearch.setTerm(val);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleReset = () => {
    handleTermChange("");
    setTypeFilter("all");
  };

  // ── Combine into unified list ─────────────────────────────────────────────
  const allProfiles: UnifiedProfile[] = [
    ...traineeSearch.items.map((t) => ({ _type: "trainee" as const, ...t })),
    ...coachSearch.items.map((c) => ({ _type: "coach" as const, ...c })),
    ...employeeSearch.items.map((e) => ({ _type: "employee" as const, ...e })),
  ];

  const filtered =
    typeFilter === "all"
      ? allProfiles
      : allProfiles.filter((p) => p._type === typeFilter);

  const loading =
    traineeSearch.loading || coachSearch.loading || employeeSearch.loading;

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget._type === "trainee") {
        await deleteTrainee(deleteTarget.id);
      } else if (deleteTarget._type === "coach") {
        await deleteCoach(deleteTarget.id);
      } else {
        await deleteEmployee(deleteTarget.id);
      }
      toast({ title: "Profile removed successfully." });
      traineeSearch.refresh();
      coachSearch.refresh();
      employeeSearch.refresh();
    } catch {
      toast({ title: "Failed to remove profile.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const getViewPath = (p: UnifiedProfile) => {
    if (p._type === "trainee") return `/trainees/${p.id}`;
    if (p._type === "coach") return `/coaches/${p.id}`;
    return `/employees/${p.id}`;
  };

  const getEditPath = (p: UnifiedProfile) => {
    if (p._type === "trainee") return `/trainees/${p.id}`;
    if (p._type === "coach") return `/coaches/${p.id}`;
    return `/employees/${p.id}`;
  };

  // ── Stats cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Profiles", value: stats.total, icon: Users, color: "text-primary" },
    { label: "Trainees", value: stats.trainees, icon: GraduationCap, color: "text-success" },
    { label: "Coaches", value: stats.coaches, icon: UserCheck, color: "text-secondary" },
    { label: "Employees", value: stats.employees, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Profile Directory</h1>
          <p className="text-muted-foreground">
            Unified view of all trainees, coaches, and employees
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, i) => (
          <Card key={i} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterBar
            searchValue={term}
            onSearchChange={handleTermChange}
            searchPlaceholder="Search by name or email…"
            filters={{ type: typeFilter }}
            onFilterChange={(key, val) => {
              if (key === "type") setTypeFilter(val as ProfileType | "all");
            }}
            filterConfigs={[
              {
                key: "type",
                placeholder: "All Types",
                options: [
                  { value: "trainee", label: "Trainees" },
                  { value: "coach", label: "Coaches" },
                  { value: "employee", label: "Employees" },
                ],
                width: "w-full sm:w-40",
              },
            ]}
            onReset={handleReset}
            hasActiveFilters={term !== "" || typeFilter !== "all"}
          />
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title="No profiles found"
              description={
                term
                  ? `No results for "${term}". Try a different search or reset the filters.`
                  : "No profiles match the selected filters."
              }
              actionLabel={term || typeFilter !== "all" ? "Reset Filters" : undefined}
              onAction={term || typeFilter !== "all" ? handleReset : undefined}
            />
          </div>
        ) : (
          filtered.map((profile) => (
            <ProfileCard
              key={`${profile._type}-${profile.id}`}
              profile={profile}
              onView={() => navigate(getViewPath(profile))}
              onEdit={() => navigate(getEditPath(profile))}
              onDelete={() => setDeleteTarget(profile)}
            />
          ))
        )}
      </div>

      {/* Pagination per active type */}
      {typeFilter !== "coach" && typeFilter !== "employee" && traineeSearch.totalPages > 1 && !loading && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground">Trainees pagination</p>
          <BasePagination
            page={traineeSearch.page}
            totalPages={traineeSearch.totalPages}
            pageSize={PAGE_SIZE_INNER}
            onPageChange={traineeSearch.setPage}
          />
        </div>
      )}
      {typeFilter !== "trainee" && typeFilter !== "employee" && coachSearch.totalPages > 1 && !loading && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground">Coaches pagination</p>
          <BasePagination
            page={coachSearch.page}
            totalPages={coachSearch.totalPages}
            pageSize={PAGE_SIZE_INNER}
            onPageChange={coachSearch.setPage}
          />
        </div>
      )}
      {typeFilter !== "trainee" && typeFilter !== "coach" && employeeSearch.totalPages > 1 && !loading && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground">Employees pagination</p>
          <BasePagination
            page={employeeSearch.page}
            totalPages={employeeSearch.totalPages}
            pageSize={PAGE_SIZE_INNER}
            onPageChange={employeeSearch.setPage}
          />
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove Profile"
        description={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.firstName} ${deleteTarget.lastName}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        loading={deleteLoading}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
