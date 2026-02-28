import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { ProfileViewLayout, ProfileSection } from "@/components/profile/ProfileViewLayout";
import { EmployeeEditModal } from "@/components/modals/EmployeeEditModal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Phone, MapPin, Calendar, Briefcase, DollarSign, CreditCard, Globe, Building2
} from "lucide-react";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<EmployeeCardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchEmployee = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResult<EmployeeCardDto>>(`/api/employee/${id}`);
      if (res.isSuccess && res.data) {
        setEmployee(res.data);
      } else {
        setError(res.message || "Employee not found.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/employee/${id}`, { method: "DELETE" });
      toast({ title: "Employee deleted successfully." });
      navigate("/employees");
    } catch {
      toast({ title: "Failed to delete employee.", variant: "destructive" });
    }
  };

  const sections: ProfileSection[] = employee
    ? [
        {
          title: "Basic Information",
          fields: [
            { label: "Position", value: employee.position, icon: <Briefcase className="h-3.5 w-3.5" /> },
            {
              label: "Status",
              value: (
                <Badge className={employee.isWork ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                  {employee.isWork ? "Working" : "Off"}
                </Badge>
              ),
            },
            {
              label: "Hire Date",
              value: new Date(employee.hireDate).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              }),
              icon: <Calendar className="h-3.5 w-3.5" />,
            },
          ],
        },
        {
          title: "Contact Information",
          fields: [
            { label: "Email", value: employee.email, icon: <Mail className="h-3.5 w-3.5" /> },
            { label: "Phone", value: employee.phoneNumber, icon: <Phone className="h-3.5 w-3.5" /> },
            {
              label: "Address",
              value: employee.address || null,
              icon: <MapPin className="h-3.5 w-3.5" />,
            },
          ],
        },
        {
          title: "Organizational Info",
          fields: [
            { label: "Branch", value: employee.branchName, icon: <Building2 className="h-3.5 w-3.5" /> },
          ],
        },
      ]
    : [];

  return (
    <>
      <ProfileViewLayout
        loading={loading}
        error={error}
        fullName={employee ? `${employee.firstName} ${employee.lastName}` : ""}
        roleBadge="Employee"
        roleBadgeVariant="secondary"
        statusBadge={employee?.isWork ? "Working" : "Off"}
        statusBadgeClass={employee?.isWork ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
        sections={sections}
        backPath="/employees"
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        editModal={
          <EmployeeFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => { setEditOpen(false); fetchEmployee(); }}
          />
        }
      />
    </>
  );
}
