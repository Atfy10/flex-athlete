import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { NationalityCategoryDto } from "@/types/NationalityCategoryDto";

export const getNationalityCategories = async () => {
  return await apiFetch<ApiResult<NationalityCategoryDto[]>>(
    `/api/NationalityCategory`,
  );
};
