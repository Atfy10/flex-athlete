import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { SessionCardDto } from "@/types/SessionCardDto";

/** List all sessions (paginated) */
export const listSessions = (page: number, pageSize: number) =>
  apiFetch<ApiResult<PagedData<SessionCardDto>>>(
    `/api/TraineeGroup?page=${page}&pageSize=${pageSize}`,
  );

/** Full-text search across sport, coach, or branch */
export const searchSessions = (term: string, page: number, pageSize: number) =>
  apiFetch<ApiResult<PagedData<SessionCardDto>>>(
    `/api/TraineeGroup/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );

/** Fetch sessions for a specific ISO date */
export const getSessionsByDate = (
  date: string,
  page: number,
  pageSize: number,
) =>
  apiFetch<ApiResult<PagedData<SessionCardDto>>>(
    `/api/TraineeGroup/get-all-for-specific-day?date=${date}&page=${page}&pageSize=${pageSize}`,
  );

/** Total session count */
export const countSessions = () =>
  apiFetch<ApiResult<number>>("/api/TraineeGroup/count");
