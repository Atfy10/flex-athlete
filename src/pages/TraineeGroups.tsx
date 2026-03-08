import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/FilterBar";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import {
  Search, Plus, Users, Calendar, Play, MoreHorizontal,
  Clock, MapPin, Trophy, Eye, AlertCircle, Layers, Shield,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TraineeGroupFormModal } from "@/components/modals/TraineeGroupFormModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  getTraineeGroups,
  searchTraineeGroups,
  deleteTraineeGroup,
} from "@/services/traineeGroup.services";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";
import { useToast } from "@/hooks/use-toast";
import { OperateGroupModal } from "@/components/modals/OperateGroupModal";

function GroupCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-40 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-2 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TraineeGroups() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [operateOpen, setOperateOpen] = useState(false);

  const listFn = useCallback(
    (page: number, pageSize: number) => getTraineeGroups(page, pageSize),
    [],
  );
  const searchFn = useCallback(
    (term: string, page: number, pageSize: number) =>
      searchTraineeGroups(term, page, pageSize),
    [],
  );

  const {
    items: groups,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<ListTraineeGroupDto>({ listFn, searchFn, pageSize: 9 });

  const handleDelete = async (id: number) => {
    try {
      await deleteTraineeGroup(id);
      toast({ title: "Group deleted" });
      refresh();
    } catch {
      toast({ title: "Failed to delete group", variant: "destructive" });
    }
  };

  // Stats derived from current page data
  const statsData = [
    {
      title: "Groups (this page)",
      value: loading ? "—" : String(groups.length),
      icon: Users,
    },
    {
      title: "Total Trainees",
      value: loading
        ? "—"
        : String(groups.reduce((s, g) => s + (g.traineesCount ?? 0), 0)),
      icon: Trophy,
    },
    {
      title: "Avg Duration",
      value:
        loading || groups.length === 0
          ? "—"
          : `${Math.round(
              groups.reduce((s, g) => s + g.durationInMinutes, 0) /
                groups.length,
            )} min`,
      icon: Clock,
    },
    {
      title: "Total Schedules",
      value: "—",
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Trainee Groups</h1>
          <p className="text-muted-foreground">
            Manage training groups and their weekly schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => setOperateOpen(true)}>
            <Play className="h-4 w-4" />
            Generate Sessions
          </Button>
          <Button variant="hero" size="lg" onClick={() => setCreateOpen(true)}>
            <Plus className="h-5 w-5" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, i) => (
          <Card key={i} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <FilterBar
            searchValue={term}
            onSearchChange={(v) => { setTerm(v); setPage(1); }}
            searchPlaceholder="Search groups by sport, coach, or branch…"
            onReset={() => { setTerm(""); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="card-athletic">
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">No groups found</p>
            <p className="text-muted-foreground text-sm">
              {term
                ? `No results for "${term}"`
                : "Get started by creating your first trainee group."}
            </p>
            {!term && (
              <Button variant="hero" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="card-athletic">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{group.sportName}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-medium">
                        {group.sportName}
                      </Badge>
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
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/trainee-groups/${group.id}`)
                        }
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          setTimeout(() => handleDelete(group.id), 100)
                        }
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{group.coachName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{group.branchName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {group.durationInMinutes} min · starts{" "}
                      {group.startTime?.slice(0, 5)}
                    </span>
                  </div>
                </div>

                {/* Enrollment bar */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Enrolled</span>
                    <span className="font-medium">{group.traineesCount ?? 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => setOperateOpen(true)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/trainee-groups/${group.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BasePagination
        page={page}
        totalPages={totalPages}
        pageSize={9}
        totalCount={groups.length}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
      />

      {/* Modals */}
      <TraineeGroupFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
      />
      <OperateGroupModal
        open={operateOpen}
        onOpenChange={setOperateOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
