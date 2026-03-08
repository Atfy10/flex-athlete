import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ApiError } from "@/lib/api";
import {
  ArrowLeft, MoreHorizontal, Mail, Phone, MapPin, Calendar,
  Users, Shield, TrendingUp, Pencil, Trash2, Trophy,
} from "lucide-react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { TraineeDetailsDto } from "@/types/TraineeDetailsDto";
import { getTraineeById, deleteTrainee } from "@/services/trainee.service";
import { getAttendanceColor } from "@/lib/attendanceUtils";
import { TraineeEditModal } from "@/components/modals/TraineeEditModal";

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TraineeProfileSkeleton() {
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
      {[1, 2, 3].map((k) => (
        <Card key={k} className="card-athletic">
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((j) => <Skeleton key={j} className="h-4 w-full" />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TraineeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trainee, setTrainee] = useState<TraineeDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTrainee = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTraineeById(id);
      if (res.isSuccess && res.data) setTrainee(res.data);
      else setError(res.message || "Trainee not found.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load trainee.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainee(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTrainee(trainee!.id);
      toast({ title: "Trainee removed successfully." });
      navigate("/trainees");
    } catch {
      toast({ title: "Failed to delete trainee.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  if (loading) return <TraineeProfileSkeleton />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/trainees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Trainees
        </Button>
        <Card className="card-athletic">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchTrainee}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trainee) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/trainees" className="text-muted-foreground hover:text-foreground transition-colors">
                Trainees
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-foreground">
              {trainee.firstName} {trainee.lastName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Header Card ─────────────────────────────────────── */}
      <Card className="card-athletic overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                {getInitials(trainee.firstName, trainee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {trainee.firstName} {trainee.lastName}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    Trainee
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" />Edit Trainee
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeleteOpen(true), 0); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />Remove Trainee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline">Trainee</Badge>
                <Badge className={trainee.isSubscribed ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                  {trainee.isSubscribed ? "Active" : "Inactive"}
                </Badge>
                {trainee.gender && (
                  <Badge variant="outline">{trainee.gender}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Basic Info ─────────────────────────────────────── */}
        <Card className="card-athletic">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Birth Date"
              value={trainee.birthDate ? new Date(trainee.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Joined"
              value={trainee.joinDate ? new Date(trainee.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null} />
            <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Branch" value={trainee.branchName} />
          </CardContent>
        </Card>

        {/* ── Contact Info ─────────────────────────────────────── */}
        <Card className="card-athletic">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={trainee.email} />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={trainee.phoneNumber} />
          </CardContent>
        </Card>

        {/* ── Guardian Info ─────────────────────────────────────── */}
        {(trainee.guardianName || trainee.parentNumber) && (
          <Card className="card-athletic">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Guardian Info
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Guardian" value={trainee.guardianName} />
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Parent Number" value={trainee.parentNumber} />
            </CardContent>
          </Card>
        )}

        {/* ── Academy Info ─────────────────────────────────────── */}
        <Card className="card-athletic">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Academy Info
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {trainee.attendanceRate !== undefined && (
              <InfoRow
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Attendance Rate"
                value={
                  <div className="flex items-center gap-2">
                    <span>{trainee.attendanceRate}%</span>
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${trainee.attendanceRate}%` }} />
                    </div>
                  </div>
                }
              />
            )}
            {trainee.enrollmentCount !== undefined && (
              <InfoRow icon={<Users className="h-3.5 w-3.5" />} label="Enrollments" value={`${trainee.enrollmentCount} active`} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sports ──────────────────────────────────────────── */}
      {trainee.sports && trainee.sports.length > 0 && (
        <Card className="card-athletic">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Sports
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {trainee.sports.map((sport, i) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1">{sport}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Edit Modal ───────────────────────────────────────── */}
      <TraineeEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchTrainee(); }}
        trainee={trainee ? {
          id: trainee.id, firstName: trainee.firstName, lastName: trainee.lastName,
          parentNumber: trainee.parentNumber, guardianName: trainee.guardianName,
          branchName: trainee.branchName, sports: trainee.sports,
        } : null}
      />

      {/* ── Delete Confirm ───────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove Trainee"
        description={`Are you sure you want to remove ${trainee.firstName} ${trainee.lastName}? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
