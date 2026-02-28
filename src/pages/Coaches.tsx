import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Star,
  Trophy,
  Users,
  Calendar,
  Award,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoachFormModal } from "@/components/modals/CoachFormModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import { listCoaches, searchCoaches } from "@/services/coaches.service";
import { CoachCardDto } from "@/types/CoachCardDto";

const coachesDummy = [
  {
    id: 1,
    name: "Mike Johnson",
    email: "mike.johnson@academy.com",
    phone: "+1 (555) 123-4567",
    sport: "Basketball",
    specialization: "Youth Development",
    experience: "8 years",
    rating: 4.9,
    trainees: 45,
    branch: "Downtown",
    certifications: ["FIBA Level 2", "Youth Coach"],
    joinDate: "2020-03-15",
    status: "Active",
    avatar: "/api/placeholder/40/40",
  },
  {
    id: 2,
    name: "Sarah Davis",
    email: "sarah.davis@academy.com",
    phone: "+1 (555) 234-5678",
    sport: "Swimming",
    specialization: "Competitive Swimming",
    experience: "12 years",
    rating: 4.8,
    trainees: 32,
    branch: "North Side",
    certifications: ["Swimming Australia Level 3", "Safety Instructor"],
    joinDate: "2019-01-20",
    status: "Active",
    avatar: "/api/placeholder/40/40",
  },
  {
    id: 3,
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@academy.com",
    phone: "+1 (555) 345-6789",
    sport: "Tennis",
    specialization: "Singles & Doubles",
    experience: "15 years",
    rating: 4.9,
    trainees: 28,
    branch: "East Branch",
    certifications: ["PTR Professional", "USPTA Certified"],
    joinDate: "2018-06-10",
    status: "Active",
    avatar: "/api/placeholder/40/40",
  },
  {
    id: 4,
    name: "Emma Wilson",
    email: "emma.wilson@academy.com",
    phone: "+1 (555) 456-7890",
    sport: "Soccer",
    specialization: "Team Strategy",
    experience: "10 years",
    rating: 4.7,
    trainees: 52,
    branch: "Downtown",
    certifications: ["UEFA B License", "Grassroots Instructor"],
    joinDate: "2021-08-01",
    status: "Active",
    avatar: "/api/placeholder/40/40",
  },
  {
    id: 5,
    name: "Alex Thompson",
    email: "alex.thompson@academy.com",
    phone: "+1 (555) 567-8901",
    sport: "Volleyball",
    specialization: "Beach Volleyball",
    experience: "6 years",
    rating: 4.6,
    trainees: 24,
    branch: "North Side",
    certifications: ["FIVB Level 1", "Beach Specialist"],
    joinDate: "2022-02-14",
    status: "On Leave",
    avatar: "/api/placeholder/40/40",
  },
];

const stats = [
  { title: "Total Coaches", value: "89", change: "+5", icon: Users },
  { title: "Sports Covered", value: "12", change: "+2", icon: Trophy },
  { title: "Avg. Rating", value: "4.8", change: "+0.1", icon: Star },
  { title: "Total Trainees", value: "1,247", change: "+48", icon: Award },
];

const pageSize = 6;
export default function Coaches() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    items: coaches,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
  } = useEntitySearch<CoachCardDto>({
    listFn: listCoaches,
    searchFn: searchCoaches,
    pageSize: pageSize,
    minLength: 2,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/10 text-success hover:bg-success/20";
      case "On Leave":
        return "bg-warning/10 text-warning hover:bg-warning/20";
      default:
        return "bg-muted";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleRefresh = () => {
    setTerm("");
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Coaches Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all academy coaching staff
          </p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setModalOpen(true)}>
          <Plus className="h-5 w-5" />
          Add New Coach
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <Badge
                    variant="secondary"
                    className="bg-success/10 text-success hover:bg-success/20 mt-2"
                  >
                    +{stat.change}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search coaches by name, sport, or specialization..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter by Sport
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter by Branch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {coaches.map((coach) => (
          <Card key={coach.id} className="card-athletic">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {getInitials(coach.firstName + " " + coach.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {coach.firstName + " " + coach.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-medium">
                        {coach.SkillLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>Schedule Session</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Remove Coach
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{coach.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{coach.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{coach.branchName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {coach.Sport}
                  </Badge>
                  <Badge
                    className={getStatusColor(
                      coach.isWork ? "Active" : "On Leave",
                    )}
                  >
                    {coach.isWork}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Specialization:</strong> {coach.specialization}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Experience:</strong> {coach.experience}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{coach.TotalTrainees} trainees</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Since {new Date(coach.hireDate).getFullYear()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Certifications
                </p>
                <div className="flex flex-wrap gap-1"></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/coaches/${coach.id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BasePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPage}
      />

      <CoachFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
