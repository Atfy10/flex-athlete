export interface TraineeDetailsDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  parentNumber?: string;
  guardianName?: string;
  branchName: string;
  birthDate?: string;
  gender?: string;
  sports?: string[];
  isSubscribed: boolean;
  attendanceRate?: number;
  enrollmentCount?: number;
  joinDate: string;
}
