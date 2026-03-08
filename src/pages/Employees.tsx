import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
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
  Pencil,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  ChevronsUpDown,
  Briefcase,
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

type SortKey = "name" | "position" | "branch" | "status" | "hired";
type SortDir = "asc" | "desc";

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

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground/50" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-primary" />
    : <ChevronDownIcon className="h-3.5 w-3.5 ml-1 text-primary" />;
}

const Employees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  const filtered = employees.filter((emp) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.isWork) ||
      (statusFilter === "inactive" && !emp.isWork);
    const matchesBranch = branchFilter === "all" || emp.branchName === branchFilter;
    return matchesStatus && matchesBranch;
  });

  const filteredEmployees = [...filtered].sort((a, b) => {
    let av = "", bv = "";
    if (sortKey === "name") { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; }
    else if (sortKey === "position") { av = a.position; bv = b.position; }
    else if (sortKey === "branch") { av = a.branchName; bv = b.branchName; }
    else if (sortKey === "status") { av = a.isWork ? "a" : "b"; bv = b.isWork ? "a" : "b"; }
    else if (sortKey === "hired") {
      return sortDir === "asc"
        ? new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime()
        : new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime();
    }
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

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

  const handleRefresh = () => { setPage(1); refresh(); };
  const hasFilters = term !== "" || statusFilter !== "all" || branchFilter !== "all";

  const SortTH = ({ col, label }: { col: SortKey; label: string }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap group"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-0.5 group-hover:text-foreground transition-colors">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </TableHead>
  );

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

      {/* Stats */}
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

      {/* Search & Filters + View Toggle */}
      <Card className="card-athletic">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Search & Filter</CardTitle>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
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

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" ? (
        loading ? (
          <Card className="card-athletic">
            <CardContent className="p-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={hasFilters ? "Try adjusting your search or filters." : "Add your first employee to get started."}
            actionLabel={!hasFilters ? "Add Employee" : undefined}
            onAction={!hasFilters ? () => setModalOpen(true) : undefined}
          />
        ) : (
          <Card className="card-athletic overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortTH col="name" label="Name" />
                  <SortTH col="position" label="Position" />
                  <SortTH col="branch" label="Branch" />
                  <SortTH col="status" label="Status" />
                  <TableHead>Phone</TableHead>
                  <SortTH col="hired" label="Hired" />
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                            {getInitials(`${employee.firstName} ${employee.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                        {employee.position}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {employee.branchName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(employee.isWork)}>
                        {employee.isWork ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{employee.phoneNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(employee.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/employees/${employee.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(employee)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(employee)}
                            disabled={togglingId === employee.id}
                          >
                            {employee.isWork
                              ? <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
                              : <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        /* ── GRID VIEW ── */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => <EmployeeCardSkeleton key={i} />)}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={hasFilters ? "Try adjusting your search or filters." : "Add your first employee to get started."}
            actionLabel={!hasFilters ? "Add Employee" : undefined}
            onAction={!hasFilters ? () => setModalOpen(true) : undefined}
          />
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
                      <h3 className="font-semibold truncate">{employee.firstName} {employee.lastName}</h3>
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
                          <DropdownMenuItem onClick={() => handleEditClick(employee)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(employee)}
                            disabled={togglingId === employee.id}
                          >
                            {employee.isWork
                              ? <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
                              : <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>}
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
                      <Mail className="h-4 w-4 shrink-0" /><span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" /><span>{employee.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" /><span>{employee.branchName}</span>
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
                    <Button variant="default" size="sm" className="flex-1" onClick={() => navigate(`/employees/${employee.id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(employee)}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <BasePagination page={page} totalPages={totalPages} pageSize={pageSize} onPageChange={setPage} />

      {/* Modals */}
      <EmployeeFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleRefresh} />
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
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Remove Employee"
        description={`Are you sure you want to remove ${employeeToDelete?.firstName} ${employeeToDelete?.lastName}? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Employees;
