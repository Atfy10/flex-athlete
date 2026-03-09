import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";
import { isDevSession, devMock } from "@/auth/dev-login";

export interface TraineeGroupDetailDto {
  id: number;
  skillLevel: string;
  gender: string;
  maximumCapacity: number;
  durationInMinutes: number;
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;
  traineesCount: number;
}

export const getTraineeGroups = async (page: number, pageSize: number) => {
  if (isDevSession()) return devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTraineeGroups = async (term: string, page: number, pageSize: number) => {
  if (isDevSession()) return devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const getTraineeGroupsForSpecificDay = async (
  date: string,
  page: number,
  pageSize: number,
) => {
  if (isDevSession()) return devMock<PagedData<ListTraineeGroupDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/get-all-for-specific-day?date=${date}&page=${page}&pageSize=${pageSize}`,
  );
};

export const getTraineeGroupById = async (id: number | string) => {
  if (isDevSession()) return devMock<TraineeGroupDetailDto | null>(null);
  return apiFetch<ApiResult<TraineeGroupDetailDto>>(`/api/TraineeGroup/${id}`);
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

/** Total trainee group count (used for stat card) */
export const countTraineeGroups = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/TraineeGroup/count");
};
