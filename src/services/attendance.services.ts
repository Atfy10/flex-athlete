import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { isDevSession, devMock } from "@/auth/dev-login";
import {
  AttendanceRecordDto,
  MarkAttendanceCommand,
  SessionOccurrenceDto,
} from "@/types/AttendanceDto";

// ── Session occurrences list (paginated) ──────────────────────────────────────

/** List all session occurrences paginated, optionally filtered by date */
export const listSessionOccurrences = async (
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<SessionOccurrenceDto>>> => {
  if (isDevSession())
    return devMock<PagedData<SessionOccurrenceDto>>({
      items: [],
      totalCount: 0,
      page,
      pageSize,
    });
  return apiFetch<ApiResult<PagedData<SessionOccurrenceDto>>>(
    `/api/SessionOccurrence?page=${page}&pageSize=${pageSize}`,
  );
};

/** Search session occurrences by sport, coach, or branch name */
export const searchSessionOccurrences = async (
  term: string,
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<SessionOccurrenceDto>>> => {
  if (isDevSession())
    return devMock<PagedData<SessionOccurrenceDto>>({
      items: [],
      totalCount: 0,
      page,
      pageSize,
    });
  return apiFetch<ApiResult<PagedData<SessionOccurrenceDto>>>(
    `/api/SessionOccurrence/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

// ── Aggregate stats ───────────────────────────────────────────────────────────

/** Overall attendance rate (0–100) */
export const getAverageAttendance = async () => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(`/api/attendance/rate`);
};

/** Attendance rate for a specific month (1-based) and year */
export const getAverageAttendanceForMonth = async (month: string, year?: number) => {
  if (isDevSession()) return devMock<number>(0);
  const yearParam = year ? `&year=${year}` : "";
  return await apiFetch<ApiResult<number>>(
    `/api/attendance/rate?month=${month}${yearParam}`,
  );
};

// ── Session occurrences by date ───────────────────────────────────────────────

/**
 * Returns all session occurrences for a given ISO date, paginated.
 * Used to populate the Attendance page's day view.
 */
export const getSessionOccurrencesByDate = async (
  date: string,
  page = 1,
  pageSize = 20,
): Promise<ApiResult<PagedData<SessionOccurrenceDto>>> => {
  if (isDevSession())
    return devMock<PagedData<SessionOccurrenceDto>>({
      items: [],
      totalCount: 0,
      page,
      pageSize,
    });
  return apiFetch<ApiResult<PagedData<SessionOccurrenceDto>>>(
    `/api/SessionOccurrence?date=${date}&page=${page}&pageSize=${pageSize}`,
  );
};

// ── Per-session attendance roster ─────────────────────────────────────────────

/**
 * Fetches the full attendance roster for a session occurrence.
 * Returns one AttendanceRecordDto per enrolled trainee.
 */
export const getAttendanceBySession = async (
  sessionOccurrenceId: number,
): Promise<ApiResult<AttendanceRecordDto[]>> => {
  if (isDevSession()) return devMock<AttendanceRecordDto[]>([]);
  return apiFetch<ApiResult<AttendanceRecordDto[]>>(
    `/api/attendance/session/${sessionOccurrenceId}`,
  );
};

/**
 * Alias — returns the list of attendees (same endpoint, kept for clarity).
 */
export const getSessionAttendees = getAttendanceBySession;

// ── Mark attendance ───────────────────────────────────────────────────────────

/**
 * Records or updates the attendance status for a single trainee
 * within a session occurrence.
 */
export const markAttendance = async (
  command: MarkAttendanceCommand,
): Promise<ApiResult<boolean>> => {
  if (isDevSession()) return devMock<boolean>(true, "Dev mode: attendance marking skipped");
  return apiFetch<ApiResult<boolean>>("/api/attendance", {
    method: "POST",
    body: JSON.stringify(command),
  });
};

/**
 * Bulk-mark attendance for multiple trainees in one request.
 */
export const bulkMarkAttendance = async (
  commands: MarkAttendanceCommand[],
): Promise<ApiResult<boolean>> => {
  if (isDevSession()) return devMock<boolean>(true, "Dev mode: bulk attendance marking skipped");
  return apiFetch<ApiResult<boolean>>("/api/attendance/bulk", {
    method: "POST",
    body: JSON.stringify(commands),
  });
};
