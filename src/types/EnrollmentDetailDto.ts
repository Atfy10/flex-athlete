export interface EnrollmentDetailDto {
  id: number;
  traineeName?: string;
  traineeEmail?: string;
  sport?: string;
  program?: string;
  branch?: string;
  /** Coach full name — backend may return as 'coach' or 'coachName' */
  coach?: string;
  coachName?: string;
  enrollmentDate?: string;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  monthlyFee?: number;
  paymentStatus?: string;
  status?: string;
  sessionsCompleted?: number;
  totalSessions?: number;
  sessionAllowed?: number;
  subscriptionDetailsId?: number;
}
