import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { useSortable } from "@/hooks/useSortable";
import {
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Star,
  Trophy,
  Users,
  Award,
  Eye,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RowActions } from "@/components/ui/RowActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CoachFormModal } from "@/components/modals/CoachFormModal";
import { CoachEditModal } from "@/components/modals/CoachEditModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listCoaches,
  searchCoaches,
  averageRatingForAllCoaches,
  countCoaches,
  deleteCoach,
} from "@/services/coaches.service";
import { countSports, getSports } from "@/services/sport.services";
import { countTrainees } from "@/services/trainee.service";
import { getBranches } from "@/services/branch.services";
import { CoachCardDto } from "@/types/CoachCardDto";
import { useToast } from "@/hooks/use-toast";

interface CoachesStats {
  totalCoaches: number;
  sportsCovered: number;
  averageRating: number;
  totalTrainees: number;
}

type SortKey = "name" | "sport" | "branch" | "trainees" | "hired";

const STATS_META = [
  { title: "Total Coaches",  change: "+5",   icon: Users  },
  { title: "Sports Covered", change: "+2",   icon: Trophy },
  { title: "Avg. Rating",    change: "+0.1", icon: Star   },
  { title: "Total Trainees", change: "+48",  icon: Award  },
];

const pageSize = 6;

function CoachCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export default function Coaches() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { sort, toggle: handleSort, sortItems } = useSortable<SortKey>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachCardDto | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState<CoachCardDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statsReal, setStats] = useState<CoachesStats>({
    totalCoaches: 0,
    sportsCovered: 0,
    averageRating: 0,
    totalTrainees: 0,
  });

  const [sportFilter, setSportFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);

  const {
    items: coaches,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<CoachCardDto>({
    listFn: listCoaches,
    searchFn: searchCoaches,
    pageSize,
    minLength: 2,
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      countCoaches(),
      averageRatingForAllCoaches(),
      countSports(),
      countTrainees(),
      getSports(),
      getBranches(),
    ]).then((results) => {
      if (!active) return;
      const [countRes, ratingRes, sportsRes, traineesRes, sportsListRes, branchesListRes] = results;
      setStats({
        totalCoaches: countRes.status === "fulfilled" && countRes.value?.isSuccess ? countRes.value.data : 0,
        sportsCovered: sportsRes.status === "fulfilled" && sportsRes.value?.isSuccess ? sportsRes.value.data : 0,
        averageRating: ratingRes.status === "fulfilled" && ratingRes.value?.isSuccess ? ratingRes.value.data : 0,
        totalTrainees: traineesRes.status === "fulfilled" && traineesRes.value?.isSuccess ? traineesRes.value.data : 0,
      });
      if (sportsListRes.status === "fulfilled" && sportsListRes.value?.isSuccess) setSports(sportsListRes.value.data ?? []);
      if (branchesListRes.status === "fulfilled" && branchesListRes.value?.isSuccess) setBranches(branchesListRes.value.data ?? []);
    });
    return () => { active = false; };
  }, []);

  const filtered = coaches.filter((c) => {
    const matchesSport = sportFilter === "all" || c.sportName === sportFilter;
    const matchesBranch = branchFilter === "all" || c.branchName === branchFilter;
    return matchesSport && matchesBranch;
  });

  const filteredCoaches = sortItems(filtered, (c, key) => {
    if (key === "name") return `${c.firstName} ${c.lastName}`;
    if (key === "sport") return c.sportName;
    if (key === "branch") return c.branchName;
    if (key === "trainees") return c.totalTrainees;
    if (key === "hired") return new Date(c.hireDate).getTime();
    return "";
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-success/10 text-success hover:bg-success/20";
      case "On Leave": return "bg-warning/10 text-warning hover:bg-warning/20";
      default: return "bg-muted";
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleEditClick = (coach: CoachCardDto) => {
    setSelectedCoach(coach);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (coach: CoachCardDto) => {
    setCoachToDelete(coach);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!coachToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteCoach(coachToDelete.id);
      if (res?.isSuccess) {
        toast({ title: "Coach removed successfully" });
        refresh();
      } else {
        toast({ title: "Failed to remove coach", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to remove coach", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setCoachToDelete(null);
    }
  };

  const handleRefresh = () => { setTerm(""); setPage(1); refresh(); };

  const stats = [
    { ...STATS_META[0], value: statsReal.totalCoaches.toString() },
    { ...STATS_META[1], value: statsReal.sportsCovered.toString() },
    { ...STATS_META[2], value: statsReal.averageRating.toFixed(1) },
    { ...STATS_META[3], value: statsReal.totalTrainees.toString() },
  ];

  const hasFilters = term !== "" || sportFilter !== "all" || branchFilter !== "all";

  const SortTH = ({ col, label }: { col: SortKey; label: string }) => (
    <SortableTableHead col={col} label={label} sort={sort} onSort={handleSort} />
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Coaches Management</h1>
          <p className="text-muted-foreground">Manage and track all academy coaching staff</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setModalOpen(true)}>
          <Plus className="h-5 w-5" />
          Add New Coach
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 mt-2">
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

      {/* Search & Filters + View Toggle */}
      <Card className="card-athletic">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Search & Filter</CardTitle>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </CardHeader>
        <CardContent>
          <FilterBar
            searchValue={term}
            onSearchChange={(v) => { setTerm(v); setPage(1); }}
            searchPlaceholder="Search coaches by name…"
            filters={{ sport: sportFilter, branch: branchFilter }}
            onFilterChange={(key, val) => {
              if (key === "sport") setSportFilter(val);
              if (key === "branch") setBranchFilter(val);
              setPage(1);
            }}
            filterConfigs={[
              {
                key: "sport",
                placeholder: "All Sports",
                options: sports.map((s) => ({ value: s.name, label: s.name })),
              },
              {
                key: "branch",
                placeholder: "All Branches",
                options: branches.map((b) => ({ value: b.name, label: b.name })),
              },
            ]}
            onReset={() => { setTerm(""); setSportFilter("all"); setBranchFilter("all"); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" ? (
        loading ? (
          <Card className="card-athletic">
            <CardContent className="p-0">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : filteredCoaches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No coaches found"
            description={hasFilters ? "Try adjusting your search or filters." : "Add your first coach to get started."}
            actionLabel={!hasFilters ? "Add Coach" : undefined}
            onAction={!hasFilters ? () => setModalOpen(true) : undefined}
          />
        ) : (
          <Card className="card-athletic overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortTH col="name" label="Name" />
                  <SortTH col="sport" label="Sport" />
                  <SortTH col="branch" label="Branch" />
                  <TableHead>Skill</TableHead>
                  <TableHead>Status</TableHead>
                  <SortTH col="trainees" label="Trainees" />
                  <SortTH col="hired" label="Hired" />
                   <TableHead className="w-[88px]" />
                 </TableRow>
               </TableHeader>
              <TableBody>
                {filteredCoaches.map((coach) => (
                  <TableRow
                    key={coach.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => navigate(`/coaches/${coach.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                            {getInitials(`${coach.firstName} ${coach.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{coach.firstName} {coach.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{coach.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{coach.sportName}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {coach.branchName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{coach.skillLevel}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(coach.isWork ? "Active" : "On Leave")}>
                        {coach.isWork ? "Active" : "On Leave"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-center">{coach.totalTrainees}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(coach.hireDate).getFullYear()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions viewHref={`/coaches/${coach.id}`}>
                        <DropdownMenuItem onClick={() => handleEditClick(coach)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(coach)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Coach
                        </DropdownMenuItem>
                      </RowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        /* ── GRID VIEW ── */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => <CoachCardSkeleton key={i} />)}
          </div>
        ) : filteredCoaches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No coaches found"
            description={hasFilters ? "Try adjusting your search or filters." : "Add your first coach to get started."}
            actionLabel={!hasFilters ? "Add Coach" : undefined}
            onAction={!hasFilters ? () => setModalOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
              <Card key={coach.id} className="card-athletic">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {getInitials(coach.firstName + " " + coach.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{coach.firstName} {coach.lastName}</CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="text-sm font-medium">{coach.skillLevel}</span>
                        </div>
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
                        <DropdownMenuItem onClick={() => navigate(`/coaches/${coach.id}`)}>
                          <Eye className="h-4 w-4 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(coach)}>Edit Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(coach)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Coach
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{coach.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{coach.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{coach.branchName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-medium">{coach.sportName}</Badge>
                    <Badge className={getStatusColor(coach.isWork ? "Active" : "On Leave")}>
                      {coach.isWork ? "Active" : "On Leave"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Skill Level:</strong> {coach.skillLevel}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{coach.totalTrainees} trainees</span>
                    </div>
                    <span>Since {new Date(coach.hireDate).getFullYear()}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="default" size="sm" className="flex-1" onClick={() => navigate(`/coaches/${coach.id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(coach)}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <BasePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={() => setPage(1)}
      />

      {/* Modals */}
      <CoachFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleRefresh} />
      <CoachEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => { setEditModalOpen(false); refresh(); }}
        coach={selectedCoach ? {
          id: selectedCoach.id,
          firstName: selectedCoach.firstName,
          lastName: selectedCoach.lastName,
          sportName: selectedCoach.sportName,
          skillLevel: selectedCoach.skillLevel,
        } : null}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remove Coach"
        description={`Are you sure you want to remove ${coachToDelete?.firstName} ${coachToDelete?.lastName}? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
