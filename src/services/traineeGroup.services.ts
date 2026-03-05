import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { ListTraineeGroupDto } from "@/types/listTraineeGroup";

export const getTraineeGroupsForSpecificDay = async (
  date: string,
  page: number,
  pageSize: number,
) => {
  return await apiFetch<ApiResult<PagedData<ListTraineeGroupDto>>>(
    `/api/TraineeGroup/get-all-for-specific-day?date=${date}&page=${page}&pageSize=${pageSize}`,
  );
};
