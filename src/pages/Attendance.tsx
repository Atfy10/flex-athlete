import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceSessionSkeleton, StatCardSkeleton } from "@/components/ui/CardSkeleton";
import { RosterRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  Users,
  Search,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MapPin,
  Trophy,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import {
  getSessionOccurrencesByDate,
  getAttendanceBySession,
  getAverageAttendance,
} from "@/services/attendance.services";
import {
  SessionOccurrenceDto,
  AttendanceRecordDto,
  AttendanceStatus,
} from "@/types/AttendanceDto";
import { MarkAttendanceModal } from "@/components/modals/MarkAttendanceModal";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { useSortable } from "@/hooks/useSortable";
import { RowActions } from "@/components/ui/RowActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(t: string) {
  return t?.slice(0, 5) ?? "";
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function attendanceRate(present: number, late: number, total: number) {
  if (!total) return 0;
  return Math.round(((present + late) / total) * 100);
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  Present: {
    label: "Present",
    color: "bg-success/10 text-success border-success/20",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  Late: {
    label: "Late",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Absent: {
    label: "Absent",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  Excused: {
    label: "Excused",
    color: "bg-muted text-muted-foreground",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

// (SessionCardSkeleton and RosterSkeleton are now imported from CardSkeleton/TableRowSkeleton)

// ─── Attendance roster row ────────────────────────────────────────────────────
function AttendeeRow({ record }: { record: AttendanceRecordDto }) {
  const cfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.Absent;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
            {getInitials(record.traineeName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{record.traineeName}</p>
          {record.checkInTime && (
            <p className="text-xs text-muted-foreground">
              Check-in: {formatTime(record.checkInTime)}
            </p>
          )}
        </div>
      </div>
      <Badge className={`${cfg.color} flex items-center gap-1 text-xs`}>
        {cfg.icon}
        {cfg.label}
      </Badge>
    </div>
  );
}

// ─── Roster skeleton ─────────────────────────────────────────────────────────
// RosterSkeleton → now imported as RosterRowSkeleton from TableRowSkeleton

// ─── Session Attendance Card ──────────────────────────────────────────────────
function SessionAttendanceCard({
  session,
  searchTerm,
  onMarkAttendance,
}: {
  session: SessionOccurrenceDto;
  searchTerm: string;
  onMarkAttendance?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [roster, setRoster] = useState<AttendanceRecordDto[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterLoaded, setRosterLoaded] = useState(false);

  const loadRoster = useCallback(async () => {
    if (rosterLoaded) return;
    setRosterLoading(true);
    try {
      const res = await getAttendanceBySession(session.id);
      if (res.isSuccess) setRoster(res.data);
    } finally {
      setRosterLoading(false);
      setRosterLoaded(true);
    }
  }, [session.id, rosterLoaded]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadRoster();
  };

  const rate = attendanceRate(session.totalPresent, session.totalLate, session.totalEnrolled);

  const filteredRoster = searchTerm.trim().length >= 2
    ? roster.filter((r) =>
        r.traineeName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : roster;

  return (
    <Card className="card-athletic overflow-hidden">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Session info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              {session.sportName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {session.coachName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(session.startTime)} ({formatDuration(session.durationInMinutes)})
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {session.branchName}
              </span>
            </div>
          </div>

          {/* Summary counters */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="px-3 py-2 rounded-lg bg-success/10">
                <p className="text-lg font-bold text-success">{session.totalPresent}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="px-3 py-2 rounded-lg bg-warning/10">
                <p className="text-lg font-bold text-warning">{session.totalLate}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div className="px-3 py-2 rounded-lg bg-destructive/10">
                <p className="text-lg font-bold text-destructive">{session.totalAbsent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="px-3 py-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{session.totalEnrolled}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Rate + actions */}
            <div className="flex flex-col items-end gap-2">
              <Badge
                className={
                  rate >= 80
                    ? "bg-success/10 text-success border-success/20"
                    : rate >= 60
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }
              >
                {rate}%
              </Badge>
              <Button
                variant="default"
                size="sm"
                onClick={() => onMarkAttendance?.()}
                className="flex items-center gap-1.5 text-xs"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Mark
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggle}
                className="flex items-center gap-1.5 text-xs"
              >
                {expanded ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> Roster</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Expandable roster */}
      {expanded && (
        <CardContent className="pt-0">
          {rosterLoading ? (
            <RosterRowSkeleton />
          ) : filteredRoster.length === 0 ? (
            <div className="pt-4 border-t border-border text-center py-8 text-muted-foreground text-sm">
              {roster.length === 0
                ? "No attendance records found for this session."
                : "No trainees match the search term."}
            </div>
          ) : (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
                Attendance Roster — {filteredRoster.length} trainees
              </p>
              {filteredRoster.map((r) => (
                <AttendeeRow key={r.id} record={r} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// StatSkeleton → now imported as StatCardSkeleton from CardSkeleton

// ─── Main Page ────────────────────────────────────────────────────────────────
const Attendance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [markOpen, setMarkOpen] = useState(false);
  const [markSession, setMarkSession] = useState<SessionOccurrenceDto | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const { sort, toggle: toggleSort, sortItems } = useSortable<"sportName" | "coachName" | "branchName" | "startTime" | "durationInMinutes" | "totalPresent" | "totalEnrolled">();

  // Sessions for selected date
  const [sessions, setSessions] = useState<SessionOccurrenceDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Stat: overall attendance rate
  const [avgRate, setAvgRate] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Fetch sessions for selected date ─────────────────────────────────────
  const loadSessions = useCallback(async (date: string) => {
    setSessionsLoading(true);
    setSessions([]);
    try {
      const res = await getSessionOccurrencesByDate(date);
      if (res.isSuccess) setSessions(res.data.items);
      else toast({ title: "Failed to load sessions.", variant: "destructive" });
    } catch {
      toast({ title: "Failed to load sessions.", variant: "destructive" });
    } finally {
      setSessionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSessions(selectedDate);
  }, [selectedDate, loadSessions]);

  // ── Fetch overall stats ───────────────────────────────────────────────────
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const res = await getAverageAttendance();
        if (res.isSuccess) setAvgRate(res.data);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  // Derive stat values from loaded sessions
  const todayTotal    = sessions.length;
  const todayPresent  = sessions.reduce((s, r) => s + r.totalPresent + r.totalLate, 0);
  const todayAbsent   = sessions.reduce((s, r) => s + r.totalAbsent, 0);
  const todayEnrolled = sessions.reduce((s, r) => s + r.totalEnrolled, 0);

type AttendanceSortKey = "sportName" | "coachName" | "branchName" | "startTime" | "durationInMinutes" | "totalPresent" | "totalEnrolled";

  // Filter sessions by search term (session-level: sport, coach, branch)
  const filteredSessions =
    searchTerm.trim().length >= 2
      ? sessions.filter(
          (s) =>
            s.sportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.coachName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.branchName.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : sessions;

  const visibleSessions = sortItems(filteredSessions, (s, key) => {
    const v = (s as unknown as Record<string, unknown>)[key] ?? "";
    return typeof v === "number" ? v : String(v);
  });

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Attendance Management</h1>
          <p className="text-muted-foreground">Track and review session attendance by date</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSessions(selectedDate)}
          disabled={sessionsLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${sessionsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsLoading || sessionsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <Card className="card-athletic">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayTotal}</div>
                <p className="text-xs text-muted-foreground">
                  for{" "}
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>

            <Card className="card-athletic">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgRate !== null ? `${avgRate}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">all-time average</p>
              </CardContent>
            </Card>

            <Card className="card-athletic">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayPresent}</div>
                <p className="text-xs text-muted-foreground">
                  out of {todayEnrolled} expected
                </p>
              </CardContent>
            </Card>

            <Card className="card-athletic">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAbsent}</div>
                <p className="text-xs text-muted-foreground">
                  {todayEnrolled > 0
                    ? `${Math.round((todayAbsent / todayEnrolled) * 100)}% absence rate`
                    : "no sessions loaded"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Date Picker & Search ────────────────────────────────────────── */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Shadcn Popover/Calendar date picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-auto min-w-[160px] justify-start font-normal"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {selectedDate
                    ? format(new Date(selectedDate + "T00:00:00"), "MMM d, yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setSelectedDate(format(d, "yyyy-MM-dd"));
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sport, coach, or branch…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Session count badge */}
            {!sessionsLoading && sessions.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium whitespace-nowrap">
                <Users className="h-4 w-4" />
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </div>
            )}

            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </CardContent>
      </Card>

      {/* ── Session Cards / Table ────────────────────────────────────────── */}
      {sessionsLoading ? (
        view === "grid" ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <AttendanceSessionSkeleton key={i} />)}
          </div>
        ) : (
          <Card className="card-athletic">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Sport", "Coach", "Branch", "Time", "Duration", "Present", "Late", "Absent", "Rate", ""].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : visibleSessions.length === 0 ? (
        searchTerm.trim().length >= 2 ? (
          <EmptyState
            icon={Search}
            title={`No sessions match "${searchTerm}"`}
            description="Try a different search term or clear the search."
            actions={[
              { label: "Clear Search", onClick: () => setSearchTerm(""), variant: "outline" },
            ]}
          />
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title={`No sessions on ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
            description="No sessions were recorded for this date. Generate sessions or pick a different date."
            actions={[
              { label: "Generate Sessions", onClick: () => navigate("/sessions") },
              { label: "Go to Today", onClick: () => setSelectedDate(todayIso()), variant: "outline" },
            ]}
          />
        )
      ) : view === "grid" ? (
        <div className="space-y-4">
          {visibleSessions.map((session) => (
            <SessionAttendanceCard
              key={session.id}
              session={session}
              searchTerm={searchTerm}
              onMarkAttendance={() => { setMarkSession(session); setMarkOpen(true); }}
            />
          ))}
        </div>
      ) : (
        <Card className="card-athletic">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {(
                    [
                      { label: "Sport", key: "sportName" },
                      { label: "Coach", key: "coachName" },
                      { label: "Branch", key: "branchName" },
                      { label: "Time", key: "startTime" },
                      { label: "Duration", key: "durationInMinutes" },
                      { label: "Present", key: "totalPresent" },
                      { label: "Enrolled", key: "totalEnrolled" },
                    ] as { label: string; key: AttendanceSortKey }[]
                  ).map(({ label, key }) => (
                    <SortableTableHead key={key} col={key} label={label} sort={sort} onSort={toggleSort} />
                  ))}
                  <TableHead>Late</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSessions.map((session) => {
                  const rate = session.totalEnrolled > 0
                    ? Math.round(((session.totalPresent + session.totalLate) / session.totalEnrolled) * 100)
                    : null;
                  const rateColor = rate === null ? "bg-muted text-muted-foreground"
                    : rate >= 80 ? "bg-success/10 text-success border-success/20"
                    : rate >= 60 ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-destructive/10 text-destructive border-destructive/20";
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.sportName}</TableCell>
                      <TableCell>{session.coachName}</TableCell>
                      <TableCell>{session.branchName}</TableCell>
                      <TableCell>{formatTime(session.startTime)}</TableCell>
                      <TableCell>{formatDuration(session.durationInMinutes)}</TableCell>
                      <TableCell><span className="text-success font-medium">{session.totalPresent}</span></TableCell>
                      <TableCell><span className="text-warning font-medium">{session.totalLate}</span></TableCell>
                      <TableCell><span className="text-destructive font-medium">{session.totalAbsent}</span></TableCell>
                      <TableCell>
                        {rate !== null ? (
                          <Badge className={`${rateColor} text-xs`}>{rate}%</Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => { setMarkSession(session); setMarkOpen(true); }}>
                          <ClipboardList className="h-3.5 w-3.5 mr-1" />Mark
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Mark Attendance Modal ───────────────────────────────────────── */}
      <MarkAttendanceModal
        open={markOpen}
        onOpenChange={setMarkOpen}
        onSuccess={() => loadSessions(selectedDate)}
        sessionOccurrenceId={markSession?.id}
        sessionLabel={
          markSession
            ? `${markSession.sportName} — ${formatTime(markSession.startTime)}`
            : undefined
        }
      />
    </div>
  );
};

export default Attendance;
