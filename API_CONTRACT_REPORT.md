# AURA Sport Academy — Backend–Frontend API Contract Report
> Full codebase audit — every service file, modal, page, and type inspected · 2026-03-08

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
10. [Sessions Module](#10-sessions-module)
11. [Session Occurrences Module](#11-session-occurrences-module)
12. [Attendance Module](#12-attendance-module)
13. [Enrollments Module](#13-enrollments-module)
14. [Notifications Module](#14-notifications-module)
15. [Lookup / Reference APIs](#15-lookup--reference-apis)
16. [SignalR Hub Contracts](#16-signalr-hub-contracts)
17. [Dashboard Aggregation Calls](#17-dashboard-aggregation-calls)
18. [Complete Endpoint Summary Table](#18-complete-endpoint-summary-table)
19. [Missing / Unverified Contracts](#19-missing--unverified-contracts)

---

## 1. Universal Response Wrapper

**Every** backend response MUST be wrapped in `ApiResult<T>`.  
Frontend code at `src/lib/api.ts` deserialises all responses into this shape.

```typescript
// src/types/api.ts
interface ApiResult<T> {
  data: T;
  isSuccess: boolean;
  operationType: string;   // e.g. "Get" | "Create" | "Update" | "Delete"
  message: string;
  statusCode: number;
}
```

### HTTP Status Conventions expected by the frontend

| Status | Frontend behaviour |
|---|---|
| `200 OK` | Normal success — parse body as `ApiResult<T>` |
| `204 No Content` | Treated as success — returns `undefined` |
| `400 Bad Request` | Throws `ApiError`; reads `errors` / `message` / `title` for UI |
| `401 Unauthorized` | Auto-logout via registered handler in `AuthContext` |
| `4xx / 5xx` | Throws `ApiError(status, body)` |

### `ApiError` validation error extraction

The frontend reads validation messages from the response body in this priority order:
1. `body.errors` — object of `{ field: string[] }` (ASP.NET ModelState)
2. `body.message` — plain string
3. `body.title` — fallback for problem-detail responses

---

## 2. Pagination Model

All list endpoints that support paging return `PagedData<T>`:

```typescript
// src/types/api.ts
interface PagedData<T> {
  items: T[];
  totalCount: number;
  page: number;       // 1-based
  pageSize: number;
}
```

Wrapped as `ApiResult<PagedData<T>>`.

**Page sizes used in the UI:** 10 (default), 20, 50

---

## 3. Authentication Module

### 3.1 Login
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/login` |
| **Auth required** | ❌ No |

```typescript
// Request body — sent by AuthContext.login()
interface LoginCommand {
  userNameOrEmail: string;   // frontend always sends the email value here
  password: string;
}

// Response
ApiResult<string>   // data = raw JWT Bearer token string
```

**Token handling:** Frontend decodes the JWT `exp` claim to derive `expiresAt`, stores token + expiresAt in `localStorage`, and auto-logs out via `setTimeout` when `expiresAt` is reached.  
**Triggered by:** `Login.tsx` → `AuthContext.login()`

---

### 3.2 Register
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/sign-up` |
| **Auth required** | ❌ No |

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
ApiResult<string>   // data = success message
```

**Triggered by:** `Register.tsx` → `AuthContext.register()`

---

### 3.3 Get All Users (Admin)
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/auth/users` |
| **Auth required** | ✅ Bearer |

```typescript
// Response
ApiResult<AppUser[]>

interface AppUser {
  id: string;           // UUID string
  userName: string;
  email: string;
  roles: string[];      // e.g. ["Admin", "Coach"]
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
| **Auth required** | ✅ Bearer |

```typescript
// Response
ApiResult<string[]>   // e.g. ["Admin", "Manager", "Coach"]
```

**Used in:** `UsersRoles.tsx` (populate role assignment dropdown)

---

### 3.5 Toggle User Active Status
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/users/{userId}/toggle-active` |
| **Auth required** | ✅ Bearer |

```typescript
// No request body
// Response
ApiResult<boolean>   // true = now active, false = now inactive
```

---

### 3.6 Create User (Admin)
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/users/create` |
| **Auth required** | ✅ Bearer |

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

**Triggered by:** `UsersRoles.tsx` create user form

---

### 3.7 Get My Profile
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/user/me` |
| **Auth required** | ✅ Bearer |

```typescript
// Response
ApiResult<MyProfileDto>

interface MyProfileDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  roles?: string[];
  createdAt?: string;   // ISO datetime "YYYY-MM-DDTHH:mm:ssZ"
}
```

**Used in:** `MyProfile.tsx`

---

### 3.8 Change Password
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/change-password` |
| **Auth required** | ✅ Bearer |

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
// ── TraineeSportSkill (embedded in TraineeCardDto) ──────────────────────────
interface TraineeSportSkill {
  sportName: string;
  skillLevel: string;
}

// ── TraineeCardDto — used in list views ─────────────────────────────────────
// File: src/types/TraineeCardDto.ts
interface TraineeCardDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  joinDate: string;                    // ISO date "YYYY-MM-DD"
  /** Legacy single-sport — kept for backward compat, prefer sportSkills[] */
  sportName?: string;
  skillLevel?: string;
  /** Preferred: array of sports with individual skill levels */
  sportSkills?: TraineeSportSkill[];
  branchName: string;
  coachName: string;
  isSubscribed: boolean;
  attendanceRate: number;              // 0–100
  medicalConditions?: string[];
}

// ── TraineeDetailsDto — used in profile / detail view ───────────────────────
// File: src/types/TraineeDetailsDto.ts
interface TraineeDetailsDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  parentNumber?: string;
  guardianName?: string;
  branchName: string;
  birthDate?: string;                  // ISO date "YYYY-MM-DD"
  gender?: string;                     // "Male" | "Female"
  sports?: string[];
  isSubscribed: boolean;
  attendanceRate?: number;             // 0–100
  enrollmentCount?: number;
  joinDate: string;                    // ISO date "YYYY-MM-DD"
}

// ── Flat list DTO (used in dropdown pickers) ─────────────────────────────────
interface TraineeDropdownDto {
  id: number;
  firstName: string;
  lastName: string;
}
```

**Files:** `src/types/TraineeCardDto.ts`, `src/types/TraineeDetailsDto.ts`  
**Used in:** `Trainees.tsx`, `TraineeProfile.tsx`, `TraineeEditModal.tsx`, `EnrollmentFormModal.tsx`

---

### 4.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/trainee` | `page`, `pageSize` | `ApiResult<PagedData<TraineeCardDto>>` |
| `GET` | `/api/trainee/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<TraineeCardDto>>` |
| `GET` | `/api/trainee/search/{id}` | `page`, `pageSize` | `ApiResult<PagedData<TraineeCardDto>>` |
| `GET` | `/api/trainee/{id}` | — | `ApiResult<TraineeDetailsDto>` |
| `GET` | `/api/trainee/count` | — | `ApiResult<number>` |
| `GET` | `/api/trainee/count-active` | — | `ApiResult<number>` |
| `GET` | `/api/Trainee/get-count-for-specific-day` | `date` (ISO "YYYY-MM-DD") | `ApiResult<number>` |
| `GET` | `/api/Trainee/get-all` | — | `ApiResult<TraineeDropdownDto[]>` |

> **Note on `/api/Trainee/get-all`:** Returns a flat (unpaginated) list. Used by `EnrollmentFormModal` to populate the trainee picker. The frontend expects `{ id: number; firstName: string; lastName: string }[]`.

---

### 4.3 Commands

```typescript
// ── Create Trainee ───────────────────────────────────────────────────────────
// Route:    POST /api/Trainee
// Response: ApiResult<number>   (new trainee's ID)
// Trigger:  TraineeFormModal
interface CreateTraineeCommand {
  firstName: string;
  lastName: string;
  ssn: string;                         // National ID (5–30 chars)
  parentNumber: string | null;
  guardianName: string | null;
  birthDate: string | null;            // "YYYY-MM-DD"
  gender: string;                      // "Male" | "Female"
  branchId: number;
  sportIds: number[];
  familyId: number;                    // 0 or valid family ID
  nationalityCategoryId: number;
}

// ── Update Trainee ───────────────────────────────────────────────────────────
// Route:    PUT /api/Trainee
// Response: ApiResult<UpdateTraineeCommand>   (echoes back updated fields)
// Trigger:  TraineeEditModal
interface UpdateTraineeCommand {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  guardianName?: string | null;
  parentNumber?: string | null;
  branchId: number;
  sportIds?: number[] | null;
}

// ── Delete Trainee ───────────────────────────────────────────────────────────
// Route:    DELETE /api/trainee/{id}
// Response: ApiResult<boolean>
```

---

## 5. Coaches Module

### 5.1 DTOs

```typescript
// ── CoachCardDto — list view (extends EmployeeCardDto) ──────────────────────
// File: src/types/CoachCardDto.ts
type CoachCardDto = EmployeeCardDto & {
  totalTrainees: number;
  skillLevel: string;      // "Beginner" | "Intermediate" | "Advanced" | "Professional"
  sportName: string;
};

// ── CoachDetailsDto — profile view ──────────────────────────────────────────
// File: src/types/CoachDetailDto.ts
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
  hireDate?: string | null;            // ISO date "YYYY-MM-DD"
  isWork: boolean;
  rating?: number | null;              // 0.0–5.0
}

// ── Coach flat-list DTO (for picker dropdowns) ───────────────────────────────
interface CoachDropdownDto {
  id: number;
  employeeFirstName: string;
  employeeLastName: string;
  branchId: number;
}
```

**Files:** `src/types/CoachCardDto.ts`, `src/types/CoachDetailDto.ts`  
**Used in:** `Coaches.tsx`, `CoachProfile.tsx`, `CoachEditModal.tsx`, `TraineeGroupFormModal.tsx`

---

### 5.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/employee/coaches` | `page`, `pageSize` | `ApiResult<PagedData<CoachCardDto>>` |
| `GET` | `/api/coach/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<CoachCardDto>>` |
| `GET` | `/api/coach/{id}` | — | `ApiResult<CoachDetailsDto>` |
| `GET` | `/api/coach/count` | — | `ApiResult<number>` |
| `GET` | `/api/coach/rating-average` | — | `ApiResult<number>` (0.0–5.0) |
| `GET` | `/api/Employee/coaches/active/count` | — | `ApiResult<number>` |
| `GET` | `/api/Coach/get-all` | — | `ApiResult<CoachDropdownDto[]>` |

> **Note on `/api/Coach/get-all`:** Returns an unpaginated flat list filtered by active coaches. Used by `TraineeGroupFormModal` to populate the coach picker (client-side branch filtering applied after fetch). Expected shape: `{ id, employeeFirstName, employeeLastName, branchId }[]`.

---

### 5.3 Commands

```typescript
// ── Create Coach (assign existing employee as coach) ─────────────────────────
// Route:    POST /api/coach
// Response: ApiResult<number>   (new coach ID)
// Trigger:  CoachFormModal
interface CreateCoachCommand {
  employeeId: number;
  sportId: number;
  skillLevel: string;   // "Beginner" | "Intermediate" | "Advanced" | "Professional"
}

// ── Update Coach ─────────────────────────────────────────────────────────────
// Route:    PUT /api/Coach/{id}
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
// Trigger:  CoachEditModal
// NOTE: Both fields are optional — send only what changed
interface UpdateCoachCommand {
  sportId?: number;
  skillLevel?: string;
}

// ── Delete Coach ─────────────────────────────────────────────────────────────
// Route:    DELETE /api/coaches/{id}
// Response: ApiResult<boolean>
```

---

## 6. Employees Module

### 6.1 DTOs

```typescript
// ── EmployeeCardDto — list and profile view ──────────────────────────────────
// File: src/types/EmployeeCardDto.ts
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
  hireDate: Date;               // ISO datetime string; frontend uses as Date
}
```

**File:** `src/types/EmployeeCardDto.ts`  
**Used in:** `Employees.tsx`, `EmployeeProfile.tsx`, `CoachFormModal.tsx` (as employee picker source)

---

### 6.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/employee` | `page`, `pageSize` | `ApiResult<PagedData<EmployeeCardDto>>` |
| `GET` | `/api/employee/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<EmployeeCardDto>>` |
| `GET` | `/api/employee/{id}` | — | `ApiResult<EmployeeCardDto>` |
| `GET` | `/api/employee/count` | — | `ApiResult<number>` |
| `GET` | `/api/employee/active/count` | — | `ApiResult<number>` |

---

### 6.3 Commands

```typescript
// ── Create Employee ──────────────────────────────────────────────────────────
// Route:    POST /api/Employee
// Response: ApiResult<number>   (new employee ID)
// Trigger:  EmployeeFormModal
// Validation: firstName/lastName 2–50 chars, ssn 5–30, phoneNumber 7–20,
//             salary >= 0, birthDate required, branchId required
interface CreateEmployeeCommand {
  firstName: string;
  lastName: string;
  ssn: string;
  salary: number;
  gender: string;             // "Male" | "Female"
  birthDate: string | null;   // "YYYY-MM-DD"
  email?: string | null;      // max 255 chars
  nationality?: string | null;
  street?: string | null;     // max 150 chars
  city?: string | null;       // max 100 chars
  phoneNumber: string;
  secondNumber?: string | null;
  position?: string | null;   // max 100 chars
  branchId: number;
}

// ── Update Employee ──────────────────────────────────────────────────────────
// Route:    PUT /api/Employee/{id}
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
// Trigger:  EmployeeEditModal
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

// ── Toggle Active Status ─────────────────────────────────────────────────────
// Route:    PATCH /api/employee/{id}/toggle-status
// Response: ApiResult<boolean>

// ── Delete Employee ──────────────────────────────────────────────────────────
// Route:    DELETE /api/employee/{id}
// Response: ApiResult<boolean>
```

---

## 7. Branches Module

### 7.1 DTOs

```typescript
// ── BranchCardDto — list view ────────────────────────────────────────────────
// File: src/types/BranchCardDto.ts
interface BranchCardDto {
  id: number;
  name: string;
  city: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  coX?: number;       // longitude (coordinate X)
  coY?: number;       // latitude  (coordinate Y)
}

// ── BranchStatsDto — profile stats panel ────────────────────────────────────
// File: src/services/branch.services.ts
interface BranchStatsDto {
  totalTrainees: number;
  totalCoaches: number;
  activeGroups: number;
  activeSessions: number;
}

// ── BranchDropdownDto — used in form pickers ─────────────────────────────────
interface BranchDropdownDto {
  id: number;
  name: string;
}
```

**Files:** `src/types/BranchCardDto.ts`, `src/services/branch.services.ts`  
**Used in:** `Branches.tsx`, `BranchProfile.tsx`, `EmployeeFormModal.tsx`, `TraineeFormModal.tsx`, `TraineeGroupFormModal.tsx`

---

### 7.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/branch` | `page`, `pageSize` | `ApiResult<PagedData<BranchCardDto>>` |
| `GET` | `/api/branch/search` | `term`, `page`, `pageSize` | `ApiResult<PagedData<BranchCardDto>>` |
| `GET` | `/api/branch/{id}` | — | `ApiResult<BranchCardDto>` |
| `GET` | `/api/branch/{id}/stats` | — | `ApiResult<BranchStatsDto>` |
| `GET` | `/api/branch/count` | — | `ApiResult<number>` |
| `GET` | `/api/Branch` | — | `ApiResult<BranchDropdownDto[]>` *(flat list — used by `EmployeeFormModal`)* |
| `GET` | `/api/Branch/get-all` | — | `ApiResult<BranchDropdownDto[]>` *(flat list — used by `TraineeGroupFormModal`)* |

> **⚠️ Inconsistency:** `/api/Branch` and `/api/Branch/get-all` appear to serve the same purpose (flat list of all branches for dropdowns). Backend should clarify whether these are the same endpoint or serve different filtering logic. Frontend currently calls both.

---

### 7.3 Commands

```typescript
// ── Create Branch ────────────────────────────────────────────────────────────
// Route:    POST /api/Branch/create
// Response: ApiResult (any shape — frontend doesn't inspect data)
// Trigger:  BranchFormModal
interface CreateBranchCommand {
  name: string;
  city: string;
  country: string;
  phoneNumber?: string | null;
  email?: string | null;
  coX?: number | null;   // longitude
  coY?: number | null;   // latitude
}

// ── Update Branch ────────────────────────────────────────────────────────────
// Route:    PUT /api/Branch/{id}
// Response: ApiResult (any)
// Trigger:  BranchEditModal
interface UpdateBranchCommand {
  name: string;
  city: string;
  country: string;
  phoneNumber?: string | null;
  email?: string | null;
  coX?: number | null;
  coY?: number | null;
}

// ── Deactivate Branch ────────────────────────────────────────────────────────
// Route:    PATCH /api/branch/{id}/deactivate
// Response: ApiResult<boolean>

// ── Delete Branch ────────────────────────────────────────────────────────────
// Route:    DELETE /api/branch/{id}
// Response: ApiResult<boolean>
```

---

## 8. Sports Module

### 8.1 DTOs

```typescript
// ── SportDto — list and detail view ─────────────────────────────────────────
// File: src/types/SportDto.ts
type SportCategory = "Individual" | "Team";

interface SportDto {
  id: number;
  name: string;
  description?: string;
  category: SportCategory;
  isRequireHealthTest: boolean;
}

// ── SportDropDownListDto — lightweight picker ────────────────────────────────
// File: src/types/SportDropDownListDto.ts
interface SportDropDownListDto {
  id: number;
  name: string;
}
```

**Files:** `src/types/SportDto.ts`, `src/types/SportDropDownListDto.ts`  
**Used in:** `Sports.tsx`, `SportProfile.tsx`, `CoachFormModal.tsx`, `CoachEditModal.tsx`, `TraineeFormModal.tsx`, `Dashboard.tsx` (enrollment chart)

---

### 8.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/Sports` | `page`, `pageSize` | `ApiResult<PagedData<SportDto>>` |
| `GET` | `/api/Sports/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<SportDto>>` |
| `GET` | `/api/sports/search-name` | `searchTerm` | `ApiResult<SportDropDownListDto[]>` |
| `GET` | `/api/sports` | — | `ApiResult<{ id: number; name: string }[]>` *(flat list for Dashboard chart)* |
| `GET` | `/api/Sports/get-all` | — | `ApiResult<{ id: number; name: string }[]>` *(used by `CoachEditModal`)* |
| `GET` | `/api/sport/{id}` | — | `ApiResult<SportDto>` |
| `GET` | `/api/sports/count` | — | `ApiResult<number>` |

> **⚠️ Case inconsistency:** Routes use both `/api/Sports` (capitalised) and `/api/sports` (lowercase). Backend routing should be case-insensitive. Confirm this is handled.

---

### 8.3 Commands

```typescript
// ── Create Sport ─────────────────────────────────────────────────────────────
// Route:    POST /api/Sports/create
// Response: ApiResult (any)
// Trigger:  SportsFormModal
interface CreateSportCommand {
  name: string;
  description?: string | null;
  category: "Individual" | "Team";
  isRequireHealthTest: boolean;
}

// ── Update Sport ─────────────────────────────────────────────────────────────
// Route:    PUT /api/Sports/{id}
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
// Trigger:  SportEditModal
interface UpdateSportCommand {
  name: string;
  description?: string | null;
  category: "Individual" | "Team";
  isRequireHealthTest: boolean;
}

// ── Add Skill Level to Sport ─────────────────────────────────────────────────
// Route:    POST /api/Sports/{sportId}/skill-level
// Response: ApiResult (any)
// Trigger:  AddSkillLevelModal
interface AddSkillLevelCommand {
  name: string;
  description?: string | null;
}

// ── Delete Sport ─────────────────────────────────────────────────────────────
// Route:    DELETE /api/sport/{id}
// Response: ApiResult<boolean>
```

---

## 9. Trainee Groups Module

### 9.1 DTOs

```typescript
// ── ListTraineeGroupDto — list view ─────────────────────────────────────────
// File: src/types/listTraineeGroup.ts
interface ListTraineeGroupDto {
  id: number;
  sportName: string;
  coachName: string;
  branchName: string;
  durationInMinutes: number;
  traineesCount: number;
  startTime: string;         // "HH:mm:ss" e.g. "16:30:00"
}

// ── TraineeGroupDetailDto — profile / detail view ───────────────────────────
// File: src/services/traineeGroup.services.ts
interface TraineeGroupDetailDto {
  id: number;
  skillLevel: string;        // "Beginner" | "Intermediate" | "Advanced"
  gender: string;            // "Male" | "Female" | "Mixed"
  maximumCapacity: number;
  durationInMinutes: number;
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;         // "HH:mm:ss"
  traineesCount: number;
  /** Optional: schedule slots — used in EnrollmentFormModal to auto-suggest sessionsAllowed */
  schedules?: GroupScheduleDto[];
}

// ── GroupScheduleDto — embedded in TraineeGroupDetailDto ────────────────────
// Used by EnrollmentFormModal to derive weeklyFrequency for session count suggestion
interface GroupScheduleDto {
  id: number;
  dayOfWeek: string;   // "Monday" | "Tuesday" | ...
  startTime: string;   // "HH:mm:ss"
  endTime: string;     // "HH:mm:ss"
}

// ── TraineeGroupDropdownDto — flat list for pickers ──────────────────────────
interface TraineeGroupDropdownDto {
  id: number;
  name: string;   // Backend must compose a descriptive name, e.g. "Basketball – Main – Mon/Wed"
}
```

**Files:** `src/types/listTraineeGroup.ts`, `src/services/traineeGroup.services.ts`  
**Used in:** `TraineeGroups.tsx`, `TraineeGroupProfile.tsx`, `Sessions.tsx`, `OperateGroupModal.tsx`, `EnrollmentFormModal.tsx`

---

### 9.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/TraineeGroup` | `page`, `pageSize` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/get-all-for-specific-day` | `date` (ISO), `page`, `pageSize` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/{id}` | — | `ApiResult<TraineeGroupDetailDto>` |
| `GET` | `/api/TraineeGroup/count` | — | `ApiResult<number>` |
| `GET` | `/api/TraineeGroup/get-all-dropdown` | — | `ApiResult<TraineeGroupDropdownDto[]>` |

> **⚠️ Critical:** `/api/TraineeGroup/{id}` is called by `EnrollmentFormModal` to retrieve the group's `schedules` array and derive `weeklyFrequency`. If `schedules` is not returned in the detail response, the auto-suggest feature will silently fall back to manual entry.

---

### 9.3 Commands

```typescript
// ── Create Trainee Group ──────────────────────────────────────────────────────
// Route:    POST /api/TraineeGroup/create
// Response: ApiResult (any)
// Trigger:  TraineeGroupFormModal
// Validation: durationInMinutes >= 15, maximumCapacity >= 1
interface CreateTraineeGroupCommand {
  skillLevel: string;         // "Beginner" | "Intermediate" | "Advanced"
  maximumCapacity: number;    // >= 1
  durationInMinutes: number;  // >= 15
  gender: string;             // "Male" | "Female" | "Mixed"
  branchId: number;
  coachId: number;
}

// ── Update Trainee Group ──────────────────────────────────────────────────────
// Route:    PUT /api/TraineeGroup/{id}
// Response: ApiResult<boolean>
// Trigger:  TraineeGroupFormModal (edit mode, from TraineeGroupProfile)
// NOTE: All fields optional — send only changed fields
interface UpdateTraineeGroupCommand {
  skillLevel?: string;
  maximumCapacity?: number;
  durationInMinutes?: number;
  gender?: string;
  coachId?: number;
}

// ── Delete Trainee Group ──────────────────────────────────────────────────────
// Route:    DELETE /api/TraineeGroup/{id}
// Response: ApiResult<boolean>
```

---

## 10. Sessions Module

> **Architecture note:** The Sessions page (`Sessions.tsx`) re-uses the TraineeGroup endpoints. There is no separate `/api/session` resource. `SessionCardDto ≈ ListTraineeGroupDto + date field`.

### 10.1 DTOs

```typescript
// ── SessionCardDto — sessions list view ─────────────────────────────────────
// File: src/types/SessionCardDto.ts
interface SessionCardDto {
  id: number;
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;         // "HH:mm:ss"
  durationInMinutes: number;
  traineesCount: number;
  date: string;              // "YYYY-MM-DD"
}
```

### 10.2 Queries (all served by TraineeGroup endpoints)

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/TraineeGroup` | `page`, `pageSize` | `ApiResult<PagedData<SessionCardDto>>` |
| `GET` | `/api/TraineeGroup/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<SessionCardDto>>` |
| `GET` | `/api/TraineeGroup/get-all-for-specific-day` | `date`, `page`, `pageSize` | `ApiResult<PagedData<SessionCardDto>>` |
| `GET` | `/api/TraineeGroup/count` | — | `ApiResult<number>` |

---

## 11. Session Occurrences Module

### 11.1 DTOs

```typescript
// ── SessionOccurrenceDto — occurrence list and attendance day view ────────────
// File: src/types/AttendanceDto.ts
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
**Used in:** `SessionOccurrences.tsx`, `Attendance.tsx` (day picker view)

---

### 11.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/SessionOccurrence` | `page`, `pageSize` | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| `GET` | `/api/SessionOccurrence` | `date` (ISO), `page`, `pageSize` | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| `GET` | `/api/SessionOccurrence/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<SessionOccurrenceDto>>` |

---

### 11.3 Commands

```typescript
// ── Generate Session Occurrences ──────────────────────────────────────────────
// Route:    POST /api/SessionOccurrence/generate
// Response: ApiResult<boolean>
// Trigger:  GenerateSessionsModal, OperateGroupModal
interface GenerateSessionsCommand {
  traineeGroupId: number;
  durationInDays: number;
  groupScheduleId?: number | null;   // null = generate for ALL schedules of the group
}
```

---

## 12. Attendance Module

### 12.1 DTOs

```typescript
// ── AttendanceStatus ─────────────────────────────────────────────────────────
type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused";

// ── AttendanceRecordDto — per-trainee record in a session occurrence ──────────
// File: src/types/AttendanceDto.ts
interface AttendanceRecordDto {
  id: number;
  traineeId: number;
  traineeName: string;
  checkInTime: string | null;   // "HH:mm:ss" or null if not checked in
  status: AttendanceStatus;
}
```

**File:** `src/types/AttendanceDto.ts`  
**Used in:** `Attendance.tsx`, `MarkAttendanceModal.tsx`

---

### 12.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/attendance/session/{sessionOccurrenceId}` | — | `ApiResult<AttendanceRecordDto[]>` |
| `GET` | `/api/attendance/rate` | — | `ApiResult<number>` (0–100, overall) |
| `GET` | `/api/attendance/rate` | `month` (1–12) | `ApiResult<number>` (0–100, monthly) |

---

### 12.3 Commands

```typescript
// ── Mark Single Attendance ────────────────────────────────────────────────────
// Route:    POST /api/attendance
// Response: ApiResult<boolean>
// File:     src/types/AttendanceDto.ts
interface MarkAttendanceCommand {
  sessionOccurrenceId: number;
  traineeId: number;
  status: AttendanceStatus;
  checkInTime?: string;     // "HH:mm" — optional override
}

// ── Bulk Mark Attendance ──────────────────────────────────────────────────────
// Route:    POST /api/attendance/bulk
// Request body: MarkAttendanceCommand[]
// Response: ApiResult<boolean>
// Trigger:  MarkAttendanceModal (submits all rows at once)
```

---

## 13. Enrollments Module

### 13.1 DTOs

```typescript
// ── EnrollmentCardDto — list and detail view ─────────────────────────────────
// File: src/types/EnrollmentCardDto.ts
interface EnrollmentCardDto {
  id: number;
  traineeName: string;
  traineeEmail?: string;
  sport: string;
  program?: string;
  branch?: string;
  coachName?: string;
  enrollmentDate?: string;       // ISO date "YYYY-MM-DD"
  startDate?: string;            // ISO date "YYYY-MM-DD"
  endDate?: string;              // ISO date "YYYY-MM-DD"
  monthlyFee?: number;
  paymentStatus?: string;        // "Paid" | "Pending" | "Overdue"
  status: string;                // "Active" | "Suspended" | "Expired" | "Cancelled"
  sessionsCompleted?: number;
  totalSessions?: number;
}
```

**File:** `src/types/EnrollmentCardDto.ts`  
**Used in:** `Enrollments.tsx`, `EnrollmentProfile.tsx`, `TraineeProfile.tsx`

---

### 13.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/Enrollment` | `page`, `pageSize` | `ApiResult<PagedData<EnrollmentCardDto>>` |
| `GET` | `/api/Enrollment/search` | `term`, `page`, `pageSize` | `ApiResult<PagedData<EnrollmentCardDto>>` |
| `GET` | `/api/enrollment/{id}` | — | `ApiResult<EnrollmentCardDto>` |
| `GET` | `/api/Enrollment/count` | — | `ApiResult<number>` |
| `GET` | `/api/Enrollment/count/active` | — | `ApiResult<number>` |
| `GET` | `/api/Enrollment/count/pending-payment` | — | `ApiResult<number>` |
| `GET` | `/api/Enrollment/sports/{sportId}/enrollments/count` | `from` (ISO date) | `ApiResult<number>` |

---

### 13.3 Commands

```typescript
// ── Create Enrollment ─────────────────────────────────────────────────────────
// Route:    POST /api/Enrollment/create
// Response: ApiResult (any — frontend does not read data field)
// Trigger:  EnrollmentFormModal
// Validation: expiryDate must be after enrollmentDate; sessionAllowed >= 1
interface CreateEnrollmentCommand {
  traineeId: number;
  traineeGroupId: number;
  enrollmentDate: string;          // "YYYY-MM-DD"
  expiryDate: string;              // "YYYY-MM-DD"
  sessionAllowed: number;          // >= 1
  subscriptionDetailsId?: number | null;
}

// ── Update Enrollment ─────────────────────────────────────────────────────────
// Route:    PUT /api/enrollment/{id}
// Response: ApiResult<boolean>
// Trigger:  EnrollmentEditModal
interface UpdateEnrollmentCommand {
  expiryDate?: string | null;
  sessionAllowed?: number | null;
  subscriptionDetailsId?: number | null;
}

// ── Update Payment Status ─────────────────────────────────────────────────────
// Route:    PATCH /api/enrollment/{id}/payment-status
// Response: ApiResult<boolean>
// Trigger:  EnrollmentProfile action button, Bulk "Mark as Paid"
interface UpdatePaymentStatusCommand {
  paymentStatus: string;   // "Paid" | "Pending" | "Overdue"
}

// ── Activate Enrollment ───────────────────────────────────────────────────────
// Route:    PATCH /api/enrollment/{id}/activate
// Response: ApiResult<boolean>

// ── Suspend Enrollment ────────────────────────────────────────────────────────
// Route:    PATCH /api/enrollment/{id}/suspend
// Response: ApiResult<boolean>
// Also used by: Bulk "Suspend" action in Enrollments.tsx

// ── Delete Enrollment ─────────────────────────────────────────────────────────
// Route:    DELETE /api/enrollment/{id}
// Response: ApiResult<boolean>
```

---

## 14. Notifications Module

### 14.1 DTOs

```typescript
// ── NotificationDto ───────────────────────────────────────────────────────────
// File: src/services/notifications.service.ts
// Also matches NotificationPayload in src/realtime/realtimeEvents.ts
interface NotificationDto {
  id: string;               // UUID — MUST be string, not integer
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;       // optional relative URL e.g. "/enrollments/42"
  isRead: boolean;
  createdAt: string;        // ISO datetime "YYYY-MM-DDTHH:mm:ssZ"
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

**Used in:** `NotificationsPage.tsx`, `AppLayout.tsx` (bell badge + unread count tab title), `Dashboard.tsx` (activity feed)

---

### 14.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/notifications` | `page`, `pageSize` | `ApiResult<PagedData<NotificationDto>>` |
| `GET` | `/api/notifications/unread-count` | — | `ApiResult<number>` |

---

### 14.3 Commands

```typescript
// ── Mark Single Notification as Read ─────────────────────────────────────────
// Route:    PATCH /api/notifications/{id}/read
// Response: ApiResult<null>

// ── Mark All Notifications as Read ───────────────────────────────────────────
// Route:    PATCH /api/notifications/read-all
// Response: ApiResult<null>
```

---

## 15. Lookup / Reference APIs

Small, flat (unpaginated) endpoints used exclusively to populate form dropdowns.

### 15.1 Families

```typescript
// File: src/services/family.services.ts
// File: src/types/FamilyDto.ts

interface FamilyDto {
  id: number;
  code: number;
}
```

| Method | Route | Query Params | Response | Used By |
|---|---|---|---|---|
| `GET` | `/api/Family/search` | `searchTerm` | `ApiResult<FamilyDto[]>` | `TraineeFormModal` |

---

### 15.2 Nationality Categories

```typescript
// File: src/services/nationalityCategory.services.ts
// File: src/types/NationalityCategoryDto.ts

interface NationalityCategoryDto {
  id: number;
  code: string;
  name: string;
}
```

| Method | Route | Response | Used By |
|---|---|---|---|
| `GET` | `/api/NationalityCategory` | `ApiResult<NationalityCategoryDto[]>` | `TraineeFormModal` |

---

### 15.3 Subscription Details

```typescript
// ⚠️ No dedicated service file — called directly via apiFetch in EnrollmentFormModal
interface SubscriptionDetailsDto {
  id: number;
  name: string;
}
```

| Method | Route | Response | Used By |
|---|---|---|---|
| `GET` | `/api/SubscriptionDetails/get-all` | `ApiResult<SubscriptionDetailsDto[]>` | `EnrollmentFormModal`, `EnrollmentEditModal` |

---

## 16. SignalR Hub Contracts

### Hub Connection

```
Endpoint:  /hubs/notifications
Protocol:  WebSockets (with Long-Polling fallback)
Auth:      JWT Bearer token (passed via ?access_token= query parameter on connect)
Client:    @microsoft/signalr v10
```

**File:** `src/realtime/signalrClient.ts`, `src/realtime/realtimeEvents.ts`

---

### Server → Client Events

All event names are defined as constants in `src/realtime/realtimeEvents.ts`.

```typescript
// ── ReceiveNotification ───────────────────────────────────────────────────────
// Sent when a new notification is created for the current user
// Frontend: adds to list, increments unreadCount, shows toast
interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  isRead: boolean;          // always false for new notifications
  createdAt: string;        // ISO datetime
}

// ── NotificationRead ──────────────────────────────────────────────────────────
// Sent when a notification is marked read (by another tab/device)
// Frontend: marks notification as read in local list, decrements unreadCount
interface NotificationReadPayload {
  id: string;   // notification UUID
}

// ── AllNotificationsRead ──────────────────────────────────────────────────────
// Sent when mark-all-read is called
// Payload: none (empty)
// Frontend: sets all notifications.isRead = true, resets unreadCount to 0

// ── AttendanceUpdated ─────────────────────────────────────────────────────────
// Sent when any attendance record changes
// Payload: none
// Frontend: invalidates React Query cache key ["attendance"]

// ── SessionOccurrenceUpdated ──────────────────────────────────────────────────
// Sent when session occurrences are generated or modified
// Payload: none
// Frontend: invalidates React Query cache key ["sessionOccurrences"]

// ── EnrollmentUpdated ─────────────────────────────────────────────────────────
// Sent when an enrollment is created/updated/cancelled
// Payload: none
// Frontend: invalidates React Query cache key ["enrollments"]

// ── DashboardStatsUpdated ─────────────────────────────────────────────────────
// Sent when any stat that appears on the dashboard changes
// Payload: none
// Frontend: invalidates React Query cache key ["dashboard"]

// ── TraineeGroupUpdated ───────────────────────────────────────────────────────
// Sent when a trainee group is created/updated/deleted
// Payload: none
// Frontend: invalidates React Query cache key ["traineeGroups"]
```

### Event Name Constants

```typescript
export const REALTIME_EVENTS = {
  RECEIVE_NOTIFICATION:        "ReceiveNotification",
  NOTIFICATION_READ:           "NotificationRead",
  ALL_NOTIFICATIONS_READ:      "AllNotificationsRead",
  ATTENDANCE_UPDATED:          "AttendanceUpdated",
  SESSION_OCCURRENCE_UPDATED:  "SessionOccurrenceUpdated",
  ENROLLMENT_UPDATED:          "EnrollmentUpdated",
  DASHBOARD_STATS_UPDATED:     "DashboardStatsUpdated",
  TRAINEE_GROUP_UPDATED:       "TraineeGroupUpdated",
} as const;
```

---

## 17. Dashboard Aggregation Calls

The Dashboard (`src/pages/Dashboard.tsx`) has **no dedicated stats endpoint**. All data is fetched via N individual calls using `Promise.allSettled` for resilience.

| UI Widget | Method | Route | Notes |
|---|---|---|---|
| "Today's Trainees" stat card | `GET` | `/api/Trainee/get-count-for-specific-day?date=YYYY-MM-DD` | `date` = today ISO |
| "Active Coaches" stat card | `GET` | `/api/Employee/coaches/active/count` | |
| "Today's Sessions" stat card + list | `GET` | `/api/TraineeGroup/get-all-for-specific-day?date=YYYY-MM-DD&page=1&pageSize=4` | Shows up to 4 items |
| "Attendance Rate" stat card | `GET` | `/api/attendance/rate` | Overall percentage |
| Monthly attendance trend chart | `GET` | `/api/attendance/rate?month={1-12}` | Called once per month in view window (5 calls) |
| Sport Enrollments bar chart | `GET` | `/api/sports` then per-sport: `/api/Enrollment/sports/{id}/enrollments/count?from=2024-01-01` | N+1 calls — one per sport |
| Activity feed | `GET` | `/api/notifications?page=1&pageSize=10` | Reuses notifications list |

> **🟢 Recommendation:** Implement a `GET /api/dashboard/stats` endpoint that returns all scalar stat-card values in a single response to eliminate the N+1 enrollment chart calls.

---

## 18. Complete Endpoint Summary Table

| Module | Method | Route | Auth | Response Body |
|---|---|---|---|---|
| **Auth** | POST | `/api/auth/login` | ❌ | `ApiResult<string>` |
| **Auth** | POST | `/api/auth/sign-up` | ❌ | `ApiResult<string>` |
| **Auth** | GET | `/api/auth/users` | ✅ | `ApiResult<AppUser[]>` |
| **Auth** | GET | `/api/auth/roles` | ✅ | `ApiResult<string[]>` |
| **Auth** | POST | `/api/auth/users/create` | ✅ | `ApiResult<boolean>` |
| **Auth** | POST | `/api/auth/users/{id}/toggle-active` | ✅ | `ApiResult<boolean>` |
| **Auth** | GET | `/api/user/me` | ✅ | `ApiResult<MyProfileDto>` |
| **Auth** | POST | `/api/auth/change-password` | ✅ | `ApiResult<boolean>` |
| **Trainees** | GET | `/api/trainee` | ✅ | `ApiResult<PagedData<TraineeCardDto>>` |
| **Trainees** | GET | `/api/trainee/search` | ✅ | `ApiResult<PagedData<TraineeCardDto>>` |
| **Trainees** | GET | `/api/trainee/search/{id}` | ✅ | `ApiResult<PagedData<TraineeCardDto>>` |
| **Trainees** | GET | `/api/trainee/{id}` | ✅ | `ApiResult<TraineeDetailsDto>` |
| **Trainees** | GET | `/api/trainee/count` | ✅ | `ApiResult<number>` |
| **Trainees** | GET | `/api/trainee/count-active` | ✅ | `ApiResult<number>` |
| **Trainees** | GET | `/api/Trainee/get-count-for-specific-day` | ✅ | `ApiResult<number>` |
| **Trainees** | GET | `/api/Trainee/get-all` | ✅ | `ApiResult<TraineeDropdownDto[]>` |
| **Trainees** | POST | `/api/Trainee` | ✅ | `ApiResult<number>` |
| **Trainees** | PUT | `/api/Trainee` | ✅ | `ApiResult<UpdateTraineeCommand>` |
| **Trainees** | DELETE | `/api/trainee/{id}` | ✅ | `ApiResult<boolean>` |
| **Coaches** | GET | `/api/employee/coaches` | ✅ | `ApiResult<PagedData<CoachCardDto>>` |
| **Coaches** | GET | `/api/coach/search` | ✅ | `ApiResult<PagedData<CoachCardDto>>` |
| **Coaches** | GET | `/api/coach/{id}` | ✅ | `ApiResult<CoachDetailsDto>` |
| **Coaches** | GET | `/api/coach/count` | ✅ | `ApiResult<number>` |
| **Coaches** | GET | `/api/coach/rating-average` | ✅ | `ApiResult<number>` |
| **Coaches** | GET | `/api/Employee/coaches/active/count` | ✅ | `ApiResult<number>` |
| **Coaches** | GET | `/api/Coach/get-all` | ✅ | `ApiResult<CoachDropdownDto[]>` |
| **Coaches** | POST | `/api/coach` | ✅ | `ApiResult<number>` |
| **Coaches** | PUT | `/api/Coach/{id}` | ✅ | `ApiResult<{isSuccess,message,statusCode}>` |
| **Coaches** | DELETE | `/api/coaches/{id}` | ✅ | `ApiResult<boolean>` |
| **Employees** | GET | `/api/employee` | ✅ | `ApiResult<PagedData<EmployeeCardDto>>` |
| **Employees** | GET | `/api/employee/search` | ✅ | `ApiResult<PagedData<EmployeeCardDto>>` |
| **Employees** | GET | `/api/employee/{id}` | ✅ | `ApiResult<EmployeeCardDto>` |
| **Employees** | GET | `/api/employee/count` | ✅ | `ApiResult<number>` |
| **Employees** | GET | `/api/employee/active/count` | ✅ | `ApiResult<number>` |
| **Employees** | POST | `/api/Employee` | ✅ | `ApiResult<number>` |
| **Employees** | PUT | `/api/Employee/{id}` | ✅ | `ApiResult<{isSuccess,message,statusCode}>` |
| **Employees** | PATCH | `/api/employee/{id}/toggle-status` | ✅ | `ApiResult<boolean>` |
| **Employees** | DELETE | `/api/employee/{id}` | ✅ | `ApiResult<boolean>` |
| **Branches** | GET | `/api/branch` | ✅ | `ApiResult<PagedData<BranchCardDto>>` |
| **Branches** | GET | `/api/branch/search` | ✅ | `ApiResult<PagedData<BranchCardDto>>` |
| **Branches** | GET | `/api/Branch` | ✅ | `ApiResult<BranchDropdownDto[]>` |
| **Branches** | GET | `/api/Branch/get-all` | ✅ | `ApiResult<BranchDropdownDto[]>` |
| **Branches** | GET | `/api/branch/{id}` | ✅ | `ApiResult<BranchCardDto>` |
| **Branches** | GET | `/api/branch/{id}/stats` | ✅ | `ApiResult<BranchStatsDto>` |
| **Branches** | GET | `/api/branch/count` | ✅ | `ApiResult<number>` |
| **Branches** | POST | `/api/Branch/create` | ✅ | `ApiResult<any>` |
| **Branches** | PUT | `/api/Branch/{id}` | ✅ | `ApiResult<any>` |
| **Branches** | PATCH | `/api/branch/{id}/deactivate` | ✅ | `ApiResult<boolean>` |
| **Branches** | DELETE | `/api/branch/{id}` | ✅ | `ApiResult<boolean>` |
| **Sports** | GET | `/api/Sports` | ✅ | `ApiResult<PagedData<SportDto>>` |
| **Sports** | GET | `/api/Sports/search` | ✅ | `ApiResult<PagedData<SportDto>>` |
| **Sports** | GET | `/api/sports/search-name` | ✅ | `ApiResult<SportDropDownListDto[]>` |
| **Sports** | GET | `/api/sports` | ✅ | `ApiResult<{id,name}[]>` |
| **Sports** | GET | `/api/Sports/get-all` | ✅ | `ApiResult<{id,name}[]>` |
| **Sports** | GET | `/api/sport/{id}` | ✅ | `ApiResult<SportDto>` |
| **Sports** | GET | `/api/sports/count` | ✅ | `ApiResult<number>` |
| **Sports** | POST | `/api/Sports/create` | ✅ | `ApiResult<any>` |
| **Sports** | POST | `/api/Sports/{sportId}/skill-level` | ✅ | `ApiResult<any>` |
| **Sports** | PUT | `/api/Sports/{id}` | ✅ | `ApiResult<{isSuccess,message,statusCode}>` |
| **Sports** | DELETE | `/api/sport/{id}` | ✅ | `ApiResult<boolean>` |
| **TraineeGroups** | GET | `/api/TraineeGroup` | ✅ | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| **TraineeGroups** | GET | `/api/TraineeGroup/search` | ✅ | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| **TraineeGroups** | GET | `/api/TraineeGroup/get-all-for-specific-day` | ✅ | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| **TraineeGroups** | GET | `/api/TraineeGroup/{id}` | ✅ | `ApiResult<TraineeGroupDetailDto>` |
| **TraineeGroups** | GET | `/api/TraineeGroup/count` | ✅ | `ApiResult<number>` |
| **TraineeGroups** | GET | `/api/TraineeGroup/get-all-dropdown` | ✅ | `ApiResult<TraineeGroupDropdownDto[]>` |
| **TraineeGroups** | POST | `/api/TraineeGroup/create` | ✅ | `ApiResult<any>` |
| **TraineeGroups** | PUT | `/api/TraineeGroup/{id}` | ✅ | `ApiResult<boolean>` |
| **TraineeGroups** | DELETE | `/api/TraineeGroup/{id}` | ✅ | `ApiResult<boolean>` |
| **SessionOccurrences** | GET | `/api/SessionOccurrence` | ✅ | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| **SessionOccurrences** | GET | `/api/SessionOccurrence` *(+ date param)* | ✅ | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| **SessionOccurrences** | GET | `/api/SessionOccurrence/search` | ✅ | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| **SessionOccurrences** | POST | `/api/SessionOccurrence/generate` | ✅ | `ApiResult<boolean>` |
| **Attendance** | GET | `/api/attendance/session/{id}` | ✅ | `ApiResult<AttendanceRecordDto[]>` |
| **Attendance** | GET | `/api/attendance/rate` | ✅ | `ApiResult<number>` |
| **Attendance** | GET | `/api/attendance/rate` *(+ month param)* | ✅ | `ApiResult<number>` |
| **Attendance** | POST | `/api/attendance` | ✅ | `ApiResult<boolean>` |
| **Attendance** | POST | `/api/attendance/bulk` | ✅ | `ApiResult<boolean>` |
| **Enrollments** | GET | `/api/Enrollment` | ✅ | `ApiResult<PagedData<EnrollmentCardDto>>` |
| **Enrollments** | GET | `/api/Enrollment/search` | ✅ | `ApiResult<PagedData<EnrollmentCardDto>>` |
| **Enrollments** | GET | `/api/enrollment/{id}` | ✅ | `ApiResult<EnrollmentCardDto>` |
| **Enrollments** | GET | `/api/Enrollment/count` | ✅ | `ApiResult<number>` |
| **Enrollments** | GET | `/api/Enrollment/count/active` | ✅ | `ApiResult<number>` |
| **Enrollments** | GET | `/api/Enrollment/count/pending-payment` | ✅ | `ApiResult<number>` |
| **Enrollments** | GET | `/api/Enrollment/sports/{sportId}/enrollments/count` | ✅ | `ApiResult<number>` |
| **Enrollments** | POST | `/api/Enrollment/create` | ✅ | `ApiResult<any>` |
| **Enrollments** | PUT | `/api/enrollment/{id}` | ✅ | `ApiResult<boolean>` |
| **Enrollments** | PATCH | `/api/enrollment/{id}/payment-status` | ✅ | `ApiResult<boolean>` |
| **Enrollments** | PATCH | `/api/enrollment/{id}/activate` | ✅ | `ApiResult<boolean>` |
| **Enrollments** | PATCH | `/api/enrollment/{id}/suspend` | ✅ | `ApiResult<boolean>` |
| **Enrollments** | DELETE | `/api/enrollment/{id}` | ✅ | `ApiResult<boolean>` |
| **Notifications** | GET | `/api/notifications` | ✅ | `ApiResult<PagedData<NotificationDto>>` |
| **Notifications** | GET | `/api/notifications/unread-count` | ✅ | `ApiResult<number>` |
| **Notifications** | PATCH | `/api/notifications/{id}/read` | ✅ | `ApiResult<null>` |
| **Notifications** | PATCH | `/api/notifications/read-all` | ✅ | `ApiResult<null>` |
| **Lookups** | GET | `/api/Family/search` | ✅ | `ApiResult<FamilyDto[]>` |
| **Lookups** | GET | `/api/NationalityCategory` | ✅ | `ApiResult<NationalityCategoryDto[]>` |
| **Lookups** | GET | `/api/SubscriptionDetails/get-all` | ✅ | `ApiResult<SubscriptionDetailsDto[]>` |

**Total: 83 endpoints**

---

## 19. Missing / Unverified Contracts

The following issues were identified during the audit. They require backend team clarification or implementation.

### 🔴 HIGH PRIORITY — Blocking features

| # | Issue | Details | Affected Component |
|---|---|---|---|
| 1 | **`GET /api/Trainee/get-all` — DTO unconfirmed** | Frontend expects `{ id, firstName, lastName }[]` (unpaginated). If backend paginates this or renames fields, the trainee picker in EnrollmentFormModal will break. | `EnrollmentFormModal` |
| 2 | **`GET /api/TraineeGroup/get-all-dropdown` — `name` field undefined** | The `name` field of each item must be a human-readable composite string (e.g. "Basketball – Main Branch – Mon/Wed"). Backend must define what composes this `name`. | `EnrollmentFormModal` |
| 3 | **`GET /api/TraineeGroup/{id}` — `schedules` field not confirmed** | `EnrollmentFormModal` calls this endpoint and reads `res.data.schedules` to derive `weeklyFrequency` for auto-suggesting `sessionAllowed`. If `schedules` is absent, the feature silently degrades. Backend MUST include this array. | `EnrollmentFormModal` |
| 4 | **`GET /api/SubscriptionDetails/get-all` — no service file, DTO unverified** | No dedicated service file exists. Frontend calls `apiFetch` directly from the modal. The endpoint and `{ id, name }` DTO are entirely unverified. | `EnrollmentFormModal`, `EnrollmentEditModal` |
| 5 | **`GET /api/Branch/get-all` vs `GET /api/Branch`** | Two routes appear to serve the same purpose (flat branch list for dropdowns). Frontend calls both from different modals. Backend must ensure both routes exist and return identical shapes: `{ id, name }[]`. | `TraineeGroupFormModal` vs `EmployeeFormModal` |
| 6 | **`GET /api/Coach/get-all` — `branchId` field required** | `TraineeGroupFormModal` reads `branchId` from this response to do client-side filtering of coaches by branch. If `branchId` is missing from the response, all coaches will show regardless of branch. | `TraineeGroupFormModal` |

### 🟡 MEDIUM PRIORITY — Degraded UX

| # | Issue | Details |
|---|---|---|
| 7 | **`GET /api/enrollment/{id}` returns `ApiResult<unknown>`** | Frontend service is typed as `unknown`. Must return `ApiResult<EnrollmentCardDto>` to populate `EnrollmentProfile.tsx`. |
| 8 | **`GET /api/branch/{id}` returns `ApiResult<unknown>`** | Must return `ApiResult<BranchCardDto>` to populate `BranchProfile.tsx`. |
| 9 | **`GET /api/sport/{id}` returns `ApiResult<unknown>`** | Must return `ApiResult<SportDto>` to populate `SportProfile.tsx`. |
| 10 | **Notification `id` type** | Frontend types `NotificationDto.id` as `string` (UUID). Backend must NOT return integer IDs here — all notification IDs must be UUID strings. |
| 11 | **`AttendanceStatus` values** | Backend enum must match exactly: `"Present"`, `"Late"`, `"Absent"`, `"Excused"` (Pascal case). Any deviation will cause silent mismatches in `MarkAttendanceModal`. |
| 12 | **`paymentStatus` string values** | `EnrollmentCardDto.paymentStatus` is untyped `string`. Frontend displays it directly. Recommend defining an enum: `"Paid" \| "Pending" \| "Overdue"`. |
| 13 | **`status` string values in EnrollmentCardDto** | Same as above. Recommend: `"Active" \| "Suspended" \| "Expired" \| "Cancelled"`. |

### 🟢 LOW PRIORITY — Improvements

| # | Issue | Details |
|---|---|---|
| 14 | **REST convention inconsistency on Create routes** | `POST /api/Sports/create`, `POST /api/Branch/create`, `POST /api/TraineeGroup/create` use a `/create` suffix. REST convention uses `POST /api/Sports`. Consider normalising. |
| 15 | **No dashboard aggregate endpoint** | Dashboard makes 8+ parallel calls. A `GET /api/dashboard/stats` endpoint would eliminate N+1 enrollment chart calls and improve initial load time. |
| 16 | **`GET /api/Family/search` — no pagination** | Returns a flat array. No pagination support. Confirm this is intentional (small dataset). |
| 17 | **Sports route casing** | `/api/Sports` (capital S) and `/api/sports` (lowercase) are both used. ASP.NET Core routing is case-insensitive by default, but this should be documented and consistent. |
| 18 | **`UpdateTraineeCommand` uses PUT to `/api/Trainee` (no ID in route)** | The `id` is passed in the request body. Unconventional REST design. Consider migrating to `PUT /api/Trainee/{id}` for consistency with all other update endpoints. |
| 19 | **`hireDate` type on EmployeeCardDto** | Typed as `Date` in the TypeScript interface but arrives as an ISO string from JSON. Frontend should treat it as `string` and parse with `date-fns`. |
