import { apiFetch } from "@/lib/api";
import { ApiResult, PagedData } from "@/types/api";
import { TraineeCardDto } from "@/types/TraineeCardDto";
import { UpdateTraineeCommand } from "@/types/commands/updateTraineeCommand";
import { CreateTraineeCommand } from "@/types/commands/createTraineeCommand";

export const countTrainees = async () => {
  return await apiFetch<ApiResult<number>>(`/api/trainee/count`);
};

export const countActiveTrainees = async () => {
  return await apiFetch<ApiResult<number>>(`/api/trainee/count-active`);
};

export const listTrainees = async (
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee?page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTrainees = async (
  term: string,
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee/search?searchTerm=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`,
  );
};

export const searchTraineesById = async (
  id: string,
  page: number,
  pageSize: number,
): Promise<ApiResult<PagedData<TraineeCardDto>>> => {
  return await apiFetch<ApiResult<PagedData<TraineeCardDto>>>(
    `/api/trainee/search/${encodeURIComponent(id)}?page=${page}&pageSize=${pageSize}`,
  );
};

export const updateTrainee = async (command: UpdateTraineeCommand) => {
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
  return await apiFetch<ApiResult<number>>(
    `/api/Trainee/get-count-for-specific-day?date=${date}`,
  );
};

export const createTrainee = async (command: CreateTraineeCommand) => {
  return await apiFetch<ApiResult<number>>("/api/Trainee", {
    method: "POST",
    body: JSON.stringify({
      firstName: command.firstName,
      lastName: command.lastName,
      ssn: command.ssn,
      parentNumber: command.parentNumber,
      guardianName: command.guardianName,
      birthDate: command.birthDate, // Format as "yyyy-MM-dd"
      gender: command.gender,
      branchId: Number(command.branchId),
      sportIds: command.sportIds.map(Number),
    }),
  });
};

export const deleteTrainee = async (id: number) => {
  await apiFetch<ApiResult<boolean>>(`/api/trainee/${id}`, {
    method: "DELETE",
  });
};
