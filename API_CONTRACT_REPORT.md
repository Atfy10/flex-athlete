# AURA Sport Academy — Backend–Frontend API Contract Report
> Auto-generated from full codebase audit · 2026-03-08

---

## Table of Contents
1. [Universal Response Wrapper](#1-universal-response-wrapper)
2. [Pagination Model](#2-pagination-model)
3. [Authentication Module](#3-authentication-module)
4. [Trainees Module](#4-trainees-module)
5. [Coaches Module](#5-coaches-module)
6. [Employees Module](#6-employees-module)
7. [Branches Module](#7-branches-module)
8. [Sports Module](#8-sports-module)
9. [Trainee Groups Module](#9-trainee-groups-module)
10. [Sessions Module (TraineeGroup-based)](#10-sessions-module)
11. [Session Occurrences Module](#11-session-occurrences-module)
12. [Attendance Module](#12-attendance-module)
13. [Enrollments Module](#13-enrollments-module)
14. [Notifications Module](#14-notifications-module)
15. [Lookup / Reference APIs](#15-lookup--reference-apis)
16. [SignalR Hub Contracts](#16-signalr-hub-contracts)
17. [Dashboard Aggregation Calls](#17-dashboard-aggregation-calls)
18. [Missing / Unverified Contracts](#18-missing--unverified-contracts)

---

## 1. Universal Response Wrapper

Every backend response must be wrapped in `ApiResult<T>`:

```typescript
interface ApiResult<T> {
  data: T;
  isSuccess: boolean;
  operationType: string;   // e.g. "Get", "Create", "Update", "Delete"
  message: string;
  statusCode: number;
}
```

**File:** `src/types/api.ts`

---

## 2. Pagination Model

All list endpoints that support paging return `PagedData<T>`:

```typescript
interface PagedData<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

Wrapped as `ApiResult<PagedData<T>>`.

**Supported page sizes used in UI:** 10, 20, 50

---

## 3. Authentication Module

### 3.1 Login
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/login` |
| **Auth required** | No |

```typescript
// Request body
interface LoginCommand {
  userNameOrEmail: string;  // frontend sends email here
  password: string;
}

// Response
ApiResult<string>   // data = JWT Bearer token string
```
**Triggered by:** `Login.tsx` → `AuthContext.login()`

---

### 3.2 Register
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/sign-up` |
| **Auth required** | No |

```typescript
// Request body
interface RegisterCommand {
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
  emailConfirmed: boolean;   // always sent as true from frontend
}

// Response
ApiResult<string>   // data = success message or token
```
**Triggered by:** `Register.tsx` → `AuthContext.register()`

---

### 3.3 Get All Users
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/auth/users` |

```typescript
// Response
ApiResult<AppUser[]>

interface AppUser {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}
```
**Used in:** `UsersRoles.tsx`

---

### 3.4 Get All Roles
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/auth/roles` |

```typescript
// Response
ApiResult<string[]>   // e.g. ["Admin", "Manager", "Coach"]
```
**Used in:** `UsersRoles.tsx`

---

### 3.5 Toggle User Active Status
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/users/{userId}/toggle-active` |

```typescript
// Response
ApiResult<boolean>
```

---

### 3.6 Create User (Admin)
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/users/create` |

```typescript
// Request body
interface CreateUserCommand {
  userName: string;
  email: string;
  password: string;
  roles: string[];
  isActive: boolean;
}

// Response
ApiResult<boolean>
```

---

### 3.7 Get My Profile
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/user/me` |

```typescript
// Response
ApiResult<MyProfileDto>

interface MyProfileDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
  createdAt?: string;   // ISO datetime
}
```
**Used in:** `MyProfile.tsx`

---

### 3.8 Change Password
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/change-password` |

```typescript
// Request body
interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

// Response
ApiResult<boolean>
```
**Triggered by:** `MyProfile.tsx` password tab

---

## 4. Trainees Module

### 4.1 DTOs

```typescript
// Card DTO — list view
interface TraineeCardDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  joinDate: string;            // ISO date
  sportName?: string;          // legacy single-sport (deprecated)
  skillLevel?: string;         // legacy
  sportSkills?: TraineeSportSkill[];   // preferred: multiple sports
  branchName: string;
  coachName: string;
  isSubscribed: boolean;
  attendanceRate: number;      // 0–100
  medicalConditions?: string[];
}

interface TraineeSportSkill {
  sportName: string;
  skillLevel: string;
}

// Detail DTO — profile view
interface TraineeDetailsDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  parentNumber?: string;
  guardianName?: string;
  branchName: string;
  birthDate?: string;          // ISO date "YYYY-MM-DD"
  gender?: string;
  sports?: string[];
  isSubscribed: boolean;
  attendanceRate?: number;
  enrollmentCount?: number;
  joinDate: string;
}
```

**Files:** `src/types/TraineeCardDto.ts`, `src/types/TraineeDetailsDto.ts`  
**Used in:** `Trainees.tsx`, `TraineeProfile.tsx`, `TraineeEditModal.tsx`, `EnrollmentFormModal.tsx`

---

### 4.2 Queries

```typescript
interface GetTraineesQuery {
  page: number;
  pageSize: number;
}

interface SearchTraineesQuery {
  searchTerm: string;
  page: number;
  pageSize: number;
}
```

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/trainee?page=&pageSize=` | `ApiResult<PagedData<TraineeCardDto>>` |
| `GET` | `/api/trainee/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<TraineeCardDto>>` |
| `GET` | `/api/trainee/search/{id}?page=&pageSize=` | `ApiResult<PagedData<TraineeCardDto>>` |
| `GET` | `/api/trainee/{id}` | `ApiResult<TraineeDetailsDto>` |
| `GET` | `/api/trainee/count` | `ApiResult<number>` |
| `GET` | `/api/trainee/count-active` | `ApiResult<number>` |
| `GET` | `/api/Trainee/get-count-for-specific-day?date=` | `ApiResult<number>` |
| `GET` | `/api/Trainee/get-all` | `ApiResult<{ id: number; firstName: string; lastName: string }[]>` |

---

### 4.3 Commands

```typescript
// Create Trainee
interface CreateTraineeCommand {
  firstName: string;
  lastName: string;
  ssn: string;                       // National ID
  parentNumber: string | null;
  guardianName: string | null;
  birthDate: string | null;          // "YYYY-MM-DD"
  gender: string;                    // "Male" | "Female"
  branchId: number;
  sportIds: number[];
  familyId: number;                  // 0 = no family
  nationalityCategoryId: number;
}
// Response: ApiResult<number>  (new trainee ID)
// Route: POST /api/Trainee
// Triggered by: TraineeFormModal

// Update Trainee
interface UpdateTraineeCommand {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  guardianName?: string | null;
  parentNumber?: string | null;
  branchId: number;
  sportIds?: number[] | null;
}
// Response: ApiResult<UpdateTraineeCommand>
// Route: PUT /api/Trainee
// Triggered by: TraineeEditModal

// Delete Trainee
// Route: DELETE /api/trainee/{id}
// Response: ApiResult<boolean>
```

---

## 5. Coaches Module

### 5.1 DTOs

```typescript
// Card DTO — extends EmployeeCardDto
interface CoachCardDto extends EmployeeCardDto {
  totalTrainees: number;
  skillLevel: string;
  sportName: string;
}

// Detail DTO — profile view
interface CoachDetailsDto {
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
  hireDate?: string | null;          // ISO date
  isWork: boolean;
  rating?: number | null;
}
```

**Files:** `src/types/CoachCardDto.ts`, `src/types/CoachDetailDto.ts`  
**Used in:** `Coaches.tsx`, `CoachProfile.tsx`

---

### 5.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/employee/coaches?page=&pageSize=` | `ApiResult<PagedData<CoachCardDto>>` |
| `GET` | `/api/coach/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<CoachCardDto>>` |
| `GET` | `/api/coach/{id}` | `ApiResult<CoachDetailsDto>` |
| `GET` | `/api/coach/count` | `ApiResult<number>` |
| `GET` | `/api/coach/rating-average` | `ApiResult<number>` |
| `GET` | `/api/Employee/coaches/active/count` | `ApiResult<number>` |
| `GET` | `/api/Coach/get-all` | `ApiResult<{ id: number; employeeFirstName: string; employeeLastName: string; branchId: number }[]>` |
| `GET` | `/api/sports/search-name?searchTerm=` | `ApiResult<SportDropDownListDto[]>` *(used in CoachFormModal)* |

---

### 5.3 Commands

```typescript
// Create Coach (assign existing employee as coach)
interface CreateCoachCommand {
  employeeId: number;
  sportId: number;
  skillLevel: string;   // "Beginner" | "Intermediate" | "Advanced" | "Professional"
}
// Response: ApiResult<number>  (new coach ID)
// Route: POST /api/coach
// Triggered by: CoachFormModal

// Update Coach
interface UpdateCoachCommand {
  sportId?: number;
  skillLevel?: string;
}
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
// Route: PUT /api/Coach/{id}
// Triggered by: CoachEditModal

// Delete Coach
// Route: DELETE /api/coaches/{id}
// Response: ApiResult<boolean>
```

---

## 6. Employees Module

### 6.1 DTOs

```typescript
interface EmployeeCardDto {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  branchName: string;
  email: string;
  isWork: boolean;
  phoneNumber: string;
  address: string;
  hireDate: Date;             // ISO datetime
}
```

**File:** `src/types/EmployeeCardDto.ts`  
**Used in:** `Employees.tsx`, `EmployeeProfile.tsx`, `CoachFormModal.tsx` *(employee picker)*

---

### 6.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/employee?page=&pageSize=` | `ApiResult<PagedData<EmployeeCardDto>>` |
| `GET` | `/api/employee/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<EmployeeCardDto>>` |
| `GET` | `/api/employee/{id}` | `ApiResult<EmployeeCardDto>` |
| `GET` | `/api/employee/count` | `ApiResult<number>` |
| `GET` | `/api/employee/active/count` | `ApiResult<number>` |

---

### 6.3 Commands

```typescript
// Create Employee
interface CreateEmployeeCommand {
  firstName: string;
  lastName: string;
  ssn: string;
  salary: number;
  gender: string;           // "Male" | "Female"
  birthDate: string | null; // "YYYY-MM-DD"
  email?: string | null;
  nationality?: string | null;
  street?: string | null;
  city?: string | null;
  phoneNumber: string;
  secondNumber?: string | null;
  position?: string | null;
  branchId: number;
}
// Response: ApiResult<number>
// Route: POST /api/Employee
// Triggered by: EmployeeFormModal

// Update Employee
interface UpdateEmployeeCommand {
  phoneNumber: string;
  secondNumber?: string | null;
  position?: string;
  salary?: number;
  branchId?: number;
  street?: string | null;
  city?: string | null;
  nationality?: string | null;
}
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
// Route: PUT /api/Employee/{id}
// Triggered by: EmployeeEditModal

// Toggle Status
// Route: PATCH /api/employee/{id}/toggle-status
// Response: ApiResult<boolean>

// Delete Employee
// Route: DELETE /api/employee/{id}
// Response: ApiResult<boolean>
```

---

## 7. Branches Module

### 7.1 DTOs

```typescript
interface BranchCardDto {
  id: number;
  name: string;
  city: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  coX?: number;     // longitude
  coY?: number;     // latitude
}

interface BranchStatsDto {
  totalTrainees: number;
  totalCoaches: number;
  activeGroups: number;
  activeSessions: number;
}

// Dropdown/picker form
interface BranchDropdownDto {
  id: number;
  name: string;
}
```

**File:** `src/types/BranchCardDto.ts`, `src/services/branch.services.ts`  
**Used in:** `Branches.tsx`, `BranchProfile.tsx`, `EmployeeFormModal.tsx`, `TraineeFormModal.tsx`, `TraineeGroupFormModal.tsx`

---

### 7.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/branch?page=&pageSize=` | `ApiResult<PagedData<BranchCardDto>>` |
| `GET` | `/api/branch/search?term=&page=&pageSize=` | `ApiResult<PagedData<BranchCardDto>>` |
| `GET` | `/api/branch/{id}` | `ApiResult<BranchCardDto>` |
| `GET` | `/api/branch/{id}/stats` | `ApiResult<BranchStatsDto>` |
| `GET` | `/api/branch/count` | `ApiResult<number>` |
| `GET` | `/api/Branch` | `ApiResult<BranchDropdownDto[]>` *(flat list for dropdowns)* |
| `GET` | `/api/Branch/get-all` | `ApiResult<{ id: number; name: string }[]>` *(used by TraineeGroupFormModal)* |

---

### 7.3 Commands

```typescript
// Create Branch
interface CreateBranchCommand {
  name: string;
  city: string;
  country: string;
  phoneNumber?: string | null;
  email?: string | null;
  coX?: number | null;
  coY?: number | null;
}
// Route: POST /api/Branch/create
// Response: ApiResult (any)
// Triggered by: BranchFormModal

// Update Branch
interface UpdateBranchCommand {
  name: string;
  city: string;
  country: string;
  phoneNumber?: string | null;
  email?: string | null;
  coX?: number | null;
  coY?: number | null;
}
// Route: PUT /api/Branch/{id}
// Triggered by: BranchEditModal

// Deactivate Branch
// Route: PATCH /api/branch/{id}/deactivate
// Response: ApiResult<boolean>

// Delete Branch
// Route: DELETE /api/branch/{id}
// Response: ApiResult<boolean>
```

---

## 8. Sports Module

### 8.1 DTOs

```typescript
interface SportDto {
  id: number;
  name: string;
  description?: string;
  category: "Individual" | "Team";
  isRequireHealthTest: boolean;
}

// Lightweight dropdown/search result
interface SportDropDownListDto {
  id: number;
  name: string;
}
```

**Files:** `src/types/SportDto.ts`, `src/types/SportDropDownListDto.ts`  
**Used in:** `Sports.tsx`, `SportProfile.tsx`, `CoachFormModal.tsx`, `TraineeFormModal.tsx`, `Dashboard.tsx`

---

### 8.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/Sports?page=&pageSize=` | `ApiResult<PagedData<SportDto>>` |
| `GET` | `/api/Sports/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<SportDto>>` |
| `GET` | `/api/sports/search-name?searchTerm=` | `ApiResult<SportDropDownListDto[]>` |
| `GET` | `/api/sports` | `ApiResult<{ id: number; name: string }[]>` |
| `GET` | `/api/Sports/get-all` | `ApiResult<{ id: number; name: string }[]>` *(CoachEditModal)* |
| `GET` | `/api/sport/{id}` | `ApiResult<SportDto>` |
| `GET` | `/api/sports/count` | `ApiResult<number>` |

---

### 8.3 Commands

```typescript
// Create Sport
interface CreateSportCommand {
  name: string;
  description?: string | null;
  category: "Individual" | "Team";
  isRequireHealthTest: boolean;
}
// Route: POST /api/Sports/create
// Triggered by: SportsFormModal

// Update Sport
interface UpdateSportCommand {
  name: string;
  description?: string | null;
  category: "Individual" | "Team";
  isRequireHealthTest: boolean;
}
// Route: PUT /api/Sports/{id}
// Triggered by: SportEditModal

// Add Skill Level to Sport
interface AddSkillLevelCommand {
  name: string;
  description?: string | null;
}
// Route: POST /api/Sports/{sportId}/skill-level
// Triggered by: AddSkillLevelModal

// Delete Sport
// Route: DELETE /api/sport/{id}
// Response: ApiResult<boolean>
```

---

## 9. Trainee Groups Module

### 9.1 DTOs

```typescript
// List DTO
interface ListTraineeGroupDto {
  id: number;
  sportName: string;
  coachName: string;
  branchName: string;
  durationInMinutes: number;
  traineesCount: number;
  startTime: string;     // "HH:mm:ss"
}

// Detail DTO
interface TraineeGroupDetailDto {
  id: number;
  skillLevel: string;
  gender: string;
  maximumCapacity: number;
  durationInMinutes: number;
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;
  traineesCount: number;
}
```

**Files:** `src/types/listTraineeGroup.ts`, `src/services/traineeGroup.services.ts`  
**Used in:** `TraineeGroups.tsx`, `TraineeGroupProfile.tsx`, `Sessions.tsx`, `OperateGroupModal.tsx`

---

### 9.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/TraineeGroup?page=&pageSize=` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/get-all-for-specific-day?date=&page=&pageSize=` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/{id}` | `ApiResult<TraineeGroupDetailDto>` |
| `GET` | `/api/TraineeGroup/count` | `ApiResult<number>` |
| `GET` | `/api/TraineeGroup/get-all-dropdown` | `ApiResult<{ id: number; name: string }[]>` *(EnrollmentFormModal)* |

---

### 9.3 Commands

```typescript
// Create Trainee Group
interface CreateTraineeGroupCommand {
  skillLevel: string;         // "Beginner" | "Intermediate" | "Advanced"
  maximumCapacity: number;
  durationInMinutes: number;  // >= 15
  gender: string;             // "Male" | "Female" | "Mixed"
  branchId: number;
  coachId: number;
}
// Route: POST /api/TraineeGroup/create
// Triggered by: TraineeGroupFormModal

// Update Trainee Group
interface UpdateTraineeGroupCommand {
  skillLevel?: string;
  maximumCapacity?: number;
  durationInMinutes?: number;
  gender?: string;
  coachId?: number;
}
// Route: PUT /api/TraineeGroup/{id}
// Triggered by: (edit modal in TraineeGroupProfile)

// Delete Trainee Group
// Route: DELETE /api/TraineeGroup/{id}
// Response: ApiResult<boolean>
```

---

## 10. Sessions Module

> **Note:** The Sessions page (`Sessions.tsx`) currently uses the same `TraineeGroup` endpoints as the TraineeGroups module. Sessions and TraineeGroups share the same backing API.

| Method | Route | Response | Notes |
|---|---|---|---|
| `GET` | `/api/TraineeGroup?page=&pageSize=` | `ApiResult<PagedData<SessionCardDto>>` | SessionCardDto ≈ ListTraineeGroupDto with `date` field |
| `GET` | `/api/TraineeGroup/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<SessionCardDto>>` | |
| `GET` | `/api/TraineeGroup/get-all-for-specific-day?date=&page=&pageSize=` | `ApiResult<PagedData<SessionCardDto>>` | |
| `GET` | `/api/TraineeGroup/count` | `ApiResult<number>` | |

```typescript
interface SessionCardDto {
  id: number;
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;        // "HH:mm:ss"
  durationInMinutes: number;
  traineesCount: number;
  date: string;             // "YYYY-MM-DD"
}
```

---

## 11. Session Occurrences Module

### 11.1 DTOs

```typescript
interface SessionOccurrenceDto {
  id: number;
  traineeGroupId: number;
  date: string;              // "YYYY-MM-DD"
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;         // "HH:mm:ss"
  durationInMinutes: number;
  totalEnrolled: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
}
```

**File:** `src/types/AttendanceDto.ts`  
**Used in:** `SessionOccurrences.tsx`, `Attendance.tsx`

---

### 11.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/SessionOccurrence?page=&pageSize=` | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| `GET` | `/api/SessionOccurrence?date=YYYY-MM-DD&page=&pageSize=` | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| `GET` | `/api/SessionOccurrence/search?searchTerm=&page=&pageSize=` | `ApiResult<PagedData<SessionOccurrenceDto>>` |

---

### 11.3 Commands

```typescript
// Generate Session Occurrences
interface GenerateSessionsCommand {
  traineeGroupId: number;
  durationInDays: number;
  groupScheduleId?: number | null;   // null = all schedules
}
// Route: POST /api/SessionOccurrence/generate
// Response: ApiResult<boolean>
// Triggered by: GenerateSessionsModal, OperateGroupModal
```

---

## 12. Attendance Module

### 12.1 DTOs

```typescript
type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused";

interface AttendanceRecordDto {
  id: number;
  traineeId: number;
  traineeName: string;
  checkInTime: string | null;   // "HH:mm:ss"
  status: AttendanceStatus;
}
```

**File:** `src/types/AttendanceDto.ts`  
**Used in:** `Attendance.tsx`, `MarkAttendanceModal.tsx`

---

### 12.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/attendance/session/{sessionOccurrenceId}` | `ApiResult<AttendanceRecordDto[]>` |
| `GET` | `/api/attendance/rate` | `ApiResult<number>` (0–100) |
| `GET` | `/api/attendance/rate?month={1-12}` | `ApiResult<number>` |

---

### 12.3 Commands

```typescript
// Single attendance mark
interface MarkAttendanceCommand {
  sessionOccurrenceId: number;
  traineeId: number;
  status: AttendanceStatus;
  checkInTime?: string;     // "HH:mm" optional
}
// Route: POST /api/attendance
// Response: ApiResult<boolean>

// Bulk mark (array of commands)
// Route: POST /api/attendance/bulk
// Request body: MarkAttendanceCommand[]
// Response: ApiResult<boolean>
// Triggered by: MarkAttendanceModal
```

---

## 13. Enrollments Module

### 13.1 DTOs

```typescript
interface EnrollmentCardDto {
  id: number;
  traineeName: string;
  traineeEmail?: string;
  sport: string;
  program?: string;
  branch?: string;
  coachName?: string;
  enrollmentDate?: string;   // ISO date
  startDate?: string;
  endDate?: string;
  monthlyFee?: number;
  paymentStatus?: string;    // e.g. "Paid" | "Pending" | "Overdue"
  status: string;            // e.g. "Active" | "Suspended" | "Expired"
  sessionsCompleted?: number;
  totalSessions?: number;
}
```

**File:** `src/types/EnrollmentCardDto.ts`  
**Used in:** `Enrollments.tsx`, `EnrollmentProfile.tsx`, `TraineeProfile.tsx`

---

### 13.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/Enrollment?page=&pageSize=` | `ApiResult<PagedData<EnrollmentCardDto>>` |
| `GET` | `/api/Enrollment/search?term=&page=&pageSize=` | `ApiResult<PagedData<EnrollmentCardDto>>` |
| `GET` | `/api/enrollment/{id}` | `ApiResult<EnrollmentCardDto>` |
| `GET` | `/api/Enrollment/count` | `ApiResult<number>` |
| `GET` | `/api/Enrollment/count/active` | `ApiResult<number>` |
| `GET` | `/api/Enrollment/count/pending-payment` | `ApiResult<number>` |
| `GET` | `/api/Enrollment/sports/{sportId}/enrollments/count?from=` | `ApiResult<number>` |

---

### 13.3 Commands

```typescript
// Create Enrollment
interface CreateEnrollmentCommand {
  traineeId: number;
  traineeGroupId: number;
  enrollmentDate: string;          // "YYYY-MM-DD"
  expiryDate: string;              // "YYYY-MM-DD"
  sessionAllowed: number;          // >= 1
  subscriptionDetailsId?: number | null;
}
// Route: POST /api/Enrollment/create
// Response: ApiResult (any)
// Triggered by: EnrollmentFormModal

// Update Enrollment
interface UpdateEnrollmentCommand {
  expiryDate?: string | null;
  sessionAllowed?: number | null;
  subscriptionDetailsId?: number | null;
}
// Route: PUT /api/enrollment/{id}
// Response: ApiResult<boolean>
// Triggered by: EnrollmentEditModal

// Update Payment Status
interface UpdatePaymentStatusCommand {
  paymentStatus: string;
}
// Route: PATCH /api/enrollment/{id}/payment-status
// Response: ApiResult<boolean>

// Activate Enrollment
// Route: PATCH /api/enrollment/{id}/activate
// Response: ApiResult<boolean>

// Suspend Enrollment
// Route: PATCH /api/enrollment/{id}/suspend
// Response: ApiResult<boolean>

// Delete Enrollment
// Route: DELETE /api/enrollment/{id}
// Response: ApiResult<boolean>
```

---

## 14. Notifications Module

### 14.1 DTOs

```typescript
interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;   // ISO datetime
}

type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "attendance"
  | "enrollment"
  | "session"
  | "system";
```

**File:** `src/services/notifications.service.ts`  
**Used in:** `NotificationsPage.tsx`, `AppLayout.tsx` (bell badge + tab title)

---

### 14.2 Queries

| Method | Route | Response |
|---|---|---|
| `GET` | `/api/notifications?page=&pageSize=` | `ApiResult<PagedData<NotificationDto>>` |
| `GET` | `/api/notifications/unread-count` | `ApiResult<number>` |

---

### 14.3 Commands

```typescript
// Mark Single Read
// Route: PATCH /api/notifications/{id}/read
// Response: ApiResult<null>

// Mark All Read
// Route: PATCH /api/notifications/read-all
// Response: ApiResult<null>
```

---

## 15. Lookup / Reference APIs

These are small, flat list endpoints used to populate dropdowns in forms:

| Method | Route | Response | Used By |
|---|---|---|---|
| `GET` | `/api/Family/search?searchTerm=` | `ApiResult<FamilyDto[]>` | `TraineeFormModal` |
| `GET` | `/api/NationalityCategory` | `ApiResult<NationalityCategoryDto[]>` | `TraineeFormModal` |
| `GET` | `/api/SubscriptionDetails/get-all` | `ApiResult<{ id: number; name: string }[]>` | `EnrollmentFormModal`, `EnrollmentEditModal` |

```typescript
interface FamilyDto {
  id: number;
  code: number;
}

interface NationalityCategoryDto {
  id: number;
  code: string;
  name: string;
}
```

---

## 16. SignalR Hub Contracts

### Hub Endpoint
```
/hubs/notifications
```
**Auth:** JWT Bearer token passed as query param or header on connection.

### Server → Client Events

```typescript
// ── RECEIVE_NOTIFICATION ──────────────────────────────────────────────────────
// Event name: "ReceiveNotification"
interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;   // ISO datetime
}
// Frontend reaction: add to list, increment unreadCount, show toast

// ── NOTIFICATION_READ ─────────────────────────────────────────────────────────
// Event name: "NotificationRead"
interface NotificationReadPayload {
  id: string;
}
// Frontend reaction: mark notification as read in list, decrement unreadCount

// ── ALL_NOTIFICATIONS_READ ────────────────────────────────────────────────────
// Event name: "AllNotificationsRead"
// Payload: none
// Frontend reaction: mark all notifications as read, reset unreadCount to 0

// ── ATTENDANCE_UPDATED ────────────────────────────────────────────────────────
// Event name: "AttendanceUpdated"
// Payload: none (triggers React Query invalidation of ["attendance"])
// Frontend reaction: refetch attendance queries

// ── SESSION_OCCURRENCE_UPDATED ────────────────────────────────────────────────
// Event name: "SessionOccurrenceUpdated"
// Payload: none (triggers invalidation of ["sessionOccurrences"])

// ── ENROLLMENT_UPDATED ────────────────────────────────────────────────────────
// Event name: "EnrollmentUpdated"
// Payload: none (triggers invalidation of ["enrollments"])

// ── DASHBOARD_STATS_UPDATED ───────────────────────────────────────────────────
// Event name: "DashboardStatsUpdated"
// Payload: none (triggers invalidation of ["dashboard"])

// ── TRAINEE_GROUP_UPDATED ─────────────────────────────────────────────────────
// Event name: "TraineeGroupUpdated"
// Payload: none (triggers invalidation of ["traineeGroups"])
```

---

## 17. Dashboard Aggregation Calls

The Dashboard page uses these endpoints directly (no dedicated `/api/dashboard/stats` endpoint exists):

| Data Point | Method | Route |
|---|---|---|
| Today's trainee count | `GET` | `/api/Trainee/get-count-for-specific-day?date=YYYY-MM-DD` |
| Active coaches count | `GET` | `/api/Employee/coaches/active/count` |
| Today's sessions | `GET` | `/api/TraineeGroup/get-all-for-specific-day?date=YYYY-MM-DD&page=1&pageSize=4` |
| Overall attendance rate | `GET` | `/api/attendance/rate` |
| Monthly attendance rate | `GET` | `/api/attendance/rate?month={1-12}` |
| All sports (for enrollment chart) | `GET` | `/api/sports` |
| Enrollments per sport | `GET` | `/api/Enrollment/sports/{sportId}/enrollments/count?from=2024-01-01` |

---

## 18. Missing / Unverified Contracts

The following APIs are called by the frontend but have unclear or missing backend contracts:

| Priority | Issue | Details |
|---|---|---|
| 🔴 HIGH | `GET /api/Trainee/get-all` | Returns flat array (no pagination). Exact DTO unclear — frontend expects `{ id, firstName, lastName }[]`. Used in `EnrollmentFormModal`. |
| 🔴 HIGH | `GET /api/TraineeGroup/get-all-dropdown` | Returns `{ id, name }[]`. `name` field must be defined. Used in `EnrollmentFormModal`. |
| 🔴 HIGH | `GET /api/SubscriptionDetails/get-all` | Endpoint and DTO fully unverified. No service file exists. Frontend expects `{ id: number; name: string }[]`. |
| 🔴 HIGH | `GET /api/Branch/get-all` | Used in `TraineeGroupFormModal`. Same shape as `/api/Branch` but different route. Must be consistent. |
| 🔴 HIGH | `GET /api/Sports/get-all` | Used in `CoachEditModal`. Must return `{ id: number; name: string }[]`. |
| 🔴 HIGH | `GET /api/Coach/get-all` | Used in `TraineeGroupFormModal`. Expected shape: `{ id, employeeFirstName, employeeLastName, branchId }[]`. |
| 🟡 MED | `GET /api/enrollment/{id}` | Returns `ApiResult<unknown>` — exact `EnrollmentCardDto` or a detail DTO is not confirmed. |
| 🟡 MED | `GET /api/branch/{id}` | Returns `ApiResult<unknown>` — must return `BranchCardDto`. |
| 🟡 MED | `GET /api/sport/{id}` | Returns `ApiResult<unknown>` — must return `SportDto`. |
| 🟡 MED | `POST /api/Sports/create` vs `POST /api/Sports/{id}` | Inconsistent REST convention. Create uses `/create` suffix; update uses `/{id}`. Recommend normalizing to `POST /api/Sports` + `PUT /api/Sports/{id}`. |
| 🟡 MED | `POST /api/Branch/create` vs `PUT /api/Branch/{id}` | Same inconsistency — create uses `/create` suffix. |
| 🟡 MED | `POST /api/TraineeGroup/create` | Same `/create` suffix inconsistency. |
| 🟢 LOW | Dashboard has no single aggregated endpoint | All stats are fetched via N+1 individual calls (one per sport for enrollments). A `GET /api/dashboard/stats` endpoint would improve performance. |
| 🟢 LOW | `GET /api/Family/search?searchTerm=` | Returns flat array, no pagination. Confirm this is intentional. |
| 🟢 LOW | Notification `id` type | Frontend uses `string` for notification IDs. Backend must return string-typed UUIDs, not integers. |

---

## Summary Table — All Endpoints

| Module | Method | Route | Auth |
|---|---|---|---|
| Auth | POST | /api/auth/login | No |
| Auth | POST | /api/auth/sign-up | No |
| Auth | GET | /api/auth/users | Yes |
| Auth | GET | /api/auth/roles | Yes |
| Auth | POST | /api/auth/users/create | Yes |
| Auth | POST | /api/auth/users/{id}/toggle-active | Yes |
| Auth | GET | /api/user/me | Yes |
| Auth | POST | /api/auth/change-password | Yes |
| Trainees | GET | /api/trainee | Yes |
| Trainees | GET | /api/trainee/search | Yes |
| Trainees | GET | /api/trainee/search/{id} | Yes |
| Trainees | GET | /api/trainee/{id} | Yes |
| Trainees | GET | /api/trainee/count | Yes |
| Trainees | GET | /api/trainee/count-active | Yes |
| Trainees | GET | /api/Trainee/get-count-for-specific-day | Yes |
| Trainees | GET | /api/Trainee/get-all | Yes |
| Trainees | POST | /api/Trainee | Yes |
| Trainees | PUT | /api/Trainee | Yes |
| Trainees | DELETE | /api/trainee/{id} | Yes |
| Coaches | GET | /api/employee/coaches | Yes |
| Coaches | GET | /api/coach/search | Yes |
| Coaches | GET | /api/coach/{id} | Yes |
| Coaches | GET | /api/coach/count | Yes |
| Coaches | GET | /api/coach/rating-average | Yes |
| Coaches | GET | /api/Employee/coaches/active/count | Yes |
| Coaches | GET | /api/Coach/get-all | Yes |
| Coaches | POST | /api/coach | Yes |
| Coaches | PUT | /api/Coach/{id} | Yes |
| Coaches | DELETE | /api/coaches/{id} | Yes |
| Employees | GET | /api/employee | Yes |
| Employees | GET | /api/employee/search | Yes |
| Employees | GET | /api/employee/{id} | Yes |
| Employees | GET | /api/employee/count | Yes |
| Employees | GET | /api/employee/active/count | Yes |
| Employees | POST | /api/Employee | Yes |
| Employees | PUT | /api/Employee/{id} | Yes |
| Employees | PATCH | /api/employee/{id}/toggle-status | Yes |
| Employees | DELETE | /api/employee/{id} | Yes |
| Branches | GET | /api/branch | Yes |
| Branches | GET | /api/branch/search | Yes |
| Branches | GET | /api/Branch | Yes |
| Branches | GET | /api/Branch/get-all | Yes |
| Branches | GET | /api/branch/{id} | Yes |
| Branches | GET | /api/branch/{id}/stats | Yes |
| Branches | GET | /api/branch/count | Yes |
| Branches | POST | /api/Branch/create | Yes |
| Branches | PUT | /api/Branch/{id} | Yes |
| Branches | PATCH | /api/branch/{id}/deactivate | Yes |
| Branches | DELETE | /api/branch/{id} | Yes |
| Sports | GET | /api/Sports | Yes |
| Sports | GET | /api/Sports/search | Yes |
| Sports | GET | /api/sports/search-name | Yes |
| Sports | GET | /api/sports | Yes |
| Sports | GET | /api/Sports/get-all | Yes |
| Sports | GET | /api/sport/{id} | Yes |
| Sports | GET | /api/sports/count | Yes |
| Sports | POST | /api/Sports/create | Yes |
| Sports | POST | /api/Sports/{id}/skill-level | Yes |
| Sports | PUT | /api/Sports/{id} | Yes |
| Sports | DELETE | /api/sport/{id} | Yes |
| TraineeGroups | GET | /api/TraineeGroup | Yes |
| TraineeGroups | GET | /api/TraineeGroup/search | Yes |
| TraineeGroups | GET | /api/TraineeGroup/get-all-for-specific-day | Yes |
| TraineeGroups | GET | /api/TraineeGroup/{id} | Yes |
| TraineeGroups | GET | /api/TraineeGroup/count | Yes |
| TraineeGroups | GET | /api/TraineeGroup/get-all-dropdown | Yes |
| TraineeGroups | POST | /api/TraineeGroup/create | Yes |
| TraineeGroups | PUT | /api/TraineeGroup/{id} | Yes |
| TraineeGroups | DELETE | /api/TraineeGroup/{id} | Yes |
| SessionOccurrences | GET | /api/SessionOccurrence | Yes |
| SessionOccurrences | GET | /api/SessionOccurrence/search | Yes |
| SessionOccurrences | POST | /api/SessionOccurrence/generate | Yes |
| Attendance | GET | /api/attendance/session/{id} | Yes |
| Attendance | GET | /api/attendance/rate | Yes |
| Attendance | POST | /api/attendance | Yes |
| Attendance | POST | /api/attendance/bulk | Yes |
| Enrollments | GET | /api/Enrollment | Yes |
| Enrollments | GET | /api/Enrollment/search | Yes |
| Enrollments | GET | /api/enrollment/{id} | Yes |
| Enrollments | GET | /api/Enrollment/count | Yes |
| Enrollments | GET | /api/Enrollment/count/active | Yes |
| Enrollments | GET | /api/Enrollment/count/pending-payment | Yes |
| Enrollments | GET | /api/Enrollment/sports/{id}/enrollments/count | Yes |
| Enrollments | POST | /api/Enrollment/create | Yes |
| Enrollments | PUT | /api/enrollment/{id} | Yes |
| Enrollments | PATCH | /api/enrollment/{id}/payment-status | Yes |
| Enrollments | PATCH | /api/enrollment/{id}/activate | Yes |
| Enrollments | PATCH | /api/enrollment/{id}/suspend | Yes |
| Enrollments | DELETE | /api/enrollment/{id} | Yes |
| Notifications | GET | /api/notifications | Yes |
| Notifications | GET | /api/notifications/unread-count | Yes |
| Notifications | PATCH | /api/notifications/{id}/read | Yes |
| Notifications | PATCH | /api/notifications/read-all | Yes |
| Lookups | GET | /api/Family/search | Yes |
| Lookups | GET | /api/NationalityCategory | Yes |
| Lookups | GET | /api/SubscriptionDetails/get-all | Yes |
