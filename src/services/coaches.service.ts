import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { CoachCardDto } from "@/types/CoachCardDto";
import { CoachDetailsDto } from "@/types/CoachDetailDto";

export const listCoaches = (page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<CoachCardDto>>>(
    `/api/employee/coaches?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchCoaches = (term: string, page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<CoachCardDto>>>(
    `/api/coach/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const countCoaches = () => {
  return apiFetch<ApiResult<number>>("/api/coach/count");
};

export const averageRatingForAllCoaches = () => {
  return apiFetch<ApiResult<number>>("/api/coach/rating-average");
};

export const getCoachById = (id: number) => {
  return apiFetch<ApiResult<CoachDetailsDto>>(`/api/coach/${id}`);
};

export const getActiveCoachesCount = () => {
  return apiFetch<ApiResult<number>>("/api/Employee/coaches/active/count");
};
