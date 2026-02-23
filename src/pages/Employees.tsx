import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  MapPin,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";
import { EmployeeFormModal } from "@/components/modals/EmployeeFormModal";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { ApiResult, PagedData } from "@/types/api";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { listEmployees, searchEmployees } from "@/services/employees.service";

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeCardDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 9;

  const getStatusColor = (isWork: boolean) =>
    isWork
      ? "bg-success text-success-foreground"
      : "bg-muted text-muted-foreground";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleRefresh = () => {
    setPageNumber(1);
  };

  // Debounce (مرة واحدة فقط)
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 400);

    return () => clearTimeout(id);
  }, [searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setPageNumber(1);
  }, [debouncedTerm]);

  // Fetch logic
  useEffect(() => {
    let cancelled = false;

    const fetchEmployees = async () => {
      // لو حرف واحد بس → لا نعمل call
      if (debouncedTerm.length === 1) return;

      setLoading(true);

      try {
        const isSearch = debouncedTerm.length >= 3;

        const url = isSearch
          ? `/api/employee/search?term=${encodeURIComponent(
              debouncedTerm,
            )}&page=${pageNumber}&pageSize=${pageSize}`
          : `/api/employee?page=${pageNumber}&pageSize=${pageSize}`;

        const result =
          await apiFetch<ApiResult<PagedData<EmployeeCardDto>>>(url);

        if (cancelled) return;

        if (!result?.isSuccess || !result.data) {
          setEmployees([]);
          setTotalPages(1);
          return;
        }

        const paged = result.data;

        setEmployees(paged.items ?? []);

        const computedTotalPages =
          paged.totalCount > 0
            ? Math.ceil(paged.totalCount / paged.pageSize)
            : 1;

        setTotalPages(computedTotalPages);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching employees", err);
          setEmployees([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [debouncedTerm, pageNumber]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Employee Management
          </h1>
          <p className="text-muted-foreground">
            Manage academy staff and personnel
          </p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22</div>
            <p className="text-xs text-muted-foreground">91.7% active rate</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <MapPin className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Across all branches</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <Card key={employee.id} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {getInitials(employee.firstName + " " + employee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {employee.position}
                  </p>
                </div>
                <Badge className={getStatusColor(employee.isWork)}>
                  {employee.isWork ? "Work" : "Off"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{employee.branchName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined{" "}
                    {employee.hireDate instanceof Date
                      ? employee.hireDate.toLocaleDateString()
                      : new Date(employee.hireDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmployeeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default Employees;
