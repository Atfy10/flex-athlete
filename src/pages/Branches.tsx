import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityCardSkeleton } from "@/components/ui/CardSkeleton";
import { FilterBar } from "@/components/FilterBar";
import {
  MapPin,
  Building,
  Plus,
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

// (BranchCardSkeleton replaced by EntityCardSkeleton from CardSkeleton)

// ── EmptyState import handles the empty case now ─────────────────────────────

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
            <EntityCardSkeleton key={i} />
          ))}

        {/* Empty state */}
        {!loading && branches.length === 0 && (
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
