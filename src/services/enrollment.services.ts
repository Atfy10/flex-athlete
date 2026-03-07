import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { EnrollmentCardDto } from "@/types/EnrollmentCardDto";

export const getEnrollments = async (
  sportId: number,
): Promise<ApiResult<number>> => {
  return await apiFetch<ApiResult<number>>(
    `/api/Enrollment/sports/${sportId}/enrollments/count?from=2024-01-01`,
  );
};

export const listEnrollments = async (page: number, pageSize: number) => {
  return apiFetch<ApiResult<PagedData<EnrollmentCardDto>>>(
    `/api/Enrollment?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchEnrollments = async (
  term: string,
  page: number,
  pageSize: number,
) => {
  return apiFetch<ApiResult<PagedData<EnrollmentCardDto>>>(
    `/api/Enrollment/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const countAllEnrollments = async () =>
  apiFetch<ApiResult<number>>("/api/Enrollment/count");

export const countActiveEnrollments = async () =>
  apiFetch<ApiResult<number>>("/api/Enrollment/count/active");

export const countPendingPayments = async () =>
  apiFetch<ApiResult<number>>("/api/Enrollment/count/pending-payment");
