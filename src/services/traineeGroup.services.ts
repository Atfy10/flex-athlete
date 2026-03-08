import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";
import { isDevSession, devMock } from "@/auth/dev-login";

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
  return apiFetch<ApiResult<unknown>>(`/api/trainee-group/${id}`);
};

export const deleteTraineeGroup = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/trainee-group/${id}`, { method: "DELETE" });
};
