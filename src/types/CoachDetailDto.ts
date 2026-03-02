export interface CoachDetailsDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  branchName: string;
  sportName: string;
  skillLevel: string;
  experience?: string;
  certifications?: string[];
  numberOfTrainees?: number;
  joinDate?: string;
  isWork: string;
  rating?: number;
}
