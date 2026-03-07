import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { FamilyDto } from "@/types/FamilyDto";

export const getFamilies = async (searchTerm: string) => {
  return await apiFetch<ApiResult<FamilyDto[]>>(
    `/api/Family/search?searchTerm=${encodeURIComponent(searchTerm)}`,
  );
};
