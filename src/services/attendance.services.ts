import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";

export const getAverageAttendance = async () => {
  return await apiFetch<ApiResult<number>>(`/api/attendance/rate`);
};
