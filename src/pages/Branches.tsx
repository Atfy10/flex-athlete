import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  MapPin,
  Building,
  Plus,
  Phone,
  Mail,
  Eye,
} from "lucide-react";
import { RowActions } from "@/components/ui/RowActions";
import { BranchFormModal } from "@/components/modals/BranchFormModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { listBranches, searchBranches } from "@/services/branch.services";
import { BranchCardDto } from "@/types/BranchCardDto";

type SortKey = "name" | "city" | "country";

const PAGE_SIZE = 9;

const Branches = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const { sort, toggle: toggleSort, sortItems } = useSortable<SortKey>();

  const {
    items: branches,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
  } = useEntitySearch<BranchCardDto>({
    listFn: listBranches,
    searchFn: searchBranches,
    pageSize: PAGE_SIZE,
    minLength: 2,
  });

  const handleRefresh = useCallback(() => {
    setTerm("");
    setPage(1);
  }, [setTerm, setPage]);

  const sortedBranches = sortItems(branches, (b, key) => {
    if (key === "name") return b.name;
    if (key === "city") return b.city ?? "";
    if (key === "country") return b.country ?? "";
    return "";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Branch Management
          </h1>
          <p className="text-muted-foreground">
            Manage academy locations and facilities
          </p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
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
                searchPlaceholder="Search branches by name or city…"
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
                <SortableTableHead col="city" label="City" sort={sort} onSort={toggleSort} />
                <SortableTableHead col="country" label="Country" sort={sort} onSort={toggleSort} />
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : sortedBranches.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {term ? `No results for "${term}"` : "No branches yet. Add one to get started."}
                      </TableCell>
                    </TableRow>
                  )
                : sortedBranches.map((branch) => (
                    <TableRow
                      key={branch.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => navigate(`/branches/${branch.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                            <Building className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <span className="font-medium text-sm">{branch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{branch.city ?? "—"}</TableCell>
                      <TableCell className="text-sm">{branch.country ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {branch.phoneNumber
                          ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{branch.phoneNumber}</span>
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[160px]">
                        {branch.email
                          ? <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{branch.email}</span>
                          : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/branches/${branch.id}`)}
                          className="h-8 px-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading &&
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <EntityCardSkeleton key={i} />
            ))}

          {!loading && sortedBranches.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Building}
                title={term ? `No results for "${term}"` : "No branches yet"}
                description={term ? "Try a different search term." : "Add your first branch to get started."}
                actionLabel={!term ? "Add Branch" : undefined}
                onAction={!term ? () => setModalOpen(true) : undefined}
              />
            </div>
          )}

          {!loading &&
            sortedBranches.map((branch) => (
              <Card key={branch.id} className="card-athletic">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                        <Building className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {branch.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {[branch.city, branch.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-2 mb-5">
                    {branch.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          {branch.phoneNumber}
                        </span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {branch.email}
                        </span>
                      </div>
                    )}
                    {(branch.coX != null || branch.coY != null) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground text-xs font-mono">
                          {branch.coX}, {branch.coY}
                        </span>
                      </div>
                    )}
                    {!branch.phoneNumber &&
                      !branch.email &&
                      branch.coX == null && (
                        <p className="text-sm text-muted-foreground italic">
                          No contact details
                        </p>
                      )}
                  </div>

                  {/* Action */}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/branches/${branch.id}`)}
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
      {!loading && sortedBranches.length > 0 && (
        <BasePagination
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => setPage(1)}
        />
      )}

      <BranchFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default Branches;
