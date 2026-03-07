import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { BranchCardDto } from "@/types/BranchCardDto";

export const countBranches = async () => {
  return apiFetch<ApiResult<number>>("/api/branch/count");
};

export const getBranches = async () => {
  return apiFetch<ApiResult<{ id: number; name: string }[]>>(`/api/branch`);
};

export const listBranches = async (page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<BranchCardDto>>>(
    `/api/branch?page=${page}&pageSize=${pageSize}`
  );
};

export const searchBranches = async (
  term: string,
  page: number,
  pageSize: number
) => {
  return apiFetch<ApiResult<PagedData<BranchCardDto>>>(
    `/api/branch/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`
  );
};
