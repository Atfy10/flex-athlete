import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { CoachCardDto } from "@/types/CoachCardDto";
import { CoachDetailsDto } from "@/types/CoachDetailDto";
import { CreateCoachCommand } from "@/types/commands/createCoachCommand";
import { isDevSession, devMock } from "@/auth/dev-login";

export const listCoaches = (page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<CoachCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<CoachCardDto>>>(
    `/api/employee/coaches?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchCoaches = (term: string, page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<CoachCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<CoachCardDto>>>(
    `/api/coach/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const countCoaches = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/coach/count");
};

export const averageRatingForAllCoaches = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/coach/rating-average");
};

export const getCoachById = (id: number) => {
  if (isDevSession()) return Promise.resolve(devMock<CoachDetailsDto | null>(null));
  return apiFetch<ApiResult<CoachDetailsDto>>(`/api/coach/${id}`);
};

export const getActiveCoachesCount = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/Employee/coaches/active/count");
};

export const createCoach = async (command: CreateCoachCommand) => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>("/api/coach", {
    method: "POST",
    body: JSON.stringify(command),
  });
};

export const deleteCoach = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/coaches/${id}`, { method: "DELETE" });
};
