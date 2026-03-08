import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(time: string) {
  // "09:00:00" → "09:00"
  return time.slice(0, 5);
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getCapacityColor(count: number) {
  // We don't have capacity in DTO; just show trainee count styled neutrally
  return count > 0 ? "text-success" : "text-muted-foreground";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SessionCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-3 border-t border-border flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsEmptyState({ isSearch }: { isSearch: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Layers className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-base font-medium">
        {isSearch ? "No sessions match your search" : "No sessions found"}
      </p>
      <p className="text-sm mt-1">
        {isSearch
          ? "Try a different search term or clear the filter."
          : "Sessions will appear here once they are scheduled."}
      </p>
    </div>
  );
}

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
  const [useDate, setUseDate] = useState(false);

  // Stats
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [todayGroupCount, setTodayGroupCount] = useState<number | null>(null);

  // Date-filtered mode uses a separate local state
  const [dateItems, setDateItems]     = useState<SessionCardDto[]>([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [datePage, setDatePage]       = useState(1);
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
  } = useEntitySearch<SessionCardDto>({
    listFn:   stableListSessions,
    searchFn: stableSearchSessions,
    pageSize: 9,
  });

  // Derived display values
  const items   = useDate ? dateItems   : searchItems;
  const loading = useDate ? dateLoading : searchLoading;
  const currentPage    = useDate ? datePage    : page;
  const currentTotal   = useDate ? dateTotalPages : totalPages;
  const setCurrentPage = useDate ? setDatePage : setPage;

  // ── Stats fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadStats = async () => {
      const [total, todayRes] = await Promise.allSettled([
        countSessions(),
        getSessionsByDate(todayIso(), 1, 1),
      ]);
      if (total.status === "fulfilled" && total.value.isSuccess)
        setTotalSessions(total.value.data);
      if (todayRes.status === "fulfilled" && todayRes.value.isSuccess)
        setTodayGroupCount(todayRes.value.data.totalCount);
    };
    loadStats();
  }, []);

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
          setDateTotalPages(
            Math.max(1, Math.ceil(res.data.totalCount / DATE_PAGE_SIZE)),
          );
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

  const statsValues = [
    totalSessions  != null ? String(totalSessions) : "—",
    todayGroupCount != null ? String(todayGroupCount) : "—",
    "—", // no coaches endpoint here
    "—", // no avg duration endpoint here
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
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

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_META.map((meta, i) => (
          <Card key={i} className="card-athletic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {meta.title}
                  </p>
                  {statsValues[i] === "—" ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{statsValues[i]}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <meta.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search & Date Filter ────────────────────────────────────────── */}
      <Card className="card-athletic">
        <CardHeader>
          <CardTitle>Search & Filter Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input — disabled in date mode */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by sport, coach, or branch…"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  if (useDate) setUseDate(false);
                }}
                className="pl-10"
                disabled={useDate}
              />
            </div>

            {/* Date picker */}
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setUseDate(true);
                setTerm("");
              }}
              className="w-auto"
            />

            {/* Toggle date filter */}
            <Button
              variant={useDate ? "default" : "outline"}
              onClick={() => {
                setUseDate((v) => !v);
                if (!useDate) setTerm("");
              }}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              {useDate ? "Clear Date" : "Filter by Date"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Sessions Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SessionCardSkeleton key={i} />)
        ) : items.length === 0 ? (
          <SessionsEmptyState isSearch={term.length >= 2 || useDate} />
        ) : (
          items.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {!loading && currentTotal > 1 && (
        <BasePagination
          currentPage={currentPage}
          totalPages={currentTotal}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: SessionCardDto }) {
  return (
    <Card className="card-athletic flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-base leading-snug">
              {session.sportName}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-medium">
                {session.sportName}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button variant="default" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Attendance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
