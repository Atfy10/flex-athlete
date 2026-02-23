import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { EmployeeCardDto } from "@/types/EmployeeCardDto";

export const listEmployees = (page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<EmployeeCardDto>>>(
    `/api/employee?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchEmployees = (
  term: string,
  page: number,
  pageSize: number,
) => {
  return apiFetch<ApiResult<PagedData<EmployeeCardDto>>>(
    `/api/employee/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};
