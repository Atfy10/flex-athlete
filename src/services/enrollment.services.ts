import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";

export const getEnrollments = async (
  sportId: number,
): Promise<ApiResult<number>> => {
  return await apiFetch<ApiResult<number>>(
    `/api/Enrollment/sports/${sportId}/enrollments/count?from=2024-01-01`,
  );
};
