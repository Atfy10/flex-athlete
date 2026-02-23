import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  GraduationCap,
  Calendar,
  TrendingUp,
  Activity,
  MapPin,
  Trophy,
  Play,
  ArrowRight,
} from "lucide-react";
import heroImage from "@/assets/hero-academy.jpg";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ApiResult, PagedData } from "@/types/api";
import { SportDto } from "@/types/SportDto";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";
import { mapSessions, getSessionsCount, SessionVm } from "@/lib/mappers";
import { apiFetch } from "@/lib/api";
import { getActiveCoachesCount } from "@/services/employees.service";

const statsData = [
  {
    title: "Total Trainees",
    value: "1,247",
    icon: GraduationCap,
    change: "+12%",
  },
  { title: "Active Coaches", value: "89", icon: UserCheck, change: "+5%" },
  { title: "Today's Sessions", value: "24", icon: Calendar, change: "+8%" },
  { title: "Attendance Rate", value: "94%", icon: Activity, change: "+2%" },
];

const attendanceDummyData = [
  { month: "Jan", attendance: 85 },
  { month: "Feb", attendance: 88 },
  { month: "Mar", attendance: 92 },
  { month: "Apr", attendance: 89 },
  { month: "May", attendance: 94 },
  { month: "Jun", attendance: 96 },
];

const enrollmentDummyData = [
  { sport: "Basketball", enrolled: 320 },
  { sport: "Soccer", enrolled: 280 },
  { sport: "Tennis", enrolled: 180 },
  { sport: "Swimming", enrolled: 220 },
  { sport: "Volleyball", enrolled: 160 },
];

const upcomingSessions = [
  {
    id: 1,
    sport: "Basketball",
    time: "09:00 AM",
    coach: "Mike Johnson",
    trainees: 15,
    branch: "Downtown",
  },
  {
    id: 2,
    sport: "Swimming",
    time: "10:30 AM",
    coach: "Sarah Davis",
    trainees: 12,
    branch: "North Side",
  },
  {
    id: 3,
    sport: "Tennis",
    time: "02:00 PM",
    coach: "Carlos Rodriguez",
    trainees: 8,
    branch: "East Branch",
  },
  {
    id: 4,
    sport: "Soccer",
    time: "04:00 PM",
    coach: "Emma Wilson",
    trainees: 22,
    branch: "Downtown",
  },
];

const recentActivities = [
  {
    type: "enrollment",
    message: "New trainee enrolled in Basketball program",
    time: "5 minutes ago",
  },
  {
    type: "session",
    message: "Swimming session completed with 95% attendance",
    time: "1 hour ago",
  },
  {
    type: "coach",
    message: "New coach Alex Thompson joined Tennis program",
    time: "2 hours ago",
  },
  {
    type: "achievement",
    message: "Monthly attendance goal reached!",
    time: "1 day ago",
  },
];

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionVm[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [activeCoaches, setActiveCoaches] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [traineesCount, setTraineesCount] = useState<number>(0);
  const [enrollmentData, setEnrollmentData] = useState<
    { sport: string; enrolled: number }[]
  >([]);
  const [attendanceData, setAttendanceData] = useState<
    { month: string; attendance: number }[]
  >([]);

  const page = 1;
  const pageSize = 4;
  useEffect(() => {
    const load = async () => {
      const months = getLastFiveMonths();

      const attendanceChart = await Promise.all(
        months.map(async (m) => {
          const res = await apiFetch<ApiResult<number>>(
            `/api/Attendance/rate?month=${m.value}`,
          );

          return {
            month: m.label,
            attendance: res.data ?? 0,
          };
        }),
      );

      setAttendanceData(attendanceChart);

      const sportsRes = await apiFetch<ApiResult<SportDto[]>>(
        "/api/Sports/get-all",
      );

      let chartData: { sport: string; enrolled: number }[] = [];

      if (sportsRes.isSuccess) {
        chartData = await Promise.all(
          sportsRes.data.map(async (sport) => {
            const res = await apiFetch<ApiResult<number>>(
              `/api/Enrollment/sports/${sport.id}/enrollments/count?from=2024-01-01`,
            );

            return {
              sport: sport.name,
              enrolled: res.data ?? 0,
            };
          }),
        );
      }

      const [sessionsRes, coachesRes, attendanceRes, traineesRes] =
        await Promise.all([
          apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
            `/api/TraineeGroup/get-all-for-specific-day?date=${todayIso()}&page=${page}&pageSize=${pageSize}`,
          ),
          getActiveCoachesCount(),
          apiFetch<ApiResult<number>>("/api/Attendance/rate"),
          apiFetch<ApiResult<number>>(
            `/api/Trainee/get-count-for-specific-day?date=${todayIso()}`,
          ),
        ]);

      setEnrollmentData(chartData);

      if (sessionsRes.isSuccess) {
        setSessions(mapSessions(sessionsRes.data.items));
        setTodayCount(sessionsRes.data.items.length);
      }

      if (coachesRes.isSuccess) {
        setActiveCoaches(coachesRes.data);
      }

      if (attendanceRes.isSuccess) {
        setAttendanceRate(attendanceRes.data);
      }

      if (traineesRes.isSuccess) {
        setTraineesCount(traineesRes.data);
      }
    };

    load();
  }, []);

  statsData[0].value = traineesCount.toString();
  statsData[1].value = activeCoaches.toString();
  statsData[2].value = todayCount.toString();
  statsData[3].value = attendanceRate.toString() + "%";

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Sport Academy Facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40"></div>
        </div>
        <div className="relative p-8 md:p-12 text-primary-foreground">
          <div className="max-w-2xl">
            <h1 className="text-hero mb-4">
              Sport Academy <span className="text-secondary">Dashboard</span>
            </h1>
            <p className="text-xl mb-6 text-primary-foreground/90">
              Manage your academy operations, track performance, and oversee all
              athletic programs in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary-athletic" size="lg">
                <Play className="h-5 w-5" />
                Operate Group
              </Button>
              <Button variant="hero" size="lg">
                View Reports
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-success/10 text-success hover:bg-success/20"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Monthly Attendance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                attendance: {
                  label: "Attendance %",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Enrollment Chart */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Sport Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                enrolled: {
                  label: "Enrolled",
                  color: "hsl(var(--secondary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData}>
                  <XAxis
                    dataKey="sport"
                    tickFormatter={(v) =>
                      v.length > 10 ? v.substring(0, 8) + ".." : v
                    }
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="enrolled"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sessions and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Sessions
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-medium">
                      {session.sport}
                    </Badge>
                    <span className="text-sm font-medium">{session.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coach: {session.coach}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {session.trainees} trainees
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.branch}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  {activity.type === "enrollment" && (
                    <UserCheck className="h-4 w-4 text-primary" />
                  )}
                  {activity.type === "session" && (
                    <Calendar className="h-4 w-4 text-primary" />
                  )}
                  {activity.type === "coach" && (
                    <Users className="h-4 w-4 text-primary" />
                  )}
                  {activity.type === "achievement" && (
                    <Trophy className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function todayIso() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getLastFiveMonths(): { value: number; label: string }[] {
  const now = new Date();
  const months: { value: number; label: string }[] = [];

  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      value: d.getMonth() + 1,
      label: d.toLocaleString("en", { month: "short" }), // Jan Feb Mar
    });
  }

  return months;
}
