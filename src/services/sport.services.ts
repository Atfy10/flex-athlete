import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { SportDropDownListDto } from "@/types/SportDropDownListDto";
import { isDevSession, devMock } from "@/auth/dev-login";

export const countSports = async () => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(`/api/sports/count`);
};

export const searchSportsName = async (term: string) => {
  if (isDevSession()) return devMock<SportDropDownListDto[]>([]);
  return await apiFetch<ApiResult<SportDropDownListDto[]>>(
    `/api/sports/search-name?searchTerm=${encodeURIComponent(term)}`,
  );
};

export const getSports = async () => {
  if (isDevSession()) return devMock<{ id: number; name: string }[]>([]);
  return await apiFetch<ApiResult<{ id: number; name: string }[]>>(
    `/api/sports`,
  );
};

export const getSportById = async (id: number | string) => {
  if (isDevSession()) return devMock<null>(null);
  return apiFetch<ApiResult<unknown>>(`/api/sport/${id}`);
};

export const deleteSport = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/sport/${id}`, { method: "DELETE" });
};
