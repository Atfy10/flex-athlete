export interface EnrollmentCardDto {
  id: number;
  traineeName: string;
  traineeEmail?: string;
  sport: string;
  program?: string;
  branch?: string;
  coachName?: string;
  enrollmentDate?: string;
  startDate?: string;
  endDate?: string;
  monthlyFee?: number;
  paymentStatus?: string;
  status: string;
  sessionsCompleted?: number;
  totalSessions?: number;
}
