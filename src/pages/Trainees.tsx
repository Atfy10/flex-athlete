import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp
} from "lucide-react";
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

const trainees = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@email.com",
    phone: "+1 (555) 123-4567",
    age: 16,
    joinDate: "2024-01-15",
    sport: "Basketball",
    level: "Intermediate",
    attendanceRate: 95,
    branch: "Downtown",
    status: "Active",
  },
  {
    id: 2,
    name: "Marcus Thompson",
    email: "marcus.t@email.com",
    phone: "+1 (555) 234-5678",
    age: 14,
    joinDate: "2024-02-20",
    sport: "Soccer",
    level: "Beginner",
    attendanceRate: 88,
    branch: "North Side",
    status: "Active",
  },
  {
    id: 3,
    name: "Sofia Rodriguez",
    email: "sofia.rodriguez@email.com",
    phone: "+1 (555) 345-6789",
    age: 17,
    joinDate: "2023-09-10",
    sport: "Tennis",
    level: "Advanced",
    attendanceRate: 92,
    branch: "East Branch",
    status: "Active",
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.kim@email.com",
    phone: "+1 (555) 456-7890",
    age: 15,
    joinDate: "2024-03-05",
    sport: "Swimming",
    level: "Intermediate",
    attendanceRate: 97,
    branch: "Downtown",
    status: "Active",
  },
  {
    id: 5,
    name: "Emma Davis",
    email: "emma.davis@email.com",
    phone: "+1 (555) 567-8901",
    age: 13,
    joinDate: "2024-01-30",
    sport: "Volleyball",
    level: "Beginner",
    attendanceRate: 85,
    branch: "North Side",
    status: "On Hold",
  },
];

const stats = [
  { title: "Total Trainees", value: "1,247", change: "+12%", icon: Trophy },
  { title: "Active Programs", value: "5", change: "+1", icon: Calendar },
  { title: "Avg. Attendance", value: "91%", change: "+3%", icon: TrendingUp },
  { title: "New This Month", value: "48", change: "+18%", icon: Plus },
];

export default function Trainees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");

  const filteredTrainees = trainees.filter(trainee => 
    trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/10 text-success hover:bg-success/20";
      case "On Hold":
        return "bg-warning/10 text-warning hover:bg-warning/20";
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Trainees Management</h1>
          <p className="text-muted-foreground">Manage and track all academy trainees</p>
        </div>
        <Button variant="hero" size="lg">
          <Plus className="h-5 w-5" />
          Add New Trainee
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
                  <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 mt-2">
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

      {/* Filters and Search */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search trainees by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Trainees Table */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>All Trainees ({filteredTrainees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Sport & Level</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainees.map((trainee) => (
                  <TableRow key={trainee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{trainee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Age: {trainee.age} • Joined {new Date(trainee.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {trainee.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {trainee.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge variant="outline" className="font-medium">
                          {trainee.sport}
                        </Badge>
                        <Badge variant="secondary" className={getLevelColor(trainee.level)}>
                          {trainee.level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {trainee.branch}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{trainee.attendanceRate}%</div>
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${trainee.attendanceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(trainee.status)}>
                        {trainee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem>View Attendance</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Remove Trainee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}