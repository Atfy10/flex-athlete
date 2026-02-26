import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { BranchFormModal } from "@/components/modals/BranchFormModal";
import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Users, Trophy, Building2, User, Layers } from "lucide-react";

interface BranchDetailDto {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  capacity?: number;
  currentEnrollment?: number;
  status?: string;
  sports?: string[];
  facilities?: string[];
}

export default function BranchProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [branch, setBranch] = useState<BranchDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchBranch = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<BranchDetailDto>>(`/api/branch/${id}`);
      if (res.isSuccess && res.data) {
        setBranch(res.data);
      } else {
        setError(res.message || "Branch not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load branch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranch();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/branch/${id}`, { method: "DELETE" });
      toast({ title: "Branch deleted successfully." });
      navigate("/branches");
    } catch {
      toast({ title: "Failed to delete branch.", variant: "destructive" });
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const pct = (current / max) * 100;
    if (pct >= 90) return "text-destructive";
    if (pct >= 75) return "text-warning";
    return "text-success";
  };

  const sections: ProfileSection[] = branch
    ? [
        {
          title: "Branch Details",
          fields: [
            branch.address ? { label: "Address", value: branch.address, icon: <MapPin className="h-3.5 w-3.5" /> } : null,
            branch.phone ? { label: "Phone", value: branch.phone, icon: <Phone className="h-3.5 w-3.5" /> } : null,
            branch.email ? { label: "Email", value: branch.email, icon: <Mail className="h-3.5 w-3.5" /> } : null,
            branch.managerName ? { label: "Manager", value: branch.managerName, icon: <User className="h-3.5 w-3.5" /> } : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
        {
          title: "Capacity",
          fields: [
            branch.capacity !== undefined
              ? {
                  label: "Total Capacity",
                  value: `${branch.capacity} students`,
                  icon: <Users className="h-3.5 w-3.5" />,
                }
              : null,
            branch.currentEnrollment !== undefined && branch.capacity !== undefined
              ? {
                  label: "Current Enrollment",
                  value: (
                    <span className={getCapacityColor(branch.currentEnrollment, branch.capacity)}>
                      {branch.currentEnrollment} / {branch.capacity}
                    </span>
                  ),
                  icon: <Users className="h-3.5 w-3.5" />,
                }
              : null,
          ].filter(Boolean) as ProfileSection["fields"],
        },
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
                    icon: <Trophy className="h-3.5 w-3.5" />,
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
          branch?.status === "Active" || !branch?.status
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }
        sections={sections}
        backPath="/branches"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <BranchFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchBranch(); }}
          />
        }
      />
    </>
  );
}
