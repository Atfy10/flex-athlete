import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Plus, Search, Filter, Clock, DollarSign, Target, Star } from "lucide-react";
import { SportsFormModal } from "@/components/modals/SportsFormModal";
import { useClientPagination } from "@/hooks/useClientPagination";
import { BasePagination } from "@/components/BasePagination";

const allSports = [
  { id: 1, name: "Basketball", category: "Team Sport", description: "Fast-paced team sport focusing on agility, teamwork, and strategic thinking.", skillLevel: ["Beginner", "Intermediate", "Advanced"], ageGroups: ["6-12", "13-17", "18+"], duration: "60 min", maxParticipants: 12, currentEnrollment: 87, monthlyFee: 120, coaches: 4, branches: ["Main Campus", "Downtown"], equipment: ["Basketball", "Hoops", "Protective Gear"], status: "Active" },
  { id: 2, name: "Swimming", category: "Individual Sport", description: "Full-body workout sport that builds endurance, strength, and technique.", skillLevel: ["Beginner", "Intermediate", "Advanced", "Competitive"], ageGroups: ["4-8", "9-15", "16+"], duration: "45 min", maxParticipants: 8, currentEnrollment: 156, monthlyFee: 150, coaches: 6, branches: ["Main Campus"], equipment: ["Pool", "Lane Ropes", "Kickboards", "Safety Equipment"], status: "Active" },
  { id: 3, name: "Tennis", category: "Racquet Sport", description: "Individual or doubles sport focusing on precision, strategy, and athleticism.", skillLevel: ["Beginner", "Intermediate", "Advanced"], ageGroups: ["8-14", "15+"], duration: "75 min", maxParticipants: 4, currentEnrollment: 64, monthlyFee: 180, coaches: 3, branches: ["Main Campus", "Westside"], equipment: ["Racquets", "Tennis Balls", "Court", "Nets"], status: "Active" },
  { id: 4, name: "Martial Arts", category: "Combat Sport", description: "Traditional martial arts focusing on discipline, self-defense, and mental strength.", skillLevel: ["Beginner", "Intermediate", "Advanced", "Black Belt"], ageGroups: ["5-10", "11-17", "18+"], duration: "90 min", maxParticipants: 15, currentEnrollment: 92, monthlyFee: 140, coaches: 5, branches: ["Downtown", "Westside"], equipment: ["Mats", "Protective Gear", "Training Equipment"], status: "Active" },
];

const Sports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredSports = useMemo(() => allSports.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]);

  const { paginatedData: sports, page, setPage, pageSize, setPageSize, totalPages, totalCount } = useClientPagination({ data: filteredSports, initialPageSize: 10 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-success text-success-foreground";
      case "Inactive": return "bg-muted text-muted-foreground";
      case "Seasonal": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Team Sport": "bg-primary/10 text-primary",
      "Individual Sport": "bg-secondary/10 text-secondary",
      "Racquet Sport": "bg-success/10 text-success",
      "Combat Sport": "bg-warning/10 text-warning"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const handleRefresh = () => {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Sports Management</h1>
          <p className="text-muted-foreground">Manage sports programs and disciplines</p>
        </div>
        <Button className="btn-hero" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sport
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sports</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">4 categories</p>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">91.7% active rate</p>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">399</div>
            <p className="text-xs text-muted-foreground">Across all sports</p>
          </CardContent>
        </Card>
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Monthly Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$148</div>
            <p className="text-xs text-muted-foreground">Per participant</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sports.map((sport) => (
          <Card key={sport.id} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{sport.name}</h3>
                    <Badge className={getCategoryColor(sport.category)}>{sport.category}</Badge>
                  </div>
                </div>
                <Badge className={getStatusColor(sport.status)}>{sport.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{sport.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>{sport.duration}</span></div>
                <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{sport.maxParticipants} max</span></div>
                <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>${sport.monthlyFee}/month</span></div>
                <div className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-muted-foreground" /><span>{sport.coaches} coaches</span></div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2"><span>Current Enrollment</span><span className="font-medium">{sport.currentEnrollment}</span></div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Skill Levels</p>
                <div className="flex flex-wrap gap-1">{sport.skillLevel.map((level) => (<Badge key={level} variant="secondary" className="text-xs">{level}</Badge>))}</div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Age Groups</p>
                <div className="flex flex-wrap gap-1">{sport.ageGroups.map((age) => (<Badge key={age} variant="outline" className="text-xs">{age} years</Badge>))}</div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Available At</p>
                <div className="flex flex-wrap gap-1">{sport.branches.map((branch) => (<Badge key={branch} className="text-xs bg-primary/10 text-primary">{branch}</Badge>))}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                <Button variant="outline" size="sm" className="flex-1">View Sessions</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BasePagination page={page} totalPages={totalPages} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <SportsFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleRefresh} />
    </div>
  );
};

export default Sports;
