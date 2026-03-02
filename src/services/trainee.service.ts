import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";

export const countTrainees = async () => {
  return await apiFetch<ApiResult<number>>(`/api/trainee/count`);
};
