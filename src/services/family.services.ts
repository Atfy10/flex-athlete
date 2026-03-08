import { apiFetch } from "@/lib/api";
import { ApiResult } from "@/types/api";
import { FamilyDto } from "@/types/FamilyDto";
import { isDevSession, devMock } from "@/auth/dev-login";

export const getFamilies = async (searchTerm: string) => {
  if (isDevSession()) return devMock<FamilyDto[]>([]);
  return await apiFetch<ApiResult<FamilyDto[]>>(
    `/api/Family/search?searchTerm=${encodeURIComponent(searchTerm)}`,
  );
};
