export type SessionCardDto = {
  id: number;
  sportName: string;
  coachName: string;
  branchName: string;
  /** "HH:mm:ss" e.g. "09:00:00" */
  startTime: string;
  durationInMinutes: number;
  traineesCount: number;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
};
