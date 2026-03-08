import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Building,
  Plus,
  Search,
  Phone,
  Mail,
  Eye,
} from "lucide-react";
import { BranchFormModal } from "@/components/modals/BranchFormModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { listBranches, searchBranches } from "@/services/branch.services";
import { BranchCardDto } from "@/types/BranchCardDto";

const PAGE_SIZE = 9;

// ── Skeleton card shown during initial / page loads ──────────────────────────
function BranchCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function BranchesEmptyState({
  term,
  onAdd,
}: {
  term: string;
  onAdd: () => void;
}) {
  return (
    <Card className="card-athletic col-span-full">
      <CardContent className="py-16">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <Building className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {term ? `No results for "${term}"` : "No branches yet"}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {term
                ? "Try a different search term."
                : "Add your first branch to get started."}
            </p>
          </div>
          {!term && (
            <Button className="btn-hero" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const Branches = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

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

      {/* Search */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <FilterBar
            searchValue={term}
            onSearchChange={(v) => { setTerm(v); setPage(1); }}
            searchPlaceholder="Search branches by name or city…"
            onReset={() => { setTerm(""); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <BranchCardSkeleton key={i} />
          ))}

        {/* Empty state */}
        {!loading && branches.length === 0 && (
          <BranchesEmptyState term={term} onAdd={() => setModalOpen(true)} />
        )}

        {/* Branch cards */}
        {!loading &&
          branches.map((branch) => (
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

      {/* Pagination */}
      {!loading && branches.length > 0 && (
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
