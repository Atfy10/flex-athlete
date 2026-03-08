import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityCardSkeleton } from "@/components/ui/CardSkeleton";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { useSortable } from "@/hooks/useSortable";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Plus, Eye, Target } from "lucide-react";
import { RowActions } from "@/components/ui/RowActions";
import { SportsFormModal } from "@/components/modals/SportsFormModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { listSports, searchSports, deleteSport } from "@/services/sport.services";
import { SportDto } from "@/types/SportDto";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";

type SortKey = "name" | "category";

const PAGE_SIZE = 9;

export default function Sports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SportDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const { sort, toggle: toggleSort, sortItems } = useSortable<SortKey>();

  const stableList   = useCallback(listSports,   []);
  const stableSearch = useCallback(searchSports, []);

  const {
    items: sports,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<SportDto>({
    listFn: stableList,
    searchFn: stableSearch,
    pageSize: PAGE_SIZE,
    minLength: 2,
  });

  const handleRefresh = useCallback(() => {
    setTerm("");
    setPage(1);
    refresh();
  }, [setTerm, setPage, refresh]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteSport(deleteTarget.id);
      toast({ title: "Sport deleted successfully." });
      refresh();
    } catch {
      toast({ title: "Failed to delete sport.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Team":       return "bg-primary/10 text-primary";
      case "Individual": return "bg-secondary/10 text-secondary";
      default:           return "bg-muted text-muted-foreground";
    }
  };

  const sortedSports = sortItems(sports, (s, key) => {
    if (key === "name") return s.name;
    if (key === "category") return s.category;
    return "";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Sports Management</h1>
          <p className="text-muted-foreground">Manage sports programs and disciplines</p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sport
        </Button>
      </div>

      {/* Search + Toggle */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FilterBar
                searchValue={term}
                onSearchChange={(v) => { setTerm(v); setPage(1); }}
                searchPlaceholder="Search sports by name…"
                onReset={() => { setTerm(""); setPage(1); }}
              />
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </CardContent>
      </Card>

      {/* TABLE VIEW */}
      {view === "table" ? (
        <Card className="card-athletic overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead col="name" label="Name" sort={sort} onSort={toggleSort} />
                <SortableTableHead col="category" label="Category" sort={sort} onSort={toggleSort} />
                <TableHead>Description</TableHead>
                <TableHead>Health Test</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : sortedSports.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        {term ? `No results for "${term}"` : "No sports yet. Add one to get started."}
                      </TableCell>
                    </TableRow>
                  )
                : sortedSports.map((sport) => (
                    <TableRow
                      key={sport.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/sports/${sport.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                            <Trophy className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <span className="font-medium text-sm">{sport.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(sport.category)}>{sport.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {sport.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant={sport.isRequireHealthTest ? "default" : "outline"}>
                          {sport.isRequireHealthTest ? "Required" : "Not required"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions viewHref={`/sports/${sport.id}`}>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setTimeout(() => setDeleteTarget(sport), 0)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Sport
                          </DropdownMenuItem>
                        </RowActions>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => <EntityCardSkeleton key={i} />)}

          {!loading && sortedSports.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Trophy}
                title={term ? `No results for "${term}"` : "No sports yet"}
                description={term ? "Try a different search term." : "Add your first sport to get started."}
                actionLabel={!term ? "Add Sport" : undefined}
                onAction={!term ? () => setModalOpen(true) : undefined}
              />
            </div>
          )}

          {!loading && sortedSports.map((sport) => (
            <Card key={sport.id} className="card-athletic">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                      <Trophy className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{sport.name}</h3>
                      <Badge className={getCategoryColor(sport.category)}>{sport.category}</Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/sports/${sport.id}`)}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setTimeout(() => setDeleteTarget(sport), 0)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Sport
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5">
                  {sport.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{sport.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      Health Test: {sport.isRequireHealthTest ? "Required" : "Not required"}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/sports/${sport.id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && sortedSports.length > 0 && (
        <BasePagination
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(1)}
        />
      )}

      <SportsFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Sport"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
