/**
 * AttendanceRecordDto
 *
 * Represents a single trainee's attendance record within a session occurrence.
 */
export type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused";

export interface AttendanceRecordDto {
  id: number;
  traineeId: number;
  traineeName: string;
  /** "HH:mm:ss" */
  checkInTime: string | null;
  status: AttendanceStatus;
}

/**
 * SessionOccurrenceDto
 *
 * A materialized session occurrence with its attendance summary.
 * Returned by GET /api/SessionOccurrence?date=...
 */
export interface SessionOccurrenceDto {
  id: number;
  traineeGroupId: number;
  /** ISO date "YYYY-MM-DD" */
  date: string;
  sportName: string;
  coachName: string;
  branchName: string;
  /** "HH:mm:ss" */
  startTime: string;
  durationInMinutes: number;
  totalEnrolled: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
}

/**
 * MarkAttendanceCommand
 *
 * Sent to POST /api/attendance to record a trainee's attendance.
 */
export interface MarkAttendanceCommand {
  sessionOccurrenceId: number;
  traineeId: number;
  status: AttendanceStatus;
  /** "HH:mm" optional check-in time override */
  checkInTime?: string;
}
