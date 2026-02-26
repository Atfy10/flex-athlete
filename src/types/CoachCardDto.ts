import { EmployeeCardDto } from "./EmployeeCardDto";

export type CoachCardDto = EmployeeCardDto & {
  TotalTrainees: number;
  SkillLevel: string;
  Sport: string;
};
