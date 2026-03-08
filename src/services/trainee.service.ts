import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { TraineeCardDto } from "@/types/TraineeCardDto";
import { TraineeDetailsDto } from "@/types/TraineeDetailsDto";
import { UpdateTraineeCommand } from "@/types/commands/updateTraineeCommand";
import { CreateTraineeCommand } from "@/types/commands/createTraineeCommand";
import { isDevSession, devMock } from "@/auth/dev-login";

export const countTrainees = async () => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(`/api/trainee/count`);
};

export const countActiveTrainees = async () => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(`/api/trainee/count-active`);
};

export const listTrainees = async (
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  if (isDevSession()) return devMock<PagedData<TraineeCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTrainees = async (
  term: string,
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  if (isDevSession()) return devMock<PagedData<TraineeCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTraineesById = async (
  id: string,
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  if (isDevSession()) return devMock<PagedData<TraineeCardDto>>({ items: [], totalCount: 0, page, pageSize });
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee/search/${encodeURIComponent(id)}?page=${page}&pageSize=${pageSize}`,
  );
};

export const getTraineeById = async (id: number | string): Promise<ApiResult<TraineeDetailsDto>> => {
  if (isDevSession()) return devMock<TraineeDetailsDto>(null as unknown as TraineeDetailsDto);
  return await apiFetch<ApiResult<TraineeDetailsDto>>(`/api/trainee/${id}`);
};

export const updateTrainee = async (command: UpdateTraineeCommand) => {
  if (isDevSession()) return devMock<UpdateTraineeCommand>(command);
  const result = await apiFetch<ApiResult<UpdateTraineeCommand>>(
    `/api/Trainee`,
    {
      method: "PUT",
      body: JSON.stringify(command),
    },
  );
  return result;
};

export const getTRaineesCountForSpecificDay = async (date: string) => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>(
    `/api/Trainee/get-count-for-specific-day?date=${date}`,
  );
};

export const createTrainee = async (command: CreateTraineeCommand) => {
  if (isDevSession()) return devMock<number>(0);
  return await apiFetch<ApiResult<number>>("/api/Trainee", {
    method: "POST",
    body: JSON.stringify({
      firstName: command.firstName,
      lastName: command.lastName,
      ssn: command.ssn,
      parentNumber: command.parentNumber,
      guardianName: command.guardianName,
      birthDate: command.birthDate,
      gender: command.gender,
      branchId: Number(command.branchId),
      sportIds: command.sportIds.map(Number),
      familyId: Number(command.familyId),
      nationalityCategoryId: Number(command.nationalityCategoryId),
    }),
  });
};

export const deleteTrainee = async (id: number) => {
  if (isDevSession()) return devMock<boolean>(true);
  await apiFetch<ApiResult<boolean>>(`/api/trainee/${id}`, {
    method: "DELETE",
  });
};
