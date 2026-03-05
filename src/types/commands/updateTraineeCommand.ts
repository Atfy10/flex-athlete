export interface UpdateTraineeCommand {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  guardianName?: string | null;
  parentNumber?: string | null;
  branchId: number;
  sportIds?: number[] | null;
}
