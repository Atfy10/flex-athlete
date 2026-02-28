import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { CoachCardDto } from "@/types/CoachCardDto";

export const listCoaches = (page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<CoachCardDto>>>(
    `/api/employee/coaches?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchCoaches = (term: string, page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<CoachCardDto>>>(
    `/api/employee/coaches/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};
