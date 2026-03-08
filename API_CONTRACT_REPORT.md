# AURA Sport Academy — Backend–Frontend API Contract Report
> Full codebase audit — every service file, modal, page, and type verified · 2026-03-08

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
19. [Missing / Unverified Contracts — Prioritised](#19-missing--unverified-contracts)

---

## 1. Universal Response Wrapper

**Every** HTTP response from the backend MUST be wrapped in `ApiResult<T>`.
The `apiFetch` utility in `src/lib/api.ts` deserialises all responses into this envelope.

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

### HTTP Status Conventions

| Status | Frontend behaviour |
|---|---|
| `200 OK` | Parse body as `ApiResult<T>` |
| `204 No Content` | Returns `undefined` as `T` (treated as success) |
| `400 Bad Request` | Throws `ApiError`; reads `errors` / `message` / `title` for inline UI messages |
| `401 Unauthorized` | Triggers global auto-logout via `AuthContext` registered handler |
| `4xx / 5xx` | Throws `ApiError(status, body)` |

### Validation Error Shape (`ApiError.getValidationErrors()`)

The frontend reads validation messages from the error body in this priority order:

1. `body.errors` — ASP.NET ModelState format: `{ field: string[] }`
2. `body.message` — plain string fallback
3. `body.title` — ProblemDetails fallback

---

## 2. Pagination Model

All list endpoints that support paging return:

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

**Page sizes used in UI:** 10 (default tables), 20 (modals/pickers), 50 (bulk views)

---

## 3. Authentication Module

### 3.1 Login
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/login` |
| **Auth Required** | ❌ No |
| **Triggered By** | `Login.tsx` → `AuthContext.login()` |

```typescript
// Request body
interface LoginCommand {
  userNameOrEmail: string;   // frontend always passes the email field here
  password: string;
}

// Response
ApiResult<string>   // data = raw JWT Bearer token string
```

**Token handling:** Frontend decodes the JWT `exp` claim to compute `expiresAt`,
stores both in `localStorage`, sets an in-memory token via `setAccessToken()`,
and schedules auto-logout with `setTimeout`.

---

### 3.2 Register
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/sign-up` |
| **Auth Required** | ❌ No |
| **Triggered By** | `Register.tsx` → `AuthContext.register()` |

```typescript
// Request body
interface RegisterCommand {
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
  emailConfirmed: boolean;   // always sent as true from the frontend
}

// Response
ApiResult<string>   // data = success message
```

---

### 3.3 Get All Users
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/auth/users` |
| **Auth Required** | ✅ Bearer |
| **Used By** | `UsersRoles.tsx` |

```typescript
// Response
ApiResult<AppUser[]>

interface AppUser {
  id: string;           // UUID — must be string, not integer
  userName: string;
  email: string;
  roles: string[];
  isActive: boolean;
}
```

---

### 3.4 Get All Roles
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/auth/roles` |
| **Auth Required** | ✅ Bearer |
| **Used By** | `UsersRoles.tsx` (role assignment dropdown) |

```typescript
ApiResult<string[]>   // e.g. ["Admin", "Manager", "Coach"]
```

---

### 3.5 Toggle User Active Status
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/users/{userId}/toggle-active` |
| **Auth Required** | ✅ Bearer |

```typescript
// No request body
ApiResult<boolean>   // true = now active, false = now inactive
```

---

### 3.6 Create User (Admin)
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/users/create` |
| **Auth Required** | ✅ Bearer |
| **Triggered By** | `UsersRoles.tsx` create user form |

```typescript
interface CreateUserCommand {
  userName: string;
  email: string;
  password: string;
  roles: string[];
  isActive: boolean;
}

ApiResult<boolean>
```

---

### 3.7 Get My Profile
| | |
|---|---|
| **Method** | `GET` |
| **Route** | `/api/user/me` |
| **Auth Required** | ✅ Bearer |
| **Used By** | `MyProfile.tsx` |

```typescript
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

---

### 3.8 Change Password
| | |
|---|---|
| **Method** | `POST` |
| **Route** | `/api/auth/change-password` |
| **Auth Required** | ✅ Bearer |
| **Triggered By** | `MyProfile.tsx` password tab |

```typescript
interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

ApiResult<boolean>
```

---

## 4. Trainees Module

### 4.1 DTOs

```typescript
// ── TraineeSportSkill (embedded in card) ────────────────────────────────────
// File: src/types/TraineeCardDto.ts
interface TraineeSportSkill {
  sportName: string;
  skillLevel: string;
}

// ── TraineeCardDto — list pages ─────────────────────────────────────────────
interface TraineeCardDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  joinDate: string;                  // ISO date "YYYY-MM-DD"
  /** Legacy single-sport — retained for backward compat; prefer sportSkills[] */
  sportName?: string;
  skillLevel?: string;
  /** Preferred multi-sport representation */
  sportSkills?: TraineeSportSkill[];
  branchName: string;
  coachName: string;
  isSubscribed: boolean;
  attendanceRate: number;            // 0–100
  medicalConditions?: string[];
}

