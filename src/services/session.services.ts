import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { SessionCardDto } from "@/types/SessionCardDto";
import { isDevSession, devMock } from "@/auth/dev-login";

/** List all sessions (paginated) */
export const listSessions = (page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<SessionCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<SessionCardDto>>>(
    `/api/TraineeGroup?page=${page}&pageSize=${pageSize}`,
  );
};

/** Full-text search across sport, coach, or branch */
export const searchSessions = (term: string, page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<SessionCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<SessionCardDto>>>(
    `/api/TraineeGroup/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

/** Fetch sessions for a specific ISO date */
export const getSessionsByDate = (
  date: string,
  page: number,
  pageSize: number,
) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<SessionCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<SessionCardDto>>>(
    `/api/TraineeGroup/get-all-for-specific-day?date=${date}&page=${page}&pageSize=${pageSize}`,
  );
};

/** Total session count */
export const countSessions = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/TraineeGroup/count");
};
