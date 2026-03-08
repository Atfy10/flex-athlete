import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  ClipboardCheck,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { BasePagination } from "@/components/BasePagination";
import { useEntitySearch } from "@/hooks/useEntitySearch";
import {
  listSessionOccurrences,
  searchSessionOccurrences,
  getSessionOccurrencesByDate,
} from "@/services/attendance.services";
import { SessionOccurrenceDto } from "@/types/AttendanceDto";
import { MarkAttendanceModal } from "@/components/modals/MarkAttendanceModal";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { SortableTableHead } from "@/components/ui/SortableTableHead";
import { useSortable } from "@/hooks/useSortable";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(t: string) { return t?.slice(0, 5) ?? ""; }

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function attendanceRate(present: number, late: number, total: number) {
  if (!total) return null;
  return Math.round(((present + late) / total) * 100);
}

type SortKey = "sportName" | "coachName" | "branchName" | "date" | "startTime" | "durationInMinutes" | "totalEnrolled";

// ─── Card Skeleton ─────────────────────────────────────────────────────────────
function OccurrenceCardSkeleton() {
  return (
    <Card className="card-athletic">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex gap-3 items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Occurrence Row Card ───────────────────────────────────────────────────────
function OccurrenceCard({
  occ,
  onMark,
}: {
  occ: SessionOccurrenceDto;
  onMark: (occ: SessionOccurrenceDto) => void;
}) {
  const rate = attendanceRate(occ.totalPresent, occ.totalLate, occ.totalEnrolled);
  const hasAttendance = occ.totalPresent + occ.totalLate + occ.totalAbsent > 0;

  const rateColor =
    rate === null ? "" :
    rate >= 80 ? "bg-success/10 text-success border-success/20" :
    rate >= 60 ? "bg-warning/10 text-warning border-warning/20" :
    "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <Card className="card-athletic">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base">{occ.sportName}</h3>
              {hasAttendance && rate !== null && (
                <Badge className={`${rateColor} text-xs`}>{rate}% attended</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {new Date(occ.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(occ.startTime)} · {formatDuration(occ.durationInMinutes)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {occ.coachName}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {occ.branchName}
              </span>
            </div>
            {hasAttendance && (
              <div className="flex items-center gap-3 text-xs pt-1">
                <span className="text-success font-medium">{occ.totalPresent} present</span>
                <span className="text-warning font-medium">{occ.totalLate} late</span>
                <span className="text-destructive font-medium">{occ.totalAbsent} absent</span>
                <span className="text-muted-foreground">/ {occ.totalEnrolled} enrolled</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {occ.totalEnrolled > 0 && (
              <Button variant="outline" size="sm" onClick={() => onMark(occ)} className="flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4" />
                {hasAttendance ? "Update Attendance" : "Mark Attendance"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SessionOccurrences() {
  const [searchParams] = useSearchParams();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const { sort, toggle: toggleSort, sortItems } = useSortable<SortKey>();

  const [dateFilter, setDateFilter] = useState<string>(() => {
    const param = searchParams.get("date");
    if (!param) return "";
    if (param === "today") return new Date().toISOString().split("T")[0];
    return param;
  });

  const [markOpen, setMarkOpen] = useState(false);
  const [markSession, setMarkSession] = useState<SessionOccurrenceDto | null>(null);

  const [dateSessions, setDateSessions] = useState<SessionOccurrenceDto[]>([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [datePage, setDatePage] = useState(1);
  const [dateTotalPages, setDateTotalPages] = useState(1);
  const [dateTotalCount, setDateTotalCount] = useState(0);
  const DATE_PAGE_SIZE = 10;

  const loadByDate = useCallback(async (date: string, page: number) => {
    setDateLoading(true);
    try {
      const res = await getSessionOccurrencesByDate(date, page, DATE_PAGE_SIZE);
      if (res.isSuccess) {
        setDateSessions(res.data.items);
        setDateTotalCount(res.data.totalCount);
        setDateTotalPages(Math.max(1, Math.ceil(res.data.totalCount / DATE_PAGE_SIZE)));
      } else { setDateSessions([]); }
    } catch { setDateSessions([]); }
    finally { setDateLoading(false); }
  }, []);

  useEffect(() => {
    if (dateFilter) loadByDate(dateFilter, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const iso = format(date, "yyyy-MM-dd");
    setDateFilter(iso);
    setDatePage(1);
    setCalendarOpen(false);
    loadByDate(iso, 1);
  };

  const clearDateFilter = () => { setDateFilter(""); setDateSessions([]); };

  const listFn = useCallback(
    (page: number, pageSize: number) => listSessionOccurrences(page, pageSize),
    [],
  );
  const searchFn = useCallback(
    (term: string, page: number, pageSize: number) => searchSessionOccurrences(term, page, pageSize),
    [],
  );

  const {
    items: searchResults,
    loading: searchLoading,
    term,
    setTerm,
    page: searchPage,
    setPage: setSearchPage,
    totalPages: searchTotalPages,
    refresh,
  } = useEntitySearch<SessionOccurrenceDto>({ listFn, searchFn, pageSize: 10 });

  const isDateMode = Boolean(dateFilter);
  const items = isDateMode ? dateSessions : searchResults;
  const loading = isDateMode ? dateLoading : searchLoading;
  const page = isDateMode ? datePage : searchPage;
  const totalPages = isDateMode ? dateTotalPages : searchTotalPages;
  const totalCount = isDateMode ? dateTotalCount : items.length;

  const handlePageChange = (p: number) => {
    if (isDateMode) { setDatePage(p); loadByDate(dateFilter, p); }
    else setSearchPage(p);
  };

  const sortedItems = sortItems(items, (o, key) => {
    const v = (o as unknown as Record<string, unknown>)[key] ?? "";
    return typeof v === "number" ? v : String(v);
  });

  const rateColor = (rate: number | null) =>
    rate === null ? "bg-muted text-muted-foreground" :
    rate >= 80 ? "bg-success/10 text-success border-success/20" :
    rate >= 60 ? "bg-warning/10 text-warning border-warning/20" :
    "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Session Occurrences</h1>
        <p className="text-muted-foreground">System-generated training sessions — read-only view</p>
      </div>

      {/* Filters */}
      <Card className="card-athletic">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={isDateMode ? "Clear date filter to search…" : "Search by sport, coach, or branch…"}
                value={isDateMode ? "" : term}
                onChange={(e) => !isDateMode && setTerm(e.target.value)}
                disabled={isDateMode}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 min-w-[160px] justify-start font-normal">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {dateFilter ? format(new Date(dateFilter + "T00:00:00"), "MMM d, yyyy") : "Filter by date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateFilter ? new Date(dateFilter + "T00:00:00") : undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {isDateMode && (
                <Button variant="ghost" size="icon" onClick={clearDateFilter} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isDateMode && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium whitespace-nowrap">
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(dateFilter + "T00:00:00"), "EEEE, MMM d")}
                {!loading && (
                  <span className="text-xs opacity-70">· {totalCount} session{totalCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            )}

            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        view === "grid" ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <OccurrenceCardSkeleton key={i} />)}
          </div>
        ) : (
          <Card className="card-athletic">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Sport", "Date", "Time", "Duration", "Coach", "Branch", "Enrolled", "Rate", ""].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : items.length === 0 ? (
        <Card className="card-athletic">
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 opacity-40" />
            <p className="text-base font-medium">No session occurrences found</p>
            <p className="text-sm">
              {isDateMode
                ? `No sessions were scheduled for ${format(new Date(dateFilter + "T00:00:00"), "EEEE, MMMM d")}.`
                : term ? `No results for "${term}".` : "No sessions have been generated yet."}
            </p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="space-y-4">
          {sortedItems.map((occ) => (
            <OccurrenceCard
              key={occ.id}
              occ={occ}
              onMark={(s) => { setMarkSession(s); setMarkOpen(true); }}
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
                      { label: "Date", key: "date" },
                      { label: "Time", key: "startTime" },
                      { label: "Duration", key: "durationInMinutes" },
                      { label: "Coach", key: "coachName" },
                      { label: "Branch", key: "branchName" },
                      { label: "Enrolled", key: "totalEnrolled" },
                    ] as { label: string; key: SortKey }[]
                  ).map(({ label, key }) => (
                    <SortableTableHead key={key} col={key} label={label} sort={sort} onSort={toggleSort} />
                  ))}
                  <TableHead>Rate</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((occ) => {
                  const rate = attendanceRate(occ.totalPresent, occ.totalLate, occ.totalEnrolled);
                  return (
                    <TableRow key={occ.id}>
                      <TableCell className="font-medium">{occ.sportName}</TableCell>
                      <TableCell>
                        {new Date(occ.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{formatTime(occ.startTime)}</TableCell>
                      <TableCell>{formatDuration(occ.durationInMinutes)}</TableCell>
                      <TableCell>{occ.coachName}</TableCell>
                      <TableCell>{occ.branchName}</TableCell>
                      <TableCell>{occ.totalEnrolled}</TableCell>
                      <TableCell>
                        {rate !== null ? (
                          <Badge className={`${rateColor(rate)} text-xs`}>{rate}%</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {occ.totalEnrolled > 0 && (
                          <Button variant="outline" size="sm" onClick={() => { setMarkSession(occ); setMarkOpen(true); }}>
                            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                            Mark
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <BasePagination
        page={page}
        totalPages={totalPages}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
      />

      <MarkAttendanceModal
        open={markOpen}
        onOpenChange={setMarkOpen}
        onSuccess={() => { if (isDateMode) loadByDate(dateFilter, datePage); else refresh(); }}
        sessionOccurrenceId={markSession?.id}
        sessionLabel={
          markSession
            ? `${markSession.sportName} — ${format(new Date(markSession.date + "T00:00:00"), "MMM d")} ${formatTime(markSession.startTime)}`
            : undefined
        }
      />
    </div>
  );
}
