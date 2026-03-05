import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";

export const countBranches = async () => {
  return apiFetch<ApiResult<number>>("/api/branch/count");
};

export const getBranches = async () => {
  return apiFetch<ApiResult<{ id: number; name: string }[]>>(`/api/branch`);
};
