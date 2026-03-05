export interface TraineeSportSkill {
  sportName: string;
  skillLevel: string;
}

export interface TraineeCardDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  joinDate: string;
  /** Legacy single-sport fields — kept for backward compat */
  sportName?: string;
  skillLevel?: string;
  /** Preferred: multiple sports with individual skill levels */
  sportSkills?: TraineeSportSkill[];
  branchName: string;
  coachName: string;
  isSubscribed: boolean;
  attendanceRate: number;
  medicalConditions?: string[];
}

