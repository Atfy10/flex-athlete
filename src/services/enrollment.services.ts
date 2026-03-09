import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { EnrollmentCardDto } from "@/types/EnrollmentCardDto";
import { EnrollmentDetailDto } from "@/types/EnrollmentDetailDto";
import { isDevSession, devMock } from "@/auth/dev-login";

export const getEnrollments = async (
  sportId: number,
): Promise<ApiResult<number>> => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(
    `/api/Enrollment/sports/${sportId}/enrollments/count?from=2024-01-01`,
  );
};

export const listEnrollments = async (page: number, pageSize: number) => {
  if (isDevSession()) return devMock<PagedData<EnrollmentCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<EnrollmentCardDto>>>(
    `/api/Enrollment?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchEnrollments = async (
  term: string,
  page: number,
  pageSize: number,
) => {
  if (isDevSession()) return devMock<PagedData<EnrollmentCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return apiFetch<ApiResult<PagedData<EnrollmentCardDto>>>(
    `/api/Enrollment/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const countAllEnrollments = async () => {
  if (isDevSession()) return devMock<number>(0);
  return apiFetch<ApiResult<number>>("/api/Enrollment/count");
};

export const countActiveEnrollments = async () => {
  if (isDevSession()) return devMock<number>(0);
  return apiFetch<ApiResult<number>>("/api/Enrollment/count/active");
};

export const countPendingPayments = async () => {
  if (isDevSession()) return devMock<number>(0);
  return apiFetch<ApiResult<number>>("/api/Enrollment/count/pending-payment");
};

export const getEnrollmentById = async (id: number | string) => {
  if (isDevSession()) return devMock<null>(null);
  return apiFetch<ApiResult<unknown>>(`/api/enrollment/${id}`);
};

export const deleteEnrollment = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/enrollment/${id}`, { method: "DELETE" });
};

export const activateEnrollment = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/enrollment/${id}/activate`, { method: "PATCH" });
};

export const suspendEnrollment = async (id: number | string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/enrollment/${id}/suspend`, { method: "PATCH" });
};

export const updatePaymentStatus = async (id: number | string, paymentStatus: string) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/enrollment/${id}/payment-status`, {
    method: "PATCH",
    body: JSON.stringify({ paymentStatus }),
  });
};

export const updateEnrollment = async (
  id: number | string,
  data: {
    expiryDate?: string | null;
    sessionAllowed?: number | null;
    subscriptionDetailsId?: number | null;
  },
) => {
  if (isDevSession()) return devMock<boolean>(true);
  return apiFetch<ApiResult<boolean>>(`/api/enrollment/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
