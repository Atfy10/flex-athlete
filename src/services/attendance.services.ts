import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { isDevSession, devMock } from "@/auth/dev-login";

export const getAverageAttendance = async () => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(`/api/attendance/rate`);
};

export const getAverageAttendanceForMonth = async (month: string) => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(
    `/api/attendance/rate?month=${month}`,
  );
};
