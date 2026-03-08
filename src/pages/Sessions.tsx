import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionCardSkeleton, StatCardSkeleton } from "@/components/ui/CardSkeleton";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import {
  Plus,
  Clock,
  MapPin,
  Users,
  Calendar,
  Trophy,
  MoreHorizontal,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listSessions,
  searchSessions,
  getSessionsByDate,
  countSessions,
} from "@/services/session.services";
import { SessionCardDto } from "@/types/SessionCardDto";
import { OperateGroupModal } from "@/components/modals/OperateGroupModal";
import { MarkAttendanceModal } from "@/components/modals/MarkAttendanceModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(time: string) {
  return time?.slice(0, 5) ?? "";
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getCapacityColor(count: number) {
  return count > 0 ? "text-success" : "text-muted-foreground";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Stats meta ───────────────────────────────────────────────────────────────
const STATS_META = [
  { title: "Total Sessions", icon: Calendar },
  { title: "Today's Groups", icon: Layers },
  { title: "Active Coaches", icon: Users },
  { title: "Avg. Duration", icon: Clock },
] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Sessions() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [useDate, setUseDate]           = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);

  // Stats
  const [totalSessions,  setTotalSessions]  = useState<number | null>(null);
  const [todayGroupCount, setTodayGroupCount] = useState<number | null>(null);

  // Date-filtered mode uses a separate local state
  const [dateItems,      setDateItems]      = useState<SessionCardDto[]>([]);
  const [dateLoading,    setDateLoading]    = useState(false);
  const [datePage,       setDatePage]       = useState(1);
  const [dateTotalPages, setDateTotalPages] = useState(1);
  const DATE_PAGE_SIZE = 9;

  // ── useEntitySearch — search / list mode ────────────────────────────────
  const stableListSessions   = useCallback(listSessions,   []);
  const stableSearchSessions = useCallback(searchSessions, []);

  const {
    items: searchItems,
    loading: searchLoading,
    term,
    setTerm,
    page,
    setPage,
    totalPages,
    refresh,
  } = useEntitySearch<SessionCardDto>({
    listFn:   stableListSessions,
    searchFn: stableSearchSessions,
    pageSize: 9,
  });

  // Derived display values
  const items          = useDate ? dateItems      : searchItems;
  const loading        = useDate ? dateLoading    : searchLoading;
  const currentPage    = useDate ? datePage       : page;
  const currentTotal   = useDate ? dateTotalPages : totalPages;
  const setCurrentPage = useDate ? setDatePage    : setPage;

  // ── Stats fetch ──────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    const [total, todayRes] = await Promise.allSettled([
      countSessions(),
      getSessionsByDate(todayIso(), 1, 1),
    ]);
    if (total.status === "fulfilled" && total.value.isSuccess)
      setTotalSessions(total.value.data);
    if (todayRes.status === "fulfilled" && todayRes.value.isSuccess)
      setTodayGroupCount(todayRes.value.data.totalCount);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Date-mode fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!useDate) return;
    let active = true;
    const load = async () => {
      setDateLoading(true);
      try {
        const res = await getSessionsByDate(selectedDate, datePage, DATE_PAGE_SIZE);
        if (!active) return;
        if (res.isSuccess) {
          setDateItems(res.data.items);
          setDateTotalPages(Math.max(1, Math.ceil(res.data.totalCount / DATE_PAGE_SIZE)));
        } else {
          setDateItems([]);
          setDateTotalPages(1);
        }
      } finally {
        if (active) setDateLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [useDate, selectedDate, datePage]);

  // Reset date page when date changes
  useEffect(() => { setDatePage(1); }, [selectedDate]);

  // ── onSuccess callback — refresh list + stats ────────────────────────────
  const handleGenerateSuccess = useCallback(() => {
    refresh();
    loadStats();
  }, [refresh, loadStats]);

  // Mark attendance state for sessions page
  const [markOpen, setMarkOpen] = useState(false);
  const [markSessionId, setMarkSessionId] = useState<number | undefined>(undefined);
  const [markSessionLabel, setMarkSessionLabel] = useState<string | undefined>(undefined);

  const openMarkAttendance = useCallback((session: SessionCardDto) => {
    setMarkSessionId(session.id);
    setMarkSessionLabel(`${session.sportName} — ${formatTime(session.startTime)}`);
    setMarkOpen(true);
  }, []);

  const statsValues = [
    totalSessions   != null ? String(totalSessions)   : "—",
    todayGroupCount != null ? String(todayGroupCount) : "—",
    "—",
    "—",
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Sessions Management</h1>
          <p className="text-muted-foreground">Operate groups to generate training session occurrences</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setModalOpen(true)}>
          <Plus className="h-5 w-5" />
          Operate Group
        </Button>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_META.map((meta, i) =>
          statsValues[i] === "—" ? (
            <StatCardSkeleton key={i} />
          ) : (
            <Card key={i} className="card-athletic">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{meta.title}</p>
                    <p className="text-2xl font-bold mt-1">{statsValues[i]}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <meta.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* ── Search & Date Filter ────────────────────────────────────────── */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterBar
            searchValue={term}
            onSearchChange={(v) => {
              setTerm(v);
              if (useDate) setUseDate(false);
            }}
            searchPlaceholder="Search by sport, coach, or branch…"
            extra={
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setUseDate(true);
                  setTerm("");
                }}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-auto"
              />
            }
            onReset={() => {
              setTerm("");
              setUseDate(false);
            }}
            hasActiveFilters={term !== "" || useDate}
          />
          {useDate && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing sessions for <span className="font-medium">{selectedDate}</span>. Search is disabled in date mode.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Sessions Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SessionCardSkeleton key={i} />)
        ) : items.length === 0 ? (
          <div className="col-span-full">
            {term.length >= 2 ? (
              <EmptyState
                icon={Layers}
                title={`No sessions match "${term}"`}
                description="Try a different search term or clear the filter."
                actions={[
                  { label: "Clear Search", onClick: () => setTerm(""), variant: "outline" },
                ]}
              />
            ) : useDate ? (
              <EmptyState
                icon={Calendar}
                title="No sessions scheduled for this date"
                description="No sessions were found for the selected date. Generate sessions for this group or try a different date."
                actions={[
                  { label: "Generate Sessions", onClick: () => setModalOpen(true) },
                  { label: "Clear Date Filter", onClick: () => { setUseDate(false); setSelectedDate(todayIso()); }, variant: "outline" },
                ]}
              />
            ) : (
              <EmptyState
                icon={Layers}
                title="No sessions scheduled yet"
                description="Operate a trainee group to generate sessions from its weekly schedule."
                actions={[
                  { label: "Operate Group", onClick: () => setModalOpen(true) },
                ]}
              />
            )}
          </div>
        ) : (
          items.map((session) => (
            <SessionCard key={session.id} session={session} onMarkAttendance={openMarkAttendance} />
          ))
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {!loading && currentTotal > 1 && (
        <BasePagination
          page={currentPage}
          totalPages={currentTotal}
          pageSize={9}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ── Operate Group Modal ──────────────────────────────────────────── */}
      <OperateGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleGenerateSuccess}
      />
      <MarkAttendanceModal
        open={markOpen}
        onOpenChange={setMarkOpen}
        onSuccess={() => { refresh(); loadStats(); }}
        sessionOccurrenceId={markSessionId}
        sessionLabel={markSessionLabel}
      />
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({
  session,
  onMarkAttendance,
}: {
  session: SessionCardDto;
  onMarkAttendance?: (session: SessionCardDto) => void;
}) {
  const navigate = useNavigate();
  return (
    <Card className="card-athletic flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-base leading-snug">{session.sportName}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-medium">
                {session.sportName}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                {formatDuration(session.durationInMinutes)}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/session-occurrences?date=${new Date().toISOString().split("T")[0]}`)}>
                View Occurrences
              </DropdownMenuItem>
              {onMarkAttendance && (
                <DropdownMenuItem onClick={() => onMarkAttendance(session)}>
                  Mark Attendance
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {formatTime(session.startTime)}
              <span className="text-muted-foreground ml-1">
                ({formatDuration(session.durationInMinutes)})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>Coach: {session.coachName}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{session.branchName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={`font-medium ${getCapacityColor(session.traineesCount)}`}>
              {session.traineesCount} trainees enrolled
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/session-occurrences?date=${new Date().toISOString().split("T")[0]}`)}
          >
            View Occurrences
          </Button>
          {onMarkAttendance && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onMarkAttendance(session)}
            >
              Attendance
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
