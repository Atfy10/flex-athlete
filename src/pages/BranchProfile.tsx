import { useParams, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchEditModal, BranchEditData } from "@/components/modals/BranchEditModal";
import { useEffect, useState, useCallback } from "react";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { MapPin, Phone, Mail, Users, User, Layers, Dumbbell, CalendarDays } from "lucide-react";
import {
  getBranchById,
  deleteBranch,
  deactivateBranch,
  getBranchStats,
  BranchStatsDto,
} from "@/services/branch.services";

interface BranchDetailDto {
  id: number;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  capacity?: number;
  currentEnrollment?: number;
  status?: string;
  sports?: string[];
  facilities?: string[];
  coX?: number;
  coY?: number;
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
        <div>
          {loading ? (
            <>
              <Skeleton className="h-6 w-10 mb-1" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold leading-none">{value ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BranchProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [branch, setBranch] = useState<BranchDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [stats, setStats] = useState<BranchStatsDto | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchBranch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [branchRes, statsRes] = await Promise.allSettled([
        getBranchById(id) as Promise<{ isSuccess: boolean; data: BranchDetailDto; message: string }>,
        getBranchStats(id) as Promise<{ isSuccess: boolean; data: BranchStatsDto }>,
      ]);

      if (branchRes.status === "fulfilled" && branchRes.value.isSuccess) {
        setBranch(branchRes.value.data);
      } else {
        const msg =
          branchRes.status === "rejected"
            ? branchRes.reason instanceof ApiError
              ? branchRes.reason.message
              : "Failed to load branch."
            : (branchRes.value as { message?: string }).message ?? "Branch not found.";
        setError(msg);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.isSuccess) {
        setStats(statsRes.value.data);
      }
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setStatsLoading(true);
    fetchBranch();
  }, [fetchBranch]);

  const handleDelete = async () => {
    try {
      await deleteBranch(id!);
      toast({ title: "Branch deleted successfully." });
      navigate("/branches");
    } catch {
      toast({ title: "Failed to delete branch.", variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateBranch(id!);
      toast({ title: "Branch deactivated successfully." });
      fetchBranch();
    } catch {
      toast({ title: "Failed to deactivate branch.", variant: "destructive" });
    } finally {
      setDeactivating(false);
    }
  };

  // Build edit data object from branch DTO
  const editData: BranchEditData | null = branch
    ? {
        id: branch.id,
        name: branch.name,
        city: branch.city ?? "",
        country: branch.country ?? "",
        phoneNumber: branch.phoneNumber ?? branch.phone ?? "",
        email: branch.email ?? "",
        coX: branch.coX,
        coY: branch.coY,
      }
    : null;

  const sections: ProfileSection[] = branch
    ? [
        {
          title: "Branch Details",
          fields: [
            branch.address
              ? { label: "Address", value: branch.address, icon: <MapPin className="h-3.5 w-3.5" /> }
              : null,
            branch.city || branch.country
              ? {
                  label: "Location",
                  value: [branch.city, branch.country].filter(Boolean).join(", "),
                  icon: <MapPin className="h-3.5 w-3.5" />,
                }
              : null,
            (branch.phoneNumber || branch.phone)
              ? { label: "Phone", value: branch.phoneNumber ?? branch.phone, icon: <Phone className="h-3.5 w-3.5" /> }
              : null,
            branch.email
              ? { label: "Email", value: branch.email, icon: <Mail className="h-3.5 w-3.5" /> }
              : null,
            branch.managerName
              ? { label: "Manager", value: branch.managerName, icon: <User className="h-3.5 w-3.5" /> }
              : null,
            branch.coX != null
              ? {
                  label: "Coordinates",
                  value: `${branch.coX}, ${branch.coY ?? "—"}`,
                  icon: <MapPin className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        ...(branch.capacity !== undefined
          ? [
              {
                title: "Capacity",
                fields: [
                  {
                    label: "Total Capacity",
                    value: `${branch.capacity} students`,
                    icon: <Users className="h-3.5 w-3.5" />,
                  },
                  branch.currentEnrollment !== undefined
                    ? {
                        label: "Current Enrollment",
                        value: `${branch.currentEnrollment} / ${branch.capacity}`,
                        icon: <Users className="h-3.5 w-3.5" />,
                      }
                    : null,
                ].filter(Boolean) as ProfileSection["fields"],
              },
            ]
          : []),
        ...(branch.sports && branch.sports.length > 0
          ? [
              {
                title: "Sports Offered",
                fields: [
                  {
                    label: "Sports",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {branch.sports!.map((sport, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{sport}</Badge>
                        ))}
                      </div>
                    ),
                    icon: <Dumbbell className="h-3.5 w-3.5" />,
                  },
                ],
              },
            ]
          : []),
        ...(branch.facilities && branch.facilities.length > 0
          ? [
              {
                title: "Facilities",
                fields: [
                  {
                    label: "Available",
                    value: (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {branch.facilities!.map((f, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    ),
                    icon: <Layers className="h-3.5 w-3.5" />,
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  const isActive =
    !branch?.status || branch.status.toLowerCase() === "active";

  return (
    <>
      <ProfileViewLayout
        loading={loading}
        error={error}
        fullName={branch?.name ?? ""}
        roleBadge="Branch"
        roleBadgeVariant="secondary"
        statusBadge={branch?.status ?? "Active"}
        statusBadgeClass={
          isActive
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }
        sections={sections}
        backPath="/branches"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        onToggleActive={isActive ? handleDeactivate : undefined}
        toggleLabel={deactivating ? "Deactivating…" : "Deactivate Branch"}
        editModal={
          <BranchEditModal
            open={editOpen}
            onOpenChange={setEditOpen}
            branch={editData}
            onSuccess={() => {
              setEditOpen(false);
              fetchBranch();
            }}
          />
        }
      />

      {/* Branch-level statistics */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <StatCard
            label="Total Trainees"
            value={stats?.totalTrainees}
            icon={<Users className="h-5 w-5" />}
            loading={statsLoading}
          />
          <StatCard
            label="Coaches Assigned"
            value={stats?.totalCoaches}
            icon={<User className="h-5 w-5" />}
            loading={statsLoading}
          />
          <StatCard
            label="Active Groups"
            value={stats?.activeGroups}
            icon={<Layers className="h-5 w-5" />}
            loading={statsLoading}
          />
          <StatCard
            label="Active Sessions"
            value={stats?.activeSessions}
            icon={<CalendarDays className="h-5 w-5" />}
            loading={statsLoading}
          />
        </div>
      )}
    </>
  );
}
