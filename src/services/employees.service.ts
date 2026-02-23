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
    `/api/employee/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

// Total Employees
export const getTotalEmployees = () => {
  return apiFetch<ApiResult<number>>("/api/employee/count");
};

// Active Employees Count
export const getActiveEmployees = () => {
  return apiFetch<ApiResult<number>>("/api/employee/active/count");
};

// Branchs Count
export const getBranchsCount = () => {
  return apiFetch<ApiResult<number>>("/api/branch/count");
};

// Active Coaches Count
export const getActiveCoachesCount = () => {
  return apiFetch<ApiResult<number>>("/api/Employee/coaches/active/count");
};
