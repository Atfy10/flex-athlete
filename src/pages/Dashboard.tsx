import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/CardSkeleton";
import { SessionListItemSkeleton } from "@/components/ui/TableRowSkeleton";
import { useEffect, useState, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ClipboardCheck,
  Zap,
  BookOpen,
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
import { useNavigate } from "react-router-dom";
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
import { OperateGroupModal } from "@/components/modals/OperateGroupModal";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { getNotifications, NotificationDto } from "@/services/notifications.service";
import { TraineeFormModal } from "@/components/modals/TraineeFormModal";
import { EnrollmentFormModal } from "@/components/modals/EnrollmentFormModal";
import { CoachFormModal } from "@/components/modals/CoachFormModal";

// ─── Static meta ──────────────────────────────────────────────────────────────
const STATS_META = [
  { title: "Today's Trainees", icon: GraduationCap, change: "+12%", href: "/trainees?date=today" },
  { title: "Active Coaches",   icon: UserCheck,     change: "+5%",  href: "/coaches"              },
  { title: "Today's Sessions", icon: Calendar,      change: "+8%",  href: "/sessions?date=today"  },
  { title: "Attendance Rate",  icon: Activity,      change: "+2%",  href: "/attendance?date=today" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().split("T")[0];
}

/** Returns N consecutive months ending at a given offset from current month.
 *  offset=0 → includes current month as last; offset=-1 → current month is second-to-last, etc.
 */
function getMonthWindow(
  count: number,
  endOffset: number,
): { value: number; year: number; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + endOffset - (count - 1 - i), 1);
    return {
      value: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleString("en", { month: "short" }),
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operateOpen, setOperateOpen] = useState(false);

  // Scalar stats
  const [traineesCount,  setTraineesCount]  = useState(0);
  const [activeCoaches,  setActiveCoaches]  = useState(0);
  const [todayCount,     setTodayCount]     = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  // Sessions list
  const [sessions, setSessions] = useState<SessionVm[]>([]);

  // Activity feed
  const [activityItems,   setActivityItems]   = useState<NotificationDto[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Sport enrollments chart
  const [enrollmentData,  setEnrollmentData]  = useState<{ sport: string; enrolled: number }[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);

  // Attendance chart — month window controlled by offset
  const [attendanceData,    setAttendanceData]    = useState<{ month: string; attendance: number }[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [monthOffset,       setMonthOffset]       = useState(0); // 0 = ends at current month

  const MONTH_COUNT = 5;
  const page     = 1;
  const pageSize = 4;

  // ── Attendance chart fetch — refires when monthOffset changes ───────────────
  const loadAttendanceChart = useCallback(async (offset: number) => {
    setAttendanceLoading(true);
    try {
      const months = getMonthWindow(MONTH_COUNT, offset);
      const data = await Promise.all(
        months.map(async (m) => {
          const res = await getAverageAttendanceForMonth(String(m.value));
          return { month: m.label, attendance: res.data ?? 0 };
        }),
      );
      setAttendanceData(data);
    } catch {
      // silently keep previous data on error
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // ── Initial load (all other data) ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sportsRes, sessionsRes, coachesRes, attendanceRes, traineesRes] =
          await Promise.allSettled([
            getSports(),
            getTraineeGroupsForSpecificDay(todayIso(), page, pageSize),
            getActiveCoachesCount(),
            getAverageAttendance(),
            getTRaineesCountForSpecificDay(todayIso()),
          ]);

        if (sportsRes.status === "fulfilled" && sportsRes.value.isSuccess) {
          setEnrollmentLoading(true);
          const chartData = await Promise.all(
            sportsRes.value.data.map(async (sport) => {
              const res = await getEnrollments(sport.id);
              return { sport: sport.name, enrolled: res.data ?? 0 };
            }),
          );
          setEnrollmentData(chartData);
          setEnrollmentLoading(false);
        } else {
          setEnrollmentLoading(false);
        }

        if (sessionsRes.status === "fulfilled" && sessionsRes.value.isSuccess) {
          setSessions(mapSessions(sessionsRes.value.data.items));
          setTodayCount(sessionsRes.value.data.items.length);
        }
        if (coachesRes.status === "fulfilled" && coachesRes.value.isSuccess)
          setActiveCoaches(coachesRes.value.data);
        if (attendanceRes.status === "fulfilled" && attendanceRes.value.isSuccess)
          setAttendanceRate(attendanceRes.value.data);
        if (traineesRes.status === "fulfilled" && traineesRes.value.isSuccess)
          setTraineesCount(traineesRes.value.data);
      } finally {
        setLoading(false);
      }
    };

    load();
    loadAttendanceChart(0);

    // ── Activity feed — load latest notifications ──────────────────────────
    getNotifications(1, 10)
      .then((res) => {
        if (res.isSuccess) setActivityItems(res.data.items);
      })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch attendance chart when month window shifts
  const handleOffsetChange = (delta: number) => {
    const next = monthOffset + delta;
    setMonthOffset(next);
    loadAttendanceChart(next);
  };

  // ── Derive statsData during render ─────────────────────────────────────────
  const statsData = [
    { ...STATS_META[0], value: traineesCount.toString() },
    { ...STATS_META[1], value: activeCoaches.toString() },
    { ...STATS_META[2], value: todayCount.toString() },
    { ...STATS_META[3], value: `${attendanceRate}%` },
  ] as const;

  // Month range label for chart header
  const months = getMonthWindow(MONTH_COUNT, monthOffset);
  const rangeLabel = `${months[0].label} – ${months[MONTH_COUNT - 1].label}`;

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
              <Button
                variant="secondary-athletic"
                size="lg"
                onClick={() => setOperateOpen(true)}
              >
                <Play className="h-5 w-5" />
                Operate Group
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/trainee-groups")}
              >
                View Groups
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statsData.map((stat, index) => (
              <Card
                key={index}
                className="card-athletic cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
                onClick={() => navigate(stat.href)}
              >
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
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend with month range navigator */}
        <Card className="card-athletic">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Monthly Attendance Trends
              </CardTitle>
              {/* Month range navigator */}
              <div className="flex items-center gap-1 text-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleOffsetChange(-1)}
                  disabled={attendanceLoading}
                  title="Previous month window"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[110px] text-center text-xs text-muted-foreground font-medium tabular-nums">
                  {rangeLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleOffsetChange(1)}
                  disabled={attendanceLoading || monthOffset >= 0}
                  title="Next month window"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <ChartSkeleton type="line" />
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
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
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
            {enrollmentLoading ? (
              <ChartSkeleton type="bar" />
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/session-occurrences?date=${todayIso()}`)}
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SessionListItemSkeleton count={4} />
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
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    navigate(`/session-occurrences?date=${todayIso()}`)
                  }
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Operate Group Modal ──────────────────────────────────────────── */}
      <OperateGroupModal
        open={operateOpen}
        onOpenChange={setOperateOpen}
        onSuccess={() => setOperateOpen(false)}
      />

      {/* ── Recent Activity ──────────────────────────────────────────────── */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/notifications")}
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed items={activityItems} loading={activityLoading} limit={10} />
        </CardContent>
      </Card>
    </div>
  );
}
