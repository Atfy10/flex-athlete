import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Plus, Search, Filter, Phone, Mail, Users, Trophy } from "lucide-react";
import { BranchFormModal } from "@/components/modals/BranchFormModal";
import { useClientPagination } from "@/hooks/useClientPagination";
import { BasePagination } from "@/components/BasePagination";

const allBranches = [
    {
      id: 1,
      name: "Main Campus",
      address: "123 Sport Academy Dr, City Center",
      phone: "+1 234 567 8900",
      email: "main@academy.com",
      manager: "Sarah Johnson",
      capacity: 500,
      currentEnrollment: 420,
      sports: ["Basketball", "Soccer", "Tennis", "Swimming"],
      status: "Active",
      facilities: ["Pool", "Gymnasium", "Tennis Courts", "Track"]
    },
    {
      id: 2,
      name: "Downtown Branch",
      address: "456 Athletic Ave, Downtown",
      phone: "+1 234 567 8901", 
      email: "downtown@academy.com",
      manager: "Mike Rodriguez",
      capacity: 300,
      currentEnrollment: 275,
      sports: ["Boxing", "Martial Arts", "Fitness"],
      status: "Active",
      facilities: ["Boxing Ring", "Fitness Center", "Yoga Studio"]
    },
    {
      id: 3,
      name: "Westside Location",
      address: "789 Champions Blvd, Westside",
      phone: "+1 234 567 8902",
      email: "westside@academy.com", 
      manager: "Emily Chen",
      capacity: 200,
      currentEnrollment: 150,
      sports: ["Gymnastics", "Dance", "Cheerleading"],
      status: "Active",
      facilities: ["Dance Studio", "Gymnastics Hall", "Mirrored Rooms"]
    }
];

const Branches = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredBranches = useMemo(() => allBranches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  const { paginatedData: branches, page, setPage, pageSize, setPageSize, totalPages, totalCount } = useClientPagination({ data: filteredBranches, initialPageSize: 10 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-success text-success-foreground";
      case "Maintenance": return "bg-warning text-warning-foreground";
      case "Inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-warning";
    return "bg-success";
  };

  const handleRefresh = () => {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Branch Management</h1>
          <p className="text-muted-foreground">Manage academy locations and facilities</p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Across the city</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000</div>
            <p className="text-xs text-muted-foreground">Maximum students</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Enrollment</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">845</div>
            <p className="text-xs text-muted-foreground">84.5% capacity</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sports Offered</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Different disciplines</p>
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
                placeholder="Search branches..."
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

      {/* Branches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground">Manager: {branch.manager}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(branch.status)}>
                  {branch.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{branch.email}</span>
                </div>
              </div>

              {/* Capacity */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Capacity</span>
                  <span>{branch.currentEnrollment}/{branch.capacity}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getCapacityColor(branch.currentEnrollment, branch.capacity)}`}
                    style={{ width: `${(branch.currentEnrollment / branch.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Sports */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Sports Offered</p>
                <div className="flex flex-wrap gap-1">
                  {branch.sports.map((sport) => (
                    <Badge key={sport} variant="secondary" className="text-xs">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Facilities</p>
                <div className="flex flex-wrap gap-1">
                  {branch.facilities.map((facility) => (
                    <Badge key={facility} variant="outline" className="text-xs">
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BasePagination page={page} totalPages={totalPages} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <BranchFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleRefresh} />
    </div>
  );
};

export default Branches;
