import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ApiError } from "@/lib/api";
import {
  ArrowLeft, MoreHorizontal, Mail, Phone, MapPin,
  Calendar, Briefcase, Building2, Users, Pencil, Trash2,
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
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { getEmployeeById, deleteEmployee } from "@/services/employees.service";
import { EmployeeEditModal } from "@/components/modals/EmployeeEditModal";

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
function EmployeeProfileSkeleton() {
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
export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<EmployeeCardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployee = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployeeById(id);
      if (res.isSuccess && res.data) setEmployee(res.data);
      else setError(res.message || "Employee not found.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployee(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEmployee(id!);
      toast({ title: "Employee deleted successfully." });
      navigate("/employees");
    } catch {
      toast({ title: "Failed to delete employee.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  if (loading) return <EmployeeProfileSkeleton />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Employees
        </Button>
        <Card className="card-athletic">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchEmployee}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/employees" className="text-muted-foreground hover:text-foreground transition-colors">
                Employees
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-foreground">
              {employee.firstName} {employee.lastName}
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
                {getInitials(employee.firstName, employee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                    <Briefcase className="h-4 w-4" />
                    {employee.position}
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
                      <Pencil className="h-4 w-4 mr-2" />Edit Employee
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeleteOpen(true), 0); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />Remove Employee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="secondary">Employee</Badge>
                <Badge className={employee.isWork ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {employee.isWork ? "Working" : "Off"}
                </Badge>
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
              <Briefcase className="h-4 w-4 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Position" value={employee.position} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Hire Date"
              value={new Date(employee.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
            <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Branch" value={employee.branchName} />
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
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={employee.email} />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={employee.phoneNumber} />
            <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={employee.address} />
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Modal ───────────────────────────────────────── */}
      <EmployeeEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchEmployee(); }}
        employee={employee ? {
          id: employee.id, firstName: employee.firstName, lastName: employee.lastName,
          email: employee.email, phoneNumber: employee.phoneNumber,
          position: employee.position, branchName: employee.branchName,
        } : null}
      />

      {/* ── Delete Confirm ───────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove Employee"
        description={`Are you sure you want to remove ${employee.firstName} ${employee.lastName}? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
