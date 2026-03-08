import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/CardSkeleton";
import { SessionListItemSkeleton } from "@/components/ui/TableRowSkeleton";
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
import { mapSessions, SessionVm } from "@/lib/mappers";
import { getActiveCoachesCount } from "@/services/coaches.service";
import { getSports } from "@/services/sport.services";
import { getEnrollments } from "@/services/enrollment.services";
import {
  getAverageAttendance,
  getAverageAttendanceForMonth,
} from "@/services/attendance.services";
import { getTRaineesCountForSpecificDay } from "@/services/trainee.service";
import { getTraineeGroupsForSpecificDay } from "@/services/traineeGroup.services";

// ─── Static meta (no mutable state) ───────────────────────────────────────────
const STATS_META = [
  { title: "Today's Trainees", icon: GraduationCap, change: "+12%" },
  { title: "Active Coaches",   icon: UserCheck,     change: "+5%"  },
  { title: "Today's Sessions", icon: Calendar,      change: "+8%"  },
  { title: "Attendance Rate",  icon: Activity,      change: "+2%"  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function getLastFiveMonths(): { value: number; label: string }[] {
  const now = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    return {
      value: d.getMonth() + 1,
      label: d.toLocaleString("en", { month: "short" }),
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Scalar stats — all derived from API
  const [traineesCount,  setTraineesCount]  = useState(0);
  const [activeCoaches,  setActiveCoaches]  = useState(0);
  const [todayCount,     setTodayCount]     = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  // Chart data
  const [sessions,        setSessions]        = useState<SessionVm[]>([]);
  const [enrollmentData,  setEnrollmentData]  = useState<{ sport: string; enrolled: number }[]>([]);
  const [attendanceData,  setAttendanceData]  = useState<{ month: string; attendance: number }[]>([]);

  const page     = 1;
  const pageSize = 4;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const months = getLastFiveMonths();

        // ── Wave 1: all independent calls in parallel ────────────────────────
        const [
          attendanceChart,
          sportsRes,
          sessionsRes,
          coachesRes,
          attendanceRes,
          traineesRes,
        ] = await Promise.all([
          // attendance chart (inner calls are also parallel)
          Promise.all(
            months.map(async (m) => {
              const res = await getAverageAttendanceForMonth(String(m.value));
              return { month: m.label, attendance: res.data ?? 0 };
            }),
          ),
          getSports(),
          getTraineeGroupsForSpecificDay(todayIso(), page, pageSize),
          getActiveCoachesCount(),
          getAverageAttendance(),
          getTRaineesCountForSpecificDay(todayIso()),
        ]);

        // ── Wave 2: sport enrollments depend on sportsRes ────────────────────
        if (sportsRes.isSuccess) {
          const chartData = await Promise.all(
            sportsRes.data.map(async (sport) => {
              const res = await getEnrollments(sport.id);
              return { sport: sport.name, enrolled: res.data ?? 0 };
            }),
          );
          setEnrollmentData(chartData);
        }

        // ── Apply results ────────────────────────────────────────────────────
        setAttendanceData(attendanceChart);

        if (sessionsRes.isSuccess) {
          setSessions(mapSessions(sessionsRes.data.items));
          setTodayCount(sessionsRes.data.items.length);
        }
        if (coachesRes.isSuccess)  setActiveCoaches(coachesRes.data);
        if (attendanceRes.isSuccess) setAttendanceRate(attendanceRes.data);
        if (traineesRes.isSuccess) setTraineesCount(traineesRes.data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ── Derive statsData during render — no mutable module-level state ──────────
  const statsData = [
    { ...STATS_META[0], value: traineesCount.toString() },
    { ...STATS_META[1], value: activeCoaches.toString() },
    { ...STATS_META[2], value: todayCount.toString() },
    { ...STATS_META[3], value: `${attendanceRate}%` },
  ] as const;

  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Sport Academy Facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
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

      {/* ── Stats Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="card-athletic">
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Monthly Attendance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex flex-col gap-3 justify-end pb-4">
                {[40, 55, 70, 60, 80].map((h, i) => (
                  <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Sport Enrollments */}
        <Card className="card-athletic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Sport Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-end gap-3 pb-4 px-2">
                {[60, 90, 50, 75, 40].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Today's Sessions ─────────────────────────────────────────────── */}
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
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No sessions scheduled for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
