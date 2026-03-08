import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { NationalityCategoryDto } from "@/types/NationalityCategoryDto";
import { isDevSession, devMock } from "@/auth/dev-login";

export const getNationalityCategories = async () => {
  if (isDevSession()) return devMock<NationalityCategoryDto[]>([]);
  return await apiFetch<ApiResult<NationalityCategoryDto[]>>(
    `/api/NationalityCategory`,
  );
};
