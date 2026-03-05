import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { TraineeCardDto } from "@/types/TraineeCardDto";

export const countTrainees = async () => {
  return await apiFetch<ApiResult<number>>(`/api/trainee/count`);
};

export const countActiveTrainees = async () => {
  return await apiFetch<ApiResult<number>>(`/api/trainee/count-active`);
};

export const listTrainees = async (
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTrainees = async (
  term: string,
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};
