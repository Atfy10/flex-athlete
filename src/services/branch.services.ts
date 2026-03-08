import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { BranchCardDto } from "@/types/BranchCardDto";
import { isDevSession, devMock } from "@/auth/dev-login";

export const countBranches = async () => {
  if (isDevSession()) return devMock<number>(0);
  return apiFetch<ApiResult<number>>("/api/branch/count");
};

export const getBranches = async () => {
  if (isDevSession()) return devMock<{ id: number; name: string }[]>([]);
  return apiFetch<ApiResult<{ id: number; name: string }[]>>(`/api/branch`);
};

export const listBranches = async (page: number, pageSize: number) => {
  if (isDevSession()) return devMock<PagedData<BranchCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<BranchCardDto>>>(
    `/api/branch?page=${page}&pageSize=${pageSize}`
  );
};

export const searchBranches = async (
  term: string,
  page: number,
  pageSize: number
) => {
  if (isDevSession()) return devMock<PagedData<BranchCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<BranchCardDto>>>(
    `/api/branch/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`
  );
};

export const getBranchById = async (id: number | string) => {
  if (isDevSession()) return devMock<null>(null);
  return apiFetch<ApiResult<unknown>>(`/api/branch/${id}`);
};

export const deleteBranch = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/branch/${id}`, { method: "DELETE" });
};
