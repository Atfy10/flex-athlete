import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { SportDropDownListDto } from "@/types/SportDropDownListDto";

export const countSports = async () => {
  return await apiFetch<ApiResult<number>>(`/api/sports/count`);
};

export const searchSportsName = async (term: string) => {
  return await apiFetch<ApiResult<SportDropDownListDto[]>>(
    `/api/sports/search-name?searchTerm=${encodeURIComponent(term)}`,
  );
};

export const getSports = async () => {
  return await apiFetch<ApiResult<{ id: number; name: string }[]>>(
    `/api/sports`,
  );
};
