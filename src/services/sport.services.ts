import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";

export const countSports = async () => {
  return await apiFetch<ApiResult<number>>(`/api/sports/count`);
};
