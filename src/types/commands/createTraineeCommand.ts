export interface CreateTraineeCommand {
  firstName: string;
  lastName: string;
  ssn: string;
  parentNumber: string | null;
  guardianName: string | null;
  birthDate: string | null; // Formatted as "yyyy-MM-dd"
  gender: string;
  branchId: number;
  sportIds: number[];
}

enum Gender {
  Male = 0,
  Female = 1,
  Other = 2,
}
