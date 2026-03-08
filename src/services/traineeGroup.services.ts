import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";
import { isDevSession, devMock } from "@/auth/dev-login";

export const getTraineeGroups = async (page: number, pageSize: number) => {
  if (isDevSession()) return devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/get-all?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTraineeGroups = async (term: string, page: number, pageSize: number) => {
  if (isDevSession()) return devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const getTraineeGroupsForSpecificDay = async (
  date: string,
  page: number,
  pageSize: number,
) => {
  if (isDevSession()) return devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize });
  return await apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/get-all-for-specific-day?date=${date}&page=${page}&pageSize=${pageSize}`,
  );
};

export const getTraineeGroupById = async (id: number | string) => {
  if (isDevSession()) return devMock<null>(null);
  return apiFetch<ApiResult<unknown>>(`/api/TraineeGroup/${id}`);
};

export const createTraineeGroup = async (body: {
  skillLevel: string;
  maximumCapacity: number;
  durationInMinutes: number;
  gender: string;
  branchId: number;
  coachId: number;
}) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>("/api/TraineeGroup/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const updateTraineeGroup = async (
  id: number | string,
  body: {
    skillLevel?: string;
    maximumCapacity?: number;
    durationInMinutes?: number;
    gender?: string;
    coachId?: number;
  },
) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/TraineeGroup/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
};

export const deleteTraineeGroup = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/TraineeGroup/${id}`, { method: "DELETE" });
};

export const generateGroupSessions = async (body: {
  traineeGroupId: number;
  durationInDays: number;
  groupScheduleId?: number | null;
}) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>("/api/SessionOccurrence/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
};
