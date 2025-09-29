import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Users, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("2024-03-15");

  // Mock attendance data
  const attendanceRecords = [
    {
      id: 1,
      session: {
        title: "Basketball Advanced",
        sport: "Basketball",
        coach: "John Smith",
        time: "09:00 AM",
        branch: "Main Campus"
      },
      trainees: [
        {
          id: 1,
          name: "Alex Thompson",
          avatar: "/api/placeholder/40/40",
          status: "Present",
          checkInTime: "08:55 AM"
        },
        {
          id: 2,
          name: "Sarah Wilson", 
          avatar: "/api/placeholder/40/40",
          status: "Late",
          checkInTime: "09:15 AM"
        },
        {
          id: 3,
          name: "Mike Johnson",
          avatar: "/api/placeholder/40/40",
          status: "Absent",
          checkInTime: null
        }
      ],
      totalEnrolled: 12,
      totalPresent: 9,
      totalLate: 2,
      totalAbsent: 1
    },
    {
      id: 2,
      session: {
        title: "Swimming Competitive",
        sport: "Swimming", 
        coach: "Maria Garcia",
        time: "10:30 AM",
        branch: "Main Campus"
      },
      trainees: [
        {
          id: 4,
          name: "Emma Davis",
          avatar: "/api/placeholder/40/40",
          status: "Present",
          checkInTime: "10:25 AM"
        },
        {
          id: 5,
          name: "David Chen",
          avatar: "/api/placeholder/40/40", 
          status: "Present",
          checkInTime: "10:28 AM"
        }
      ],
      totalEnrolled: 8,
      totalPresent: 7,
      totalLate: 0,
      totalAbsent: 1
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-success text-success-foreground";
      case "Late": return "bg-warning text-warning-foreground";
      case "Absent": return "bg-destructive text-destructive-foreground";
      case "Excused": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present": return <CheckCircle className="h-4 w-4" />;
      case "Late": return <Clock className="h-4 w-4" />;
      case "Absent": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAttendanceRate = (present: number, total: number) => {
    return Math.round((present / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage session attendance</p>
        </div>
        <Button className="btn-hero">
          <Plus className="h-4 w-4 mr-2" />
          Mark Attendance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">6 completed</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+3% from last week</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92</div>
            <p className="text-xs text-muted-foreground">Out of 105 expected</p>
          </CardContent>
        </Card>

        <Card className="card-athletic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
            <p className="text-xs text-muted-foreground">12.4% absence rate</p>
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
                placeholder="Search sessions or trainees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Attendance */}
      <div className="space-y-6">
        {attendanceRecords.map((record) => (
          <Card key={record.id} className="card-athletic">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{record.session.title}</CardTitle>
                  <p className="text-muted-foreground">
                    {record.session.coach} • {record.session.time} • {record.session.branch}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {record.totalPresent + record.totalLate}/{record.totalEnrolled} Present
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getAttendanceRate(record.totalPresent + record.totalLate, record.totalEnrolled)}% attendance
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Attendance
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Attendance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">{record.totalPresent}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">{record.totalLate}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{record.totalAbsent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{record.totalEnrolled}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {/* Individual Attendance */}
              <div className="space-y-3">
                <h4 className="font-medium">Individual Attendance</h4>
                <div className="grid gap-3">
                  {record.trainees.map((trainee) => (
                    <div key={trainee.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={trainee.avatar} alt={trainee.name} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                            {getInitials(trainee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{trainee.name}</p>
                          {trainee.checkInTime && (
                            <p className="text-xs text-muted-foreground">
                              Check-in: {trainee.checkInTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(trainee.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(trainee.status)}
                          {trainee.status}
                        </div>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Attendance;