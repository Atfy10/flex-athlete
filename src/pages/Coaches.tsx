import { useState, useMemo, useEffect } from "react";
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
import {
  listCoaches,
  searchCoaches,
  averageRatingForAllCoaches,
  countCoaches,
} from "@/services/coaches.service";
import { countSports } from "@/services/sport.services";
import { countTrainees } from "@/services/trainee.service";
import { CoachCardDto } from "@/types/CoachCardDto";

interface Coach {
  id: number;
  name: string;
  email: string;
  phone: string;
  sport: string;
  specialization: string;
  experience: string;
  rating: number;
  trainees: number;
  branch: string;
  certifications: string[];
  joinDate: string;
  status: "Active" | "Inactive" | "On Leave";
  avatar: string;
}

interface CoachesStats {
  totalCoaches: number;
  sportsCovered: number;
  averageRating: number;
  totalTrainees: number;
}

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
  const [statsReal, setStats] = useState<CoachesStats>({
    totalCoaches: 0,
    sportsCovered: 0,
    averageRating: 0,
    totalTrainees: 0,
  });

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

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
          countCoaches(),
          averageRatingForAllCoaches(),
          countSports(),
          countTrainees(),
        ]);

        if (!active) return;

        const [countRes, ratingRes, sportsRes, traineesRes] = results;

        setStats({
          totalCoaches:
            countRes.status === "fulfilled" && countRes.value?.isSuccess
              ? countRes.value.data
              : 0,

          sportsCovered:
            sportsRes.status === "fulfilled" && sportsRes.value?.isSuccess
              ? sportsRes.value.data
              : 0,

          averageRating:
            ratingRes.status === "fulfilled" && ratingRes.value?.isSuccess
              ? ratingRes.value.data
              : 0,

          totalTrainees:
            traineesRes.status === "fulfilled" && traineesRes.value?.isSuccess
              ? traineesRes.value.data
              : 0,
        });
      } catch (err) {
        console.error("Dashboard stats error", err);
      }
    };

    fetchStats();

    return () => {
      active = false;
    };
  }, []);

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

  stats[0].value = statsReal.totalCoaches.toString();
  stats[1].value = statsReal.sportsCovered.toString();
  stats[2].value = statsReal.averageRating.toFixed(1);
  stats[3].value = statsReal.totalTrainees.toString();

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
                        {coach.skillLevel}
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
                    {coach.sportName}
                  </Badge>
                  <Badge
                    className={getStatusColor(
                      coach.isWork ? "Active" : "On Leave",
                    )}
                  >
                    {coach.isWork ? "Active" : "On Leave"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Skill Level:</strong> {coach.skillLevel}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{coach.totalTrainees} trainees</span>
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
