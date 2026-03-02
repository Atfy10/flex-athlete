import { EmployeeCardDto } from "./EmployeeCardDto";

export type CoachCardDto = EmployeeCardDto & {
  totalTrainees: number;
  skillLevel: string;
  sportName: string;
};
