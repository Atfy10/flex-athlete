import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { SessionCardDto } from "@/types/SessionCardDto";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";
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

/** List trainee groups for the group picker (paginated, used in OperateGroupModal) */
export const listTraineeGroupsForPicker = (page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup?page=${page}&pageSize=${pageSize}`,
  );
};

/** Search trainee groups by name (used in OperateGroupModal) */
export const searchTraineeGroupsForPicker = (term: string, page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export interface GenerateSessionsCommand {
  traineeGroupId: number;
  durationInDays: number;
  groupScheduleId?: number | null;
}

/** POST to generate session occurrences for a Trainee Group */
export const generateSessions = async (command: GenerateSessionsCommand) => {
  if (isDevSession()) return devMock<boolean>(true, "Dev mode: sessions generation skipped");
  return apiFetch<ApiResult<boolean>>("/api/SessionOccurrence/generate", {
    method: "POST",
    body: JSON.stringify({
      traineeGroupId: command.traineeGroupId,
      durationInDays: command.durationInDays,
      groupScheduleId: command.groupScheduleId ?? null,
    }),
  });
};
