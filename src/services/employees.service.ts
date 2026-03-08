import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";
import { isDevSession, devMock } from "@/auth/dev-login";

export const listEmployees = (page: number, pageSize: number) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<EmployeeCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<EmployeeCardDto>>>(
    `/api/employee?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchEmployees = (
  term: string,
  page: number,
  pageSize: number,
) => {
  if (isDevSession()) return Promise.resolve(devMock<PagedData<EmployeeCardDto>>({ items: [], totalCount: 0, page, pageSize }));
  return apiFetch<ApiResult<PagedData<EmployeeCardDto>>>(
    `/api/employee/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const getTotalEmployees = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/employee/count");
};

export const getActiveEmployees = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/employee/active/count");
};

export const getBranchsCount = () => {
  if (isDevSession()) return Promise.resolve(devMock<number>(0));
  return apiFetch<ApiResult<number>>("/api/branch/count");
};

export const getEmployeeById = async (id: number | string): Promise<ApiResult<EmployeeCardDto>> => {
  if (isDevSession()) return devMock<EmployeeCardDto>(null as unknown as EmployeeCardDto);
  return apiFetch<ApiResult<EmployeeCardDto>>(`/api/employee/${id}`);
};

export const deleteEmployee = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/employee/${id}`, { method: "DELETE" });
};

export const toggleEmployeeStatus = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/employee/${id}/toggle-status`, { method: "PATCH" });
};
