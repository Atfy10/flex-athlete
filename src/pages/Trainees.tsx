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
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  Eye,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TraineeFormModal } from "@/components/modals/TraineeFormModal";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listTrainees,
  searchTrainees,
  countTrainees,
  countActiveTrainees,
} from "@/services/trainee.service";
import { countSports } from "@/services/sport.services";
import { getAverageAttendance } from "@/services/attendance.services";
import { TraineeCardDto } from "@/types/TraineeCardDto";

interface TraineesStats {
  totalTrainees: number;
  activeTrainees: number;
  sportsCount: number;
  averageAttendance: number;
}

const pageSize = 6;

export default function Trainees() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<TraineesStats>({
    totalTrainees: 0,
    activeTrainees: 0,
    sportsCount: 0,
    averageAttendance: 0,
  });

  const {
    items: trainees,
    loading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
  } = useEntitySearch<TraineeCardDto>({
    listFn: listTrainees,
    searchFn: searchTrainees,
    pageSize: pageSize,
    minLength: 2,
  });

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
          countTrainees(),
          countActiveTrainees(),
          countSports(),
          getAverageAttendance(),
        ]);

        if (!active) return;

        const [countRes, activeTrianees, sportsRes, attendenceAvg] = results;

        setStats({
          totalTrainees:
            countRes.status === "fulfilled" && countRes.value?.isSuccess
              ? countRes.value.data
              : 0,

          activeTrainees:
            activeTrianees.status === "fulfilled" &&
            activeTrianees.value?.isSuccess
              ? activeTrianees.value.data
              : 0,

          sportsCount:
            sportsRes.status === "fulfilled" && sportsRes.value?.isSuccess
              ? sportsRes.value.data
              : 0,

          averageAttendance:
            attendenceAvg.status === "fulfilled" &&
            attendenceAvg.value?.isSuccess
              ? attendenceAvg.value.data
              : 0,
        });
      } catch (err) {
        console.error("Trainees stats error", err);
      }
    };

    fetchStats();

    return () => {
      active = false;
    };
  }, []);

  const getStatusColor = (isSubscribed: boolean) => {
    switch (isSubscribed) {
      case true:
        return "bg-success/10 text-success hover:bg-success/20";
      // case false:
      //   return "bg-warning/10 text-warning hover:bg-warning/20";
      case false:
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "bg-muted";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-secondary/10 text-secondary hover:bg-secondary/20";
      case "Intermediate":
        return "bg-primary/10 text-primary hover:bg-primary/20";
      case "Advanced":
        return "bg-success/10 text-success hover:bg-success/20";
      default:
        return "bg-muted";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const handleRefresh = () => {
    setTerm("");
    setPage(1);
  };

  const statsCards = [
    {
      title: "Total Trainees",
      value: stats.totalTrainees.toString(),
      change: "+12%",
      icon: Users,
    },
    {
      title: "Active Now",
      value: stats.activeTrainees.toString(),
      change: "+5%",
      icon: TrendingUp,
    },
    {
      title: "Sports Covered",
      value: stats.sportsCount.toString(),
      change: "+2",
      icon: Trophy,
    },
    {
      title: "Avg. Attendance",
      value: `${stats.averageAttendance}%`,
      change: "+3%",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Trainees Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all academy trainees
          </p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setModalOpen(true)}>
          <Plus className="h-5 w-5" />
          Add New Trainee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
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
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
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
                placeholder="Search trainees by name, email, or sport..."
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
              Filter by Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trainees.map((trainee) => (
          <Card key={trainee.id} className="card-athletic">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {getInitials(trainee.firstName + " " + trainee.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {trainee.firstName + " " + trainee.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm font-medium">
                        Age: {trainee.age} • Joined{" "}
                        {new Date(trainee.joinDate).getFullYear()}
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
                    <DropdownMenuItem
                      onClick={() => navigate(`/trainees/${trainee.id}`)}
                    >
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>View Attendance</DropdownMenuItem>
                    <DropdownMenuItem>View Payments</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Remove Trainee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{trainee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{trainee.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{trainee.branchName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {trainee.sportName}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={getLevelColor(trainee.skillLevel)}
                  >
                    {trainee.skillLevel}
                  </Badge>
                  <Badge className={getStatusColor(trainee.isSubscribed)}>
                    {trainee.isSubscribed ? "Subscribed" : "Not Subscribed"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Coach: {trainee.coachName}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Att: {trainee.attendanceRate}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Medical Info
                </p>
                <div className="flex flex-wrap gap-1">
                  {trainee.medicalConditions?.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                  {(!trainee.medicalConditions ||
                    trainee.medicalConditions.length === 0) && (
                    <span className="text-xs text-muted-foreground">
                      No medical conditions
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/trainees/${trainee.id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading trainees...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && trainees.length === 0 && (
        <Card className="card-athletic">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trainees found</h3>
              <p className="text-muted-foreground mb-4">
                {term
                  ? `No results for "${term}"`
                  : "Get started by adding your first trainee"}
              </p>
              {!term && (
                <Button variant="hero" onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trainee
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {trainees.length > 0 && (
        <BasePagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPage}
        />
      )}

      {/* Modal */}
      <TraineeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