// ── TraineeDetailsDto — profile page ────────────────────────────────────────
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
  birthDate?: string;                // "YYYY-MM-DD"
  gender?: string;                   // "Male" | "Female"
  sports?: string[];
  isSubscribed: boolean;
  attendanceRate?: number;           // 0–100
  enrollmentCount?: number;
  joinDate: string;                  // "YYYY-MM-DD"
}

// ── TraineeDropdownDto — picker dropdowns (unpaginated flat list) ────────────
interface TraineeDropdownDto {
  id: number;
  firstName: string;
  lastName: string;
}
```

**Files:** `src/types/TraineeCardDto.ts`, `src/types/TraineeDetailsDto.ts`
**Used By:** `Trainees.tsx`, `TraineeProfile.tsx`, `TraineeFormModal.tsx`,
`TraineeEditModal.tsx`, `EnrollmentFormModal.tsx`

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
| `GET` | `/api/Trainee/get-count-for-specific-day` | `date` ("YYYY-MM-DD") | `ApiResult<number>` |
| `GET` | `/api/Trainee/get-all` | — | `ApiResult<TraineeDropdownDto[]>` |

> ⚠️ `/api/Trainee/get-all` returns an **unpaginated flat list**. The frontend maps it
> as `{ id, firstName, lastName }[]` in `EnrollmentFormModal`. Backend must not paginate this.

---

### 4.3 Commands

```typescript
// ── Create Trainee ───────────────────────────────────────────────────────────
// Route:    POST /api/Trainee
// Response: ApiResult<number>   (new trainee ID)
// Trigger:  TraineeFormModal
// Validation enforced by frontend:
//   firstName/lastName: 2–50 chars; ssn: 5–30 chars; parentNumber: max 20;
//   guardianName: max 100; gender required; branchId required;
//   at least one sport; birthDate required
interface CreateTraineeCommand {
  firstName: string;
  lastName: string;
  ssn: string;
  parentNumber: string | null;
  guardianName: string | null;
  birthDate: string | null;           // "YYYY-MM-DD"
  gender: string;                     // "Male" | "Female"
  branchId: number;
  sportIds: number[];
  familyId: number;                   // 0 = no family
  nationalityCategoryId: number;
}

// ── Update Trainee ───────────────────────────────────────────────────────────
// Route:    PUT /api/Trainee          ← body carries id (non-REST, see §19 #18)
// Response: ApiResult<UpdateTraineeCommand>   (echoes back the updated fields)
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
// Trigger:  TraineeProfile confirm dialog
```

---

## 5. Coaches Module

### 5.1 DTOs

```typescript
// ── CoachCardDto — list pages (extends EmployeeCardDto) ──────────────────────
// File: src/types/CoachCardDto.ts
type CoachCardDto = EmployeeCardDto & {
  totalTrainees: number;
  skillLevel: string;    // "Beginner" | "Intermediate" | "Advanced" | "Professional"
  sportName: string;
};

// ── CoachDetailsDto — profile page ──────────────────────────────────────────
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
  hireDate?: string | null;           // ISO date "YYYY-MM-DD"
  isWork: boolean;
  rating?: number | null;             // 0.0–5.0
}

// ── CoachDropdownDto — unpaginated flat list for pickers ──────────────────────
interface CoachDropdownDto {
  id: number;
  employeeFirstName: string;
  employeeLastName: string;
  branchId: number;    // ⚠️ REQUIRED — frontend filters by this client-side
}
```

**Files:** `src/types/CoachCardDto.ts`, `src/types/CoachDetailDto.ts`
**Used By:** `Coaches.tsx`, `CoachProfile.tsx`, `CoachFormModal.tsx`,
`CoachEditModal.tsx`, `TraineeGroupFormModal.tsx`

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

> ⚠️ `GET /api/Coach/get-all` — `branchId` is **required** on each item.
> `TraineeGroupFormModal` does client-side filtering of coaches by branch using this field.

---

### 5.3 Commands

```typescript
// ── Create Coach (assign existing employee as a coach) ────────────────────────
// Route:    POST /api/coach
// Response: ApiResult<number>   (new coach ID)
// Trigger:  CoachFormModal
// Note: employeeId comes from the employee search (searchEmployees API)
interface CreateCoachCommand {
  employeeId: number;
  sportId: number;
  skillLevel: string;   // "Beginner" | "Intermediate" | "Advanced" | "Professional"
}

// ── Update Coach ─────────────────────────────────────────────────────────────
// Route:    PUT /api/Coach/{id}
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
// Trigger:  CoachEditModal
// Note: both fields are optional — send only the changed ones
interface UpdateCoachCommand {
  sportId?: number;
  skillLevel?: string;
}

