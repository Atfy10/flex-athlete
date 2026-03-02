export interface CoachDetailsDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  branchName: string;
  sportName: string;
  skillLevel: string;
  certifications?: string[] | null;
  totalTrainees?: number | null;
  hireDate?: string | null;
  isWork: boolean;
  rating?: number | null;
}
