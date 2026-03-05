export interface TraineeCardDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  joinDate: string;
  sportName: string;
  skillLevel: string;
  branchName: string;
  coachName: string;
  isSubscribed: boolean;
  attendanceRate: number;
  medicalConditions?: string[];
}