// ── Delete Coach ─────────────────────────────────────────────────────────────
// Route:    DELETE /api/coaches/{id}
// Response: ApiResult<boolean>
// Trigger:  CoachProfile confirm dialog
```

---

## 6. Employees Module

### 6.1 DTOs

```typescript
// ── EmployeeCardDto — list + profile pages ───────────────────────────────────
// File: src/types/EmployeeCardDto.ts
// ⚠️ hireDate is typed as Date but arrives as ISO string from JSON —
//    backend must send ISO datetime string "YYYY-MM-DDTHH:mm:ssZ"
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
  hireDate: string;   // ISO datetime — frontend currently typed as Date (mismatch, see §19 #19)
}
```

**File:** `src/types/EmployeeCardDto.ts`
**Used By:** `Employees.tsx`, `EmployeeProfile.tsx`, `CoachFormModal.tsx` (employee search source)

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
// Frontend validation: firstName/lastName 2–50; ssn 5–30; phoneNumber 7–20;
//   secondNumber max 20; email max 255; nationality max 60; street max 150;
//   city max 100; position max 100; salary >= 0
interface CreateEmployeeCommand {
  firstName: string;
  lastName: string;
  ssn: string;
  salary: number;
  gender: string;             // "Male" | "Female"
  birthDate: string | null;   // "YYYY-MM-DD"
  email?: string | null;
  nationality?: string | null;
  street?: string | null;
  city?: string | null;
  phoneNumber: string;
  secondNumber?: string | null;
  position?: string | null;
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
// ── BranchCardDto — list + profile pages ─────────────────────────────────────
// File: src/types/BranchCardDto.ts
interface BranchCardDto {
  id: number;
  name: string;
  city: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  coX?: number;   // longitude
  coY?: number;   // latitude
}

// ── BranchStatsDto — profile stats panel ─────────────────────────────────────
// File: src/services/branch.services.ts
interface BranchStatsDto {
  totalTrainees: number;
  totalCoaches: number;
  activeGroups: number;
  activeSessions: number;
}

// ── BranchDropdownDto — form pickers (both flat-list routes) ─────────────────
interface BranchDropdownDto {
  id: number;
  name: string;
}
```

**Files:** `src/types/BranchCardDto.ts`, `src/services/branch.services.ts`
**Used By:** `Branches.tsx`, `BranchProfile.tsx`, `BranchFormModal.tsx`,
`BranchEditModal.tsx`, `EmployeeFormModal.tsx`, `EmployeeEditModal.tsx`,
`TraineeFormModal.tsx`, `TraineeEditModal.tsx`, `TraineeGroupFormModal.tsx`

---

### 7.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/branch` | `page`, `pageSize` | `ApiResult<PagedData<BranchCardDto>>` |
| `GET` | `/api/branch/search` | `term`, `page`, `pageSize` | `ApiResult<PagedData<BranchCardDto>>` |
| `GET` | `/api/branch/{id}` | — | `ApiResult<BranchCardDto>` |
| `GET` | `/api/branch/{id}/stats` | — | `ApiResult<BranchStatsDto>` |
| `GET` | `/api/branch/count` | — | `ApiResult<number>` |
| `GET` | `/api/Branch` | — | `ApiResult<BranchDropdownDto[]>` |
| `GET` | `/api/Branch/get-all` | — | `ApiResult<BranchDropdownDto[]>` |

> ⚠️ **Two flat-list routes** (`/api/Branch` and `/api/Branch/get-all`) are called from
> different forms (`EmployeeFormModal`/`EmployeeEditModal` use `/api/Branch`;
> `TraineeGroupFormModal` uses `/api/Branch/get-all`). Both must return the same
> `{ id, name }[]` shape and list all active branches.

---

### 7.3 Commands

```typescript
// ── Create Branch ────────────────────────────────────────────────────────────
// Route:    POST /api/Branch/create
// Response: ApiResult (data field not inspected by frontend)
// Trigger:  BranchFormModal
// Validation: name/city/country required (max 100); phoneNumber max 30;
//   email optional valid email; coX/coY optional numbers
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
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
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
// ── SportDto — list + profile pages ─────────────────────────────────────────
// File: src/types/SportDto.ts
type SportCategory = "Individual" | "Team";

interface SportDto {
  id: number;
  name: string;
  description?: string;
  category: SportCategory;
  isRequireHealthTest: boolean;
}

// ── SportDropDownListDto — lightweight search result ─────────────────────────
// File: src/types/SportDropDownListDto.ts
interface SportDropDownListDto {
  id: number;
  name: string;
}
```

**Files:** `src/types/SportDto.ts`, `src/types/SportDropDownListDto.ts`
**Used By:** `Sports.tsx`, `SportProfile.tsx`, `SportsFormModal.tsx`,
`SportEditModal.tsx`, `AddSkillLevelModal.tsx`, `CoachFormModal.tsx`,
`CoachEditModal.tsx`, `TraineeFormModal.tsx`, `TraineeEditModal.tsx`, `Dashboard.tsx`

---

### 8.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/Sports` | `page`, `pageSize` | `ApiResult<PagedData<SportDto>>` |
| `GET` | `/api/Sports/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<SportDto>>` |
| `GET` | `/api/sports/search-name` | `searchTerm` | `ApiResult<SportDropDownListDto[]>` |
| `GET` | `/api/sports` | — | `ApiResult<{ id: number; name: string }[]>` |
| `GET` | `/api/Sports/get-all` | — | `ApiResult<{ id: number; name: string }[]>` |
| `GET` | `/api/sport/{id}` | — | `ApiResult<SportDto>` |
| `GET` | `/api/sports/count` | — | `ApiResult<number>` |

