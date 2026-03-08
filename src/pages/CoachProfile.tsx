import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ApiError } from "@/lib/api";
import {
  ArrowLeft,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Trophy,
  Users,
  Calendar,
  Star,
  Award,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { getCoachById, deleteCoach } from "@/services/coaches.service";
import { CoachDetailsDto } from "@/types/CoachDetailDto";
import { CoachEditModal } from "@/components/modals/CoachEditModal";

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(rating)
              ? "h-4 w-4 fill-warning text-warning"
              : "h-4 w-4 text-muted-foreground/30"
          }
        />
      ))}
      <span className="ml-1.5 text-sm font-medium text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm min-w-[120px]">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-foreground text-right">{value}</div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function CoachProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-32" />
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      {[1, 2].map((k) => (
        <Card key={k} className="card-athletic">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CoachProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [coach, setCoach] = useState<CoachDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCoach = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCoachById(Number(id));
      if (res.isSuccess && res.data) {
        setCoach(res.data);
      } else {
        setError(res.message || "Coach not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load coach.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoach();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCoach(Number(id));
      toast({ title: "Coach removed successfully." });
      navigate("/coaches");
    } catch {
      toast({ title: "Failed to delete coach.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const getSkillBadgeClass = (level: string) => {
    switch (level?.toLowerCase()) {
      case "advanced":
      case "professional":
        return "bg-success/10 text-success border-success/20";
      case "intermediate":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  if (loading) return <CoachProfileSkeleton />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/coaches")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Coaches
        </Button>
        <Card className="card-athletic">
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchCoach}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!coach) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/coaches" className="text-muted-foreground hover:text-foreground transition-colors">
                Coaches
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-foreground">
              {coach.firstName} {coach.lastName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Header Card ─────────────────────────────────────── */}
      <Card className="card-athletic overflow-hidden">
        {/* Gradient bar */}
        <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                {getInitials(coach.firstName, coach.lastName)}
              </AvatarFallback>
            </Avatar>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {coach.firstName} {coach.lastName}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                    <Trophy className="h-4 w-4" />
                    {coach.sportName}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Coach
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(() => setDeleteOpen(true), 0);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Coach
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges + rating */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className={getSkillBadgeClass(coach.skillLevel)}>
                  {coach.skillLevel}
                </Badge>
                <Badge
                  className={
                    coach.isWork
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {coach.isWork ? "Active" : "Inactive"}
                </Badge>
                {coach.rating != null && coach.rating > 0 && (
                  <StarRating rating={coach.rating} />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Contact Info ─────────────────────────────────── */}
        <Card className="card-athletic">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <InfoRow
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Email"
              value={coach.email}
            />
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Phone"
              value={coach.phoneNumber || "—"}
            />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Branch"
              value={coach.branchName || "—"}
            />
          </CardContent>
        </Card>

        {/* ── Professional Info ─────────────────────────────── */}
        <Card className="card-athletic">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Professional Info
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {coach.hireDate && (
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Hire Date"
                value={new Date(coach.hireDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            )}
            <InfoRow
              icon={<Users className="h-3.5 w-3.5" />}
              label="Trainees"
              value={
                coach.totalTrainees != null
                  ? `${coach.totalTrainees} trainees`
                  : "—"
              }
            />
            <InfoRow
              icon={<Trophy className="h-3.5 w-3.5" />}
              label="Sport"
              value={coach.sportName}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Certifications ──────────────────────────────────── */}
      <Card className="card-athletic">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {coach.certifications && coach.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {coach.certifications.map((cert, i) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                  {cert}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No certifications on record.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Modal ───────────────────────────────────────── */}
      <CoachEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false);
          fetchCoach();
        }}
        coach={
          coach
            ? {
                id: coach.id,
                firstName: coach.firstName,
                lastName: coach.lastName,
                sportName: coach.sportName,
                skillLevel: coach.skillLevel,
              }
            : null
        }
      />

      {/* ── Delete Confirm ───────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove Coach"
        description={`Are you sure you want to remove ${coach.firstName} ${coach.lastName} as a coach? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
