import { ListTraineeGroupDto } from "@/types/listTraineeGroup";

export type SessionVm = {
  id: number;
  sport: string;
  time: string;
  coach: string;
  trainees: number;
  branch: string;
};

export function mapSessions(list: ListTraineeGroupDto[]): SessionVm[] {
  return list.map((s) => ({
    id: s.id,
    sport: s.sportName,
    time: s.startTime.slice(0, 5),
    coach: s.coachName,
    trainees: s.traineesCount,
    branch: s.branchName,
  }));
}

export function getSessionsCount(list: ListTraineeGroupDto[]) {
  return list.length;
}