> ⚠️ `/api/sports` (Dashboard + `TraineeFormModal`) vs `/api/Sports/get-all`
> (`CoachEditModal`) serve the same purpose. Backend routing must be case-insensitive.

---

### 8.3 Commands

```typescript
// ── Create Sport ─────────────────────────────────────────────────────────────
// Route:    POST /api/Sports/create
// Response: ApiResult (data not inspected)
// Trigger:  SportsFormModal
// Validation: name 2–80 chars; description max 500; category required
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

// ── Add Skill Level ───────────────────────────────────────────────────────────
// Route:    POST /api/Sports/{sportId}/skill-level
// Response: ApiResult<{ isSuccess: boolean; message?: string; statusCode: number }>
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
// ── ListTraineeGroupDto — list pages ─────────────────────────────────────────
// File: src/types/listTraineeGroup.ts
interface ListTraineeGroupDto {
  id: number;
  sportName: string;
  coachName: string;
  branchName: string;
  durationInMinutes: number;
  traineesCount: number;
  startTime: string;         // "HH:mm:ss"
}

// ── TraineeGroupDetailDto — profile page + EnrollmentFormModal ───────────────
// File: src/services/traineeGroup.services.ts
// ⚠️ CRITICAL: schedules[] is READ by EnrollmentFormModal to auto-suggest
//    sessionsAllowed. Without this field the feature silently degrades to manual entry.
interface TraineeGroupDetailDto {
  id: number;
  skillLevel: string;
  gender: string;            // "Male" | "Female" | "Mixed"
  maximumCapacity: number;
  durationInMinutes: number;
  sportName: string;
  coachName: string;
  branchName: string;
  startTime: string;         // "HH:mm:ss"
  traineesCount: number;
  schedules?: GroupScheduleDto[];   // ⚠️ REQUIRED for EnrollmentFormModal suggestion
}

// ── GroupScheduleDto — embedded in TraineeGroupDetailDto ─────────────────────
// Also consumed by GenerateSessionsModal to show per-day-of-week selector
interface GroupScheduleDto {
  id: number;
  dayOfWeek: string;   // "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
  startTime: string;   // "HH:mm:ss"
  endTime: string;     // "HH:mm:ss"
}

// ── TraineeGroupDropdownDto — EnrollmentFormModal picker ──────────────────────
// Returned by GET /api/TraineeGroup/get-all-dropdown
// ⚠️ CRITICAL: The `name` field must be a human-readable composite string,
//    e.g. "Basketball – Main Branch – Mon/Wed 16:30"
interface TraineeGroupDropdownDto {
  id: number;
  name: string;
}
```

**Files:** `src/types/listTraineeGroup.ts`, `src/services/traineeGroup.services.ts`
**Used By:** `TraineeGroups.tsx`, `TraineeGroupProfile.tsx`, `Sessions.tsx`,
`OperateGroupModal.tsx`, `GenerateSessionsModal.tsx`, `EnrollmentFormModal.tsx`

---

### 9.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/TraineeGroup` | `page`, `pageSize` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/get-all-for-specific-day` | `date` ("YYYY-MM-DD"), `page`, `pageSize` | `ApiResult<PagedData<ListTraineeGroupDto>>` |
| `GET` | `/api/TraineeGroup/{id}` | — | `ApiResult<TraineeGroupDetailDto>` |
| `GET` | `/api/TraineeGroup/count` | — | `ApiResult<number>` |
| `GET` | `/api/TraineeGroup/get-all-dropdown` | — | `ApiResult<TraineeGroupDropdownDto[]>` |

---

### 9.3 Commands

```typescript
// ── Create Trainee Group ──────────────────────────────────────────────────────
// Route:    POST /api/TraineeGroup/create
// Response: ApiResult (data not inspected)
// Trigger:  TraineeGroupFormModal
// Validation: durationInMinutes >= 15; maximumCapacity >= 1
interface CreateTraineeGroupCommand {
  skillLevel: string;         // "Beginner" | "Intermediate" | "Advanced"
  maximumCapacity: number;
  durationInMinutes: number;  // >= 15
  gender: string;             // "Male" | "Female" | "Mixed"
  branchId: number;
  coachId: number;
}

// ── Update Trainee Group ──────────────────────────────────────────────────────
// Route:    PUT /api/TraineeGroup/{id}
// Response: ApiResult<boolean>
// Trigger:  TraineeGroupFormModal (edit mode via TraineeGroupProfile)
// All fields optional — send only what changed
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
// Trigger:  TraineeGroupProfile confirm dialog
```

---

## 10. Sessions Module

> **Architecture note:** The Sessions page (`Sessions.tsx`) reuses TraineeGroup
> endpoints — there is no separate `/api/session` resource.
> `SessionCardDto ≈ ListTraineeGroupDto + date field`.

### 10.1 DTO

