import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  UserCheck,
  Plus,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Eye,
  MoreHorizontal,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmployeeFormModal } from "@/components/modals/EmployeeFormModal";
import { EmployeeEditModal } from "@/components/modals/EmployeeEditModal";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listEmployees,
  searchEmployees,
  getActiveEmployees,
  getTotalEmployees,
  deleteEmployee,
  toggleEmployeeStatus,
} from "@/services/employees.service";
import { getBranches, countBranches } from "@/services/branch.services";
import { BasePagination } from "@/components/BasePagination";
import { useToast } from "@/hooks/use-toast";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";

interface EmployeesStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
}

function EmployeeCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

const Employees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCardDto | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeCardDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [stats, setStats] = useState<EmployeesStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: 0,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);

  const pageSize = 9;

  const {
    items: employees,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<EmployeeCardDto>({
    listFn: listEmployees,
    searchFn: searchEmployees,
    pageSize,
    minLength: 2,
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getTotalEmployees(),
      getActiveEmployees(),
      countBranches(),
      getBranches(),
    ]).then((results) => {
      if (!active) return;
      const [totalRes, activeRes, branchRes, branchesListRes] = results;
      setStats({
        totalEmployees: totalRes.status === "fulfilled" && totalRes.value?.isSuccess ? totalRes.value.data : 0,
        activeEmployees: activeRes.status === "fulfilled" && activeRes.value?.isSuccess ? activeRes.value.data : 0,
        departments: branchRes.status === "fulfilled" && branchRes.value?.isSuccess ? branchRes.value.data : 0,
      });
      if (branchesListRes.status === "fulfilled" && branchesListRes.value?.isSuccess) {
        setBranches(branchesListRes.value.data ?? []);
      }
    });
    return () => { active = false; };
  }, []);

  // Client-side filtering
  const filteredEmployees = employees.filter((emp) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.isWork) ||
      (statusFilter === "inactive" && !emp.isWork);
    const matchesBranch = branchFilter === "all" || emp.branchName === branchFilter;
    return matchesStatus && matchesBranch;
  });

  const getStatusColor = (isWork: boolean) =>
    isWork ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted text-muted-foreground";

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleEditClick = (emp: EmployeeCardDto) => {
    setSelectedEmployee(emp);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (emp: EmployeeCardDto) => {
    setEmployeeToDelete(emp);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteEmployee(employeeToDelete.id);
      if (res?.isSuccess) {
        toast({ title: "Employee removed successfully" });
        refresh();
      } else {
        toast({ title: "Failed to remove employee", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to remove employee", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleToggleStatus = async (emp: EmployeeCardDto) => {
    setTogglingId(emp.id);
    try {
      const res = await toggleEmployeeStatus(emp.id);
      if (res?.isSuccess) {
        toast({ title: `Employee ${emp.isWork ? "deactivated" : "activated"} successfully` });
        refresh();
      } else {
        toast({ title: "Failed to update status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Employee Management</h1>
          <p className="text-muted-foreground">Manage academy staff and personnel</p>
        </div>
        <Button variant="hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
            <MapPin className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
            <p className="text-xs text-muted-foreground">Across all branches</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <FilterBar
            searchValue={term}
            onSearchChange={(v) => { setTerm(v); setPage(1); }}
            searchPlaceholder="Search employees by name or email…"
            filters={{ status: statusFilter, branch: branchFilter }}
            onFilterChange={(key, val) => {
              if (key === "status") setStatusFilter(val);
              if (key === "branch") setBranchFilter(val);
              setPage(1);
            }}
            filterConfigs={[
              {
                key: "status",
                placeholder: "All Statuses",
                options: [
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
              {
                key: "branch",
                placeholder: "All Branches",
                options: branches.map((b) => ({ value: b.name, label: b.name })),
              },
            ]}
            onReset={() => { setTerm(""); setStatusFilter("all"); setBranchFilter("all"); setPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Employees Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: pageSize }).map((_, i) => <EmployeeCardSkeleton key={i} />)}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="card-athletic">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No employees found</h3>
            <p className="text-sm text-muted-foreground">
              {term || statusFilter !== "all" || branchFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first employee to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
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
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={getStatusColor(employee.isWork)}>
                      {employee.isWork ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/employees/${employee.id}`)}>
                          <Eye className="h-4 w-4 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(employee)}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(employee)}
                          disabled={togglingId === employee.id}
                        >
                          {employee.isWork ? (
                            <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
                          ) : (
                            <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(employee)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Employee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{employee.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{employee.branchName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      Joined{" "}
                      {employee.hireDate instanceof Date
                        ? employee.hireDate.toLocaleDateString()
                        : new Date(employee.hireDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditClick(employee)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BasePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Modals */}
      <EmployeeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />

      <EmployeeEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => { setEditModalOpen(false); refresh(); }}
        employee={selectedEmployee ? {
          id: selectedEmployee.id,
          firstName: selectedEmployee.firstName,
          lastName: selectedEmployee.lastName,
          email: selectedEmployee.email,
          phoneNumber: selectedEmployee.phoneNumber,
          position: selectedEmployee.position,
          branchName: selectedEmployee.branchName,
        } : null}
      />

      {/* Confirm Delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {employeeToDelete?.firstName} {employeeToDelete?.lastName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Employees;
