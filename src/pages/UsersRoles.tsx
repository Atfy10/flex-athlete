import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Users,
  Shield,
  UserCheck,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BaseModal } from "@/components/modals/BaseModal";
import { FormInput } from "@/components/modals/FormInput";
import { FormMultiSelect, MultiSelectOption } from "@/components/modals/FormMultiSelect";
import { FormToggle } from "@/components/modals/FormToggle";

interface AppUser {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

export default function UsersRoles() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [rolesOptions, setRolesOptions] = useState<MultiSelectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [] as string[],
    isActive: true,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: AppUser[]; isSuccess: boolean }>("/api/auth/users");
      if (res.isSuccess) setUsers(res.data);
    } catch {
      // silent
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: string[]; isSuccess: boolean }>("/api/auth/roles");
      if (res.isSuccess) setRolesOptions(res.data.map((r) => ({ value: r, label: r })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const handleToggleActive = async (user: AppUser) => {
    setTogglingId(user.id);
    try {
      await apiFetch(`/api/auth/users/${user.id}/toggle-active`, { method: "POST" });
      toast({ title: `User ${user.isActive ? "deactivated" : "activated"}` });
      fetchUsers();
    } catch {
      toast({ title: "Failed to update user status", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenModal = () => {
    setErrors([]);
    setForm({ userName: "", email: "", password: "", confirmPassword: "", roles: [], isActive: true });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (form.password !== form.confirmPassword) {
      setErrors(["Passwords do not match."]);
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/users/create", {
        method: "POST",
        body: JSON.stringify({
          userName: form.userName,
          email: form.email,
          password: form.password,
          roles: form.roles,
          isActive: form.isActive,
        }),
      });
      toast({ title: "User created successfully" });
      fetchUsers();
      setModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.getValidationErrors());
      else setErrors(["Failed to create user."]);
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Users & Roles</h1>
          <p className="text-muted-foreground">Manage system users and role assignments</p>
        </div>
        <Button variant="hero" size="lg" onClick={handleOpenModal}>
          <Plus className="h-5 w-5" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-athletic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold mt-1">{users.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold mt-1">{users.filter((u) => u.isActive).length}</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Roles</p>
                <p className="text-2xl font-bold mt-1">{rolesOptions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {rolesOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.userName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleActive(user)}
                          disabled={togglingId === user.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <BaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add User"
        description="Create a new system user"
        onSubmit={handleSubmit}
        loading={loading}
        errors={errors}
      >
        <FormInput id="userName" label="Username" value={form.userName} onChange={set("userName")} required />
        <FormInput id="email" label="Email" value={form.email} onChange={set("email")} type="email" required />
        <FormInput id="password" label="Password" value={form.password} onChange={set("password")} type="password" required />
        <FormInput id="confirmPassword" label="Confirm Password" value={form.confirmPassword} onChange={set("confirmPassword")} type="password" required />
        <FormMultiSelect
          id="roles"
          label="Roles"
          values={form.roles}
          onChange={(v) => setForm((f) => ({ ...f, roles: v }))}
          options={rolesOptions}
          placeholder="Select roles"
          required
        />
        <FormToggle
          id="isActive"
          label="Active"
          checked={form.isActive}
          onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          description="User will be able to login immediately"
        />
      </BaseModal>
    </div>
  );
}