```typescript
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

### 10.2 Queries (all served by `/api/TraineeGroup/*`)

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/TraineeGroup` | `page`, `pageSize` | `ApiResult<PagedData<SessionCardDto>>` |
| `GET` | `/api/TraineeGroup/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<SessionCardDto>>` |
| `GET` | `/api/TraineeGroup/get-all-for-specific-day` | `date`, `page`, `pageSize` | `ApiResult<PagedData<SessionCardDto>>` |
| `GET` | `/api/TraineeGroup/count` | — | `ApiResult<number>` |

---

## 11. Session Occurrences Module

### 11.1 DTO

```typescript
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

**Used By:** `SessionOccurrences.tsx`, `Attendance.tsx` (day-picker view)

---

### 11.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/SessionOccurrence` | `page`, `pageSize` | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| `GET` | `/api/SessionOccurrence` | `date` ("YYYY-MM-DD"), `page`, `pageSize` | `ApiResult<PagedData<SessionOccurrenceDto>>` |
| `GET` | `/api/SessionOccurrence/search` | `searchTerm`, `page`, `pageSize` | `ApiResult<PagedData<SessionOccurrenceDto>>` |

> Both the base and date-filtered variants hit the same route `/api/SessionOccurrence`.
> When `date` param is present the backend filters; when absent it returns all.

---

### 11.3 Commands

```typescript
// ── Generate Session Occurrences ──────────────────────────────────────────────
// Route:    POST /api/SessionOccurrence/generate
// Response: ApiResult<boolean>
// Trigger:  GenerateSessionsModal (from TraineeGroupProfile),
//           OperateGroupModal (from Dashboard + TraineeGroupProfile)
//
// ⚠️ groupScheduleId is optional — when null, generate for ALL schedules
//    When TraineeGroupDetailDto.schedules[] is present, GenerateSessionsModal
//    renders a per-schedule selector so the user can target a single day-of-week.
interface GenerateSessionsCommand {
  traineeGroupId: number;
  durationInDays: number;             // >= 1, default 30 in UI
  groupScheduleId?: number | null;    // null = all schedules
}
```

---

## 12. Attendance Module

### 12.1 DTOs

```typescript
// File: src/types/AttendanceDto.ts
type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused";   // exact Pascal-case

interface AttendanceRecordDto {
  id: number;
  traineeId: number;
  traineeName: string;
  checkInTime: string | null;   // "HH:mm:ss" or null
  status: AttendanceStatus;
}

interface MarkAttendanceCommand {
  sessionOccurrenceId: number;
  traineeId: number;
  status: AttendanceStatus;
  checkInTime?: string;         // "HH:mm" optional override
}
```

**Used By:** `Attendance.tsx`, `MarkAttendanceModal.tsx`

---

### 12.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/attendance/session/{sessionOccurrenceId}` | — | `ApiResult<AttendanceRecordDto[]>` |
| `GET` | `/api/attendance/rate` | — | `ApiResult<number>` (0–100, overall) |
| `GET` | `/api/attendance/rate` | `month` (1–12) | `ApiResult<number>` (0–100, for month) |

---

### 12.3 Commands

```typescript
// ── Mark Single Attendance ────────────────────────────────────────────────────
// Route:    POST /api/attendance
// Response: ApiResult<boolean>

// ── Bulk Mark Attendance ──────────────────────────────────────────────────────
// Route:    POST /api/attendance/bulk
// Request:  MarkAttendanceCommand[]    (array of the same DTO above)
// Response: ApiResult<boolean>
// Trigger:  MarkAttendanceModal — submits all roster rows in one request
//           (uses bulkMarkAttendance() from attendance.services.ts)
```

---

## 13. Enrollments Module

### 13.1 DTOs

```typescript
// ── EnrollmentCardDto — list pages ───────────────────────────────────────────
// File: src/types/EnrollmentCardDto.ts
interface EnrollmentCardDto {
  id: number;
  traineeName: string;
  traineeEmail?: string;
  sport: string;
  program?: string;
  branch?: string;
  coachName?: string;
  enrollmentDate?: string;     // "YYYY-MM-DD"
  startDate?: string;          // "YYYY-MM-DD"
  endDate?: string;            // "YYYY-MM-DD"
  monthlyFee?: number;
  paymentStatus?: string;      // "Paid" | "Pending" | "Overdue"
  status: string;              // "Active" | "Suspended" | "Expired" | "Cancelled"
  sessionsCompleted?: number;
  totalSessions?: number;
}

// ── EnrollmentDetailDto — profile page ───────────────────────────────────────
// Defined locally in EnrollmentProfile.tsx (richer superset of EnrollmentCardDto)
// ⚠️ GET /api/enrollment/{id} must return ALL these fields
interface EnrollmentDetailDto {
  id: number;
  traineeName?: string;
  traineeEmail?: string;
  sport?: string;
  program?: string;
  branch?: string;
  coach?: string;               // coach name (note: field is 'coach', not 'coachName')
  enrollmentDate?: string;      // "YYYY-MM-DD"
  startDate?: string;           // "YYYY-MM-DD"
  endDate?: string;             // "YYYY-MM-DD"
  expiryDate?: string;          // "YYYY-MM-DD" (may differ from endDate)
  monthlyFee?: number;
  paymentStatus?: string;       // "Paid" | "Pending" | "Overdue"
  status?: string;              // "Active" | "Suspended" | "Expired" | "Cancelled"
  sessionsCompleted?: number;
  totalSessions?: number;
  sessionAllowed?: number;      // total sessions allowed (for EnrollmentEditModal)
  subscriptionDetailsId?: number;
}
```

**File:** `src/types/EnrollmentCardDto.ts`
**Used By:** `Enrollments.tsx`, `EnrollmentProfile.tsx`, `EnrollmentEditModal.tsx`,
`TraineeProfile.tsx`

---

### 13.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/Enrollment` | `page`, `pageSize` | `ApiResult<PagedData<EnrollmentCardDto>>` |
| `GET` | `/api/Enrollment/search` | `term`, `page`, `pageSize` | `ApiResult<PagedData<EnrollmentCardDto>>` |
| `GET` | `/api/enrollment/{id}` | — | `ApiResult<EnrollmentDetailDto>` |
| `GET` | `/api/Enrollment/count` | — | `ApiResult<number>` |
| `GET` | `/api/Enrollment/count/active` | — | `ApiResult<number>` |
| `GET` | `/api/Enrollment/count/pending-payment` | — | `ApiResult<number>` |
| `GET` | `/api/Enrollment/sports/{sportId}/enrollments/count` | `from` (ISO date) | `ApiResult<number>` |

---

### 13.3 Commands

```typescript
// ── Create Enrollment ─────────────────────────────────────────────────────────
// Route:    POST /api/Enrollment/create
// Response: ApiResult (data not inspected)
// Trigger:  EnrollmentFormModal
// Validation: expiryDate > enrollmentDate; sessionAllowed >= 1
interface CreateEnrollmentCommand {
  traineeId: number;
  traineeGroupId: number;
  enrollmentDate: string;        // "YYYY-MM-DD"
  expiryDate: string;            // "YYYY-MM-DD"
  sessionAllowed: number;        // >= 1; auto-suggested by UI from group schedules
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
// Trigger:  EnrollmentProfile dropdown ("Mark as Paid/Pending/Overdue"),
//           Enrollments.tsx bulk action "Mark as Paid"
interface UpdatePaymentStatusCommand {
  paymentStatus: string;   // "Paid" | "Pending" | "Overdue"
}

// ── Activate Enrollment ───────────────────────────────────────────────────────
// Route:    PATCH /api/enrollment/{id}/activate
// Response: ApiResult<boolean>
// Trigger:  EnrollmentProfile "Activate Enrollment" toggle action

// ── Suspend Enrollment ────────────────────────────────────────────────────────
// Route:    PATCH /api/enrollment/{id}/suspend
// Response: ApiResult<boolean>
// Trigger:  EnrollmentProfile "Suspend Enrollment" toggle action,
//           Enrollments.tsx bulk action "Bulk Suspend"

// ── Delete Enrollment ─────────────────────────────────────────────────────────
// Route:    DELETE /api/enrollment/{id}
// Response: ApiResult<boolean>
// Trigger:  EnrollmentProfile confirm dialog
```

---

## 14. Notifications Module

### 14.1 DTOs

```typescript
// File: src/services/notifications.service.ts
// Matches NotificationPayload in src/realtime/realtimeEvents.ts
interface NotificationDto {
  id: string;               // ⚠️ UUID string — NOT integer
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;       // relative URL e.g. "/enrollments/42"
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
  | "system"
  | "trainee";   // also used in dev-mock data
```

**Used By:** `NotificationsPage.tsx`, `AppLayout.tsx` (bell badge + unread count in tab title),
`Dashboard.tsx` (Activity Feed — latest 10 notifications)

---

### 14.2 Queries

| Method | Route | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/notifications` | `page`, `pageSize` | `ApiResult<PagedData<NotificationDto>>` |
| `GET` | `/api/notifications/unread-count` | — | `ApiResult<number>` |

---

### 14.3 Commands

```typescript
// ── Mark Single Read ─────────────────────────────────────────────────────────
// Route:    PATCH /api/notifications/{id}/read
// Response: ApiResult<null>

// ── Mark All Read ────────────────────────────────────────────────────────────
// Route:    PATCH /api/notifications/read-all
// Response: ApiResult<null>
```

---

## 15. Lookup / Reference APIs

Small, flat, **unpaginated** endpoints used exclusively to populate form dropdowns.

### 15.1 Families

```typescript
// File: src/services/family.services.ts | src/types/FamilyDto.ts
interface FamilyDto {
  id: number;
  code: number;
}
```

| Method | Route | Query Params | Response | Used By |
|---|---|---|---|---|
| `GET` | `/api/Family/search` | `searchTerm` (must be numeric digits) | `ApiResult<FamilyDto[]>` | `TraineeFormModal` SearchableSelect |

> Frontend passes a numeric string (family code). Returns `[]` for non-numeric or empty queries.
> The option "Without family (new)" maps to `familyId = 0`.

---

### 15.2 Nationality Categories

```typescript
// File: src/services/nationalityCategory.services.ts | src/types/NationalityCategoryDto.ts
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
// ⚠️ No dedicated service file — called directly via apiFetch in modals.
// Must be extracted to a service file (see §19 #20).
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

### Connection

```
Endpoint:   /hubs/notifications
Protocol:   WebSockets (Long-Polling fallback)
Auth:       JWT Bearer token via ?access_token= query param on connect
Client lib: @microsoft/signalr v10
```

**Files:** `src/realtime/signalrClient.ts`, `src/realtime/connectionManager.ts`,
`src/realtime/useSignalRConnection.ts`, `src/realtime/realtimeEvents.ts`

---

### Server → Client Events

```typescript
// ── ReceiveNotification ───────────────────────────────────────────────────────
// Event: "ReceiveNotification"
// Sent: when a new notification is created for the current user
// Frontend: append to list, increment unreadCount, show sonner toast
interface NotificationPayload {
  id: string;           // UUID
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  isRead: boolean;      // always false for new
  createdAt: string;    // ISO datetime
}

// ── NotificationRead ──────────────────────────────────────────────────────────
// Event: "NotificationRead"
// Sent: when a single notification is read (supports multi-tab sync)
// Frontend: mark notification isRead=true, decrement unreadCount
interface NotificationReadPayload {
  id: string;
}

// ── AllNotificationsRead ──────────────────────────────────────────────────────
// Event: "AllNotificationsRead"
// Payload: none (empty push)
// Frontend: set all isRead=true, reset unreadCount=0

// ── AttendanceUpdated ─────────────────────────────────────────────────────────
// Event: "AttendanceUpdated"
// Payload: none
// Frontend: invalidate React Query cache key ["attendance"]

// ── SessionOccurrenceUpdated ──────────────────────────────────────────────────
// Event: "SessionOccurrenceUpdated"
// Payload: none
// Frontend: invalidate ["sessionOccurrences"]

// ── EnrollmentUpdated ─────────────────────────────────────────────────────────
// Event: "EnrollmentUpdated"
// Payload: none
// Frontend: invalidate ["enrollments"]

// ── DashboardStatsUpdated ─────────────────────────────────────────────────────
// Event: "DashboardStatsUpdated"
// Payload: none
// Frontend: invalidate ["dashboard"]

// ── TraineeGroupUpdated ───────────────────────────────────────────────────────
// Event: "TraineeGroupUpdated"
// Payload: none
// Frontend: invalidate ["traineeGroups"]
```

### Event Name Constants

```typescript
// src/realtime/realtimeEvents.ts
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

`Dashboard.tsx` has **no dedicated stats endpoint**. All widgets fetch data
individually via `Promise.allSettled` for fault isolation.

| UI Widget | Method | Route | Notes |
|---|---|---|---|
| "Today's Trainees" stat card | `GET` | `/api/Trainee/get-count-for-specific-day?date=YYYY-MM-DD` | date = today |
| "Active Coaches" stat card | `GET` | `/api/Employee/coaches/active/count` | |
| "Today's Sessions" stat + mini-list | `GET` | `/api/TraineeGroup/get-all-for-specific-day?date=YYYY-MM-DD&page=1&pageSize=4` | Shows up to 4 |
| "Attendance Rate" stat card | `GET` | `/api/attendance/rate` | Overall % |
| Monthly Attendance chart | `GET` | `/api/attendance/rate?month={1–12}` | Called 5× per window (one per month) |
| Sport Enrollments chart | `GET` | `/api/sports` then per-sport: `/api/Enrollment/sports/{id}/enrollments/count?from=2024-01-01` | N+1 calls |
| Activity Feed | `GET` | `/api/notifications?page=1&pageSize=10` | Reuses notifications endpoint |

> 🟢 **Recommendation:** Implement `GET /api/dashboard/stats` to eliminate N+1 enrollment
> chart calls and reduce initial load from ~10 requests to ~3.

---

## 18. Complete Endpoint Summary Table

| Module | Method | Route | Auth | Response |
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
| **Coaches** | PUT | `/api/Coach/{id}` | ✅ | `ApiResult<{isSuccess,message?,statusCode}>` |
| **Coaches** | DELETE | `/api/coaches/{id}` | ✅ | `ApiResult<boolean>` |
| **Employees** | GET | `/api/employee` | ✅ | `ApiResult<PagedData<EmployeeCardDto>>` |
| **Employees** | GET | `/api/employee/search` | ✅ | `ApiResult<PagedData<EmployeeCardDto>>` |
| **Employees** | GET | `/api/employee/{id}` | ✅ | `ApiResult<EmployeeCardDto>` |
| **Employees** | GET | `/api/employee/count` | ✅ | `ApiResult<number>` |
| **Employees** | GET | `/api/employee/active/count` | ✅ | `ApiResult<number>` |
| **Employees** | POST | `/api/Employee` | ✅ | `ApiResult<number>` |
| **Employees** | PUT | `/api/Employee/{id}` | ✅ | `ApiResult<{isSuccess,message?,statusCode}>` |
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
| **Branches** | PUT | `/api/Branch/{id}` | ✅ | `ApiResult<{isSuccess,message?,statusCode}>` |
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
| **Sports** | POST | `/api/Sports/{sportId}/skill-level` | ✅ | `ApiResult<{isSuccess,message?,statusCode}>` |
| **Sports** | PUT | `/api/Sports/{id}` | ✅ | `ApiResult<{isSuccess,message?,statusCode}>` |
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
| **Enrollments** | GET | `/api/enrollment/{id}` | ✅ | `ApiResult<EnrollmentDetailDto>` |
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

**Total verified endpoints: 87**

---

## 19. Missing / Unverified Contracts — Prioritised

### 🔴 HIGH — Blocking Features

| # | Issue | Affected | Required Action |
|---|---|---|---|
| 1 | **`GET /api/Trainee/get-all` DTO** | `EnrollmentFormModal` | Must return `{ id, firstName, lastName }[]` flat, unpaginated. Any renaming or pagination breaks the trainee picker. |
| 2 | **`GET /api/TraineeGroup/get-all-dropdown` — `name` field** | `EnrollmentFormModal` | `name` must be a human-readable composite, e.g. `"Basketball – Main Branch – Mon/Wed 16:30"`. Backend must define this composition rule. |
| 3 | **`GET /api/TraineeGroup/{id}` — `schedules[]` missing** | `EnrollmentFormModal`, `GenerateSessionsModal` | `EnrollmentFormModal` reads `res.data.schedules` to derive `weeklyFrequency` for auto-suggesting `sessionAllowed`. `GenerateSessionsModal` reads `schedules` to render per-schedule selector. Without this array, both features silently degrade. **Must be included in `TraineeGroupDetailDto`**. |
| 4 | **`GET /api/SubscriptionDetails/get-all` — entirely unverified** | `EnrollmentFormModal`, `EnrollmentEditModal` | No service file. Frontend calls `apiFetch` directly. Endpoint existence, auth requirement, and `{ id, name }[]` DTO are all unconfirmed. |
| 5 | **`GET /api/Branch` vs `GET /api/Branch/get-all`** | `EmployeeFormModal`, `EmployeeEditModal`, `TraineeGroupFormModal` | Two routes for the same flat list. Both must exist, return `{ id, name }[]`, and list all active branches. |
| 6 | **`GET /api/Coach/get-all` — `branchId` field required** | `TraineeGroupFormModal` | Frontend filters coaches by `branchId` client-side. If this field is absent, all coaches render regardless of branch, breaking the branch-scoped picker. |

---

### 🟡 MEDIUM — Degraded UX / Type Unsafety

| # | Issue | Details |
|---|---|---|
| 7 | **`GET /api/enrollment/{id}` typed as `ApiResult<unknown>`** | Must return `ApiResult<EnrollmentDetailDto>` (see §13.1). Profile page casts to `EnrollmentDetailDto` — mismatch will cause silent missing fields. |
| 8 | **`GET /api/branch/{id}` typed as `ApiResult<unknown>`** | Must return `ApiResult<BranchCardDto>` (§7.1). |
| 9 | **`GET /api/sport/{id}` typed as `ApiResult<unknown>`** | Must return `ApiResult<SportDto>` (§8.1). |
| 10 | **`EnrollmentDetailDto.coach` field name** | Profile page reads `enrollment.coach` (not `coachName`). Backend must use key `coach` on the detail DTO, while the list DTO uses `coachName`. This inconsistency must be documented or unified. |
| 11 | **`NotificationDto.id` must be UUID string** | Frontend types `id` as `string`. Backend must not return integer IDs — must be UUID strings. |
| 12 | **`AttendanceStatus` values must be exact Pascal-case** | Frontend string-compares: `"Present"`, `"Late"`, `"Absent"`, `"Excused"`. Any case deviation causes wrong badge colours and silent save errors. |
| 13 | **`paymentStatus` and `status` untyped strings** | Both are `string` in `EnrollmentCardDto`. Recommend formal enum contract: `paymentStatus: "Paid" \| "Pending" \| "Overdue"` and `status: "Active" \| "Suspended" \| "Expired" \| "Cancelled"`. |

---

### 🟢 LOW — Design / Convention Issues

| # | Issue | Details |
|---|---|---|
| 14 | **Create routes use `/create` suffix** | `POST /api/Sports/create`, `POST /api/Branch/create`, `POST /api/TraineeGroup/create`. REST convention is `POST /api/Sports`. Recommend normalising. |
| 15 | **No dashboard aggregate endpoint** | Dashboard makes 8+ individual requests per page load. `GET /api/dashboard/stats` would reduce to ~3. |
| 16 | **`GET /api/Family/search` — unpaginated** | Returns a flat array. Intentional for small datasets (family codes), but backend should document the max result limit. |
| 17 | **Route casing inconsistency** | `/api/Sports` (capital S) vs `/api/sports` (lowercase) both used. ASP.NET is case-insensitive by default but should be explicitly documented. Same for `/api/Enrollment` vs `/api/enrollment`. |
| 18 | **`PUT /api/Trainee` carries `id` in body** | Non-standard REST — id in body instead of URL. All other update endpoints use `PUT /api/{resource}/{id}`. Recommend migrating to `PUT /api/Trainee/{id}`. |
| 19 | **`EmployeeCardDto.hireDate` typed as `Date`** | Arrives as ISO string from JSON. TypeScript interface declares it as `Date` — causes runtime issues. Backend sends string; frontend should update type to `string`. |
| 20 | **`SubscriptionDetails` has no service file** | Called via raw `apiFetch` in two modals. Should be extracted to `src/services/subscriptionDetails.service.ts` with proper dev-mock support. |
