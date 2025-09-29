import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Filter,
  Clock,
  MapPin,
  Users,
  Calendar,
  Trophy,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sessions = [
  {
    id: 1,
    title: "Basketball Training - Intermediate",
    sport: "Basketball",
    coach: "Mike Johnson",
    date: "2024-01-15",
    time: "09:00 AM - 11:00 AM",
    duration: 120,
    branch: "Downtown",
    capacity: 20,
    enrolled: 18,
    level: "Intermediate",
    status: "Upcoming",
  },
  {
    id: 2,
    title: "Swimming Fundamentals",
    sport: "Swimming",
    coach: "Sarah Davis",
    date: "2024-01-15",
    time: "10:30 AM - 12:00 PM",
    duration: 90,
    branch: "North Side",
    capacity: 15,
    enrolled: 12,
    level: "Beginner",
    status: "Upcoming",
  },
  {
    id: 3,
    title: "Tennis Private Lessons",
    sport: "Tennis",
    coach: "Carlos Rodriguez",
    date: "2024-01-15",
    time: "02:00 PM - 03:30 PM",
    duration: 90,
    branch: "East Branch",
    capacity: 8,
    enrolled: 6,
    level: "Advanced",
    status: "In Progress",
  },
  {
    id: 4,
    title: "Soccer Team Practice",
    sport: "Soccer",
    coach: "Emma Wilson",
    date: "2024-01-15",
    time: "04:00 PM - 06:00 PM",
    duration: 120,
    branch: "Downtown",
    capacity: 25,
    enrolled: 22,
    level: "Mixed",
    status: "Upcoming",
  },
  {
    id: 5,
    title: "Volleyball Skills Workshop",
    sport: "Volleyball",
    coach: "Alex Thompson",
    date: "2024-01-14",
    time: "03:00 PM - 05:00 PM",
    duration: 120,
    branch: "North Side",
    capacity: 16,
    enrolled: 14,
    level: "Intermediate",
    status: "Completed",
  },
];

const stats = [
  { title: "Today's Sessions", value: "24", icon: Calendar },
  { title: "Active Coaches", value: "18", icon: Users },
  { title: "Total Capacity", value: "340", icon: Trophy },
  { title: "Enrollment Rate", value: "87%", icon: Clock },
];

export default function Sessions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("2024-01-15");

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.coach.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-primary/10 text-primary hover:bg-primary/20";
      case "In Progress":
        return "bg-success/10 text-success hover:bg-success/20";
      case "Completed":
        return "bg-muted text-muted-foreground hover:bg-muted/80";
      case "Cancelled":
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
      case "Mixed":
        return "bg-warning/10 text-warning hover:bg-warning/20";
      default:
        return "bg-muted";
    }
  };

  const getCapacityColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Sessions Management</h1>
          <p className="text-muted-foreground">Schedule and manage training sessions</p>
        </div>
        <Button variant="hero" size="lg">
          <Plus className="h-5 w-5" />
          Schedule New Session
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
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search sessions by title, sport, or coach..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
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

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSessions.map((session) => (
          <Card key={session.id} className="card-athletic">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-medium">
                      {session.sport}
                    </Badge>
                    <Badge className={getLevelColor(session.level)}>
                      {session.level}
                    </Badge>
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
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Session</DropdownMenuItem>
                    <DropdownMenuItem>Mark Attendance</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Cancel Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{session.time} ({session.duration} min)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Coach: {session.coach}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{session.branch}</span>
                </div>
              </div>

              {/* Capacity and Status */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enrollment</span>
                  <span className={`text-sm font-medium ${getCapacityColor(session.enrolled, session.capacity)}`}>
                    {session.enrolled}/{session.capacity}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(session.enrolled / session.capacity) * 100}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((session.enrolled / session.capacity) * 100)}% full
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="default" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}