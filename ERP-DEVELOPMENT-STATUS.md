# ERP Development Status

Last updated: Audit complete — awaiting implementation approval.

---

## Legend
- ✅ Complete and verified
- 🔶 Partial / has gaps
- ❌ Missing / broken
- 🔒 Security issue
- 🚧 In progress

---

## PHASE 1 — Security & Stability

| # | Issue | Severity | Status | Files |
|---|---|---|---|---|
| S1 | Student dashboard hoisting bug — `iso(from)` used before `const from` | CRITICAL | ❌ | `student-dashboard.component.ts:87` |
| S2 | No Docker volume for `private-uploads` — files lost on restart | HIGH | ❌ | `docker-compose.yml` |
| S3 | `.env` committed to repo — JWT secret and DB password exposed | CRITICAL | 🔒 | `.env`, `.gitignore` |
| S4 | `backups/schoolerp-2026-11-19.sql` committed — full DB dump in repo | CRITICAL | 🔒 | `backups/` |
| S5 | `schoolerp-backup.dump` committed to repo root | CRITICAL | 🔒 | `schoolerp-backup.dump` |
| S6 | `backend/.publish-test/` committed — compiled binaries + appsettings | HIGH | 🔒 | `backend/.publish-test/` |
| S7 | Staff creation form has no salary field — all employees get BasicSalary=0 | HIGH | ❌ | `staff-list.component.ts`, `EmployeesController.cs` |
| S8 | No refresh token endpoint — users silently logged out after 60 min | MEDIUM | ❌ | `AuthController.cs` |
| S9 | `leave.component.ts` calls `this.ngOnInit()` in success callback | LOW | ❌ | `leave.component.ts` |
| S10 | Regression tests for security fixes | — | ❌ | `tests/` |

---

## MODULE STATUS

### 1. Admin Dashboard (`/dashboard`)
- **Backend**: ✅ `GET /api/schools/{id}/dashboard` — stats + 7-day trend
- **Frontend**: ✅ Wired to 3 APIs, renders stats and chart
- **UI/UX**: 🔶 No loading skeleton
- **Permissions**: ✅ OfficeDashboard roles only
- **Gaps**: ops-today widget returns 403 for Teacher role (requires Substitutions role)
- **Tests**: ❌

### 2. Teacher Dashboard (`/teacher/dashboard`)
- **Backend**: 🔶 No dedicated endpoint — reuses assignments + homework + diary
- **Frontend**: 🔶 No today's timetable widget, no quick attendance shortcut
- **UI/UX**: 🔶
- **Tests**: ❌

### 3. Student Dashboard (`/student/dashboard`)
- **Backend**: ✅ Uses /students/me, /fees, /attendance, /homework
- **Frontend**: ❌ CRITICAL BUG — ReferenceError on load (hoisting)
- **UI/UX**: 🔶
- **Tests**: ❌

### 4. Parent Dashboard (`/parent/dashboard`)
- **Backend**: ✅ `GET /api/parents/children` exists in ParentsController.cs
- **Frontend**: ✅ Calls correct endpoint, child switcher works
- **UI/UX**: 🔶 Homework not filtered to child's section
- **Tests**: ❌

### 5. Calendar (`/calendar`)
- **Backend**: ❌ No CalendarEvent entity, no migration, no controller
- **Frontend**: ❌ Complete placeholder — year grid only
- **UI/UX**: ❌
- **Tests**: ❌

### 6. Enquiry Desk (`/enquiries`)
- **Backend**: ✅ Full CRUD + OTP flow + SignalR
- **Frontend**: ✅ Real-time updates, full workflow
- **UI/UX**: 🔶 List capped at 200, no pagination
- **Tests**: ❌

### 7. Admissions (`/admissions`)
- **Backend**: ❌ No dedicated controller
- **Frontend**: ❌ Navigation hub only, duplicates student list
- **UI/UX**: ❌
- **Tests**: ❌

### 8. Registrations (`/registrations`)
- **Backend**: ✅ Full workflow including document upload + CSV import
- **Frontend**: ✅ 3 tabs, camera, document upload, CSV import, admission form print
- **UI/UX**: ✅
- **Deployment risk**: ❌ No Docker volume for private-uploads
- **Tests**: ❌

### 9. Student Management (`/students`)
- **Backend**: 🔶 No PUT edit endpoint
- **Frontend**: 🔶 No edit form. Base64 photos in DB
- **UI/UX**: 🔶
- **Gaps**: Cannot edit student after creation
- **Tests**: ❌

### 10. Staff & HR (`/staff`)
- **Backend**: 🔶 No PUT edit, no salary endpoint
- **Frontend**: 🔶 Uses raw HttpClient in load(). No salary field in create form
- **UI/UX**: 🔶
- **Gaps**: All employees created with BasicSalary=0
- **Tests**: ❌

### 11. Classes, Sections & Subjects (`/academics`)
- **Backend**: 🔶 Read-only. No POST/PUT/DELETE for classes/sections/subjects
- **Frontend**: 🔶 Teacher assignment works, no structure management
- **Tests**: ❌

### 12. Teacher Allocation (`/academics`)
- **Backend**: ✅ GET list, POST create, DELETE deactivate
- **Frontend**: ✅ Works
- **Gaps**: No conflict detection
- **Tests**: ❌

### 13. Attendance (`/attendance`)
- **Backend**: 🔶 No correction workflow (returns 409 if already marked)
- **Frontend**: 🔶 Loads 100 students, filters client-side
- **Tests**: ❌

### 14. Timetable (`/timetable`)
- **Backend**: ✅ Full CRUD
- **Frontend**: ✅ Works. Auto-saves without confirm
- **Tests**: ❌

### 15. Substitutions (`/substitutions`)
- **Backend**: ✅ Full workflow, triggered on leave approval
- **Frontend**: ✅ Works
- **Tests**: ❌

### 16. Lesson Plans (`/lesson-plans`)
- **Backend**: ✅ GET + POST
- **Frontend**: ✅ Works. No Monday validation on weekStart
- **Tests**: ❌

### 17. Class Diary (`/diary`)
- **Backend**: ✅ Digital + scan + compliance + remind
- **Frontend**: ✅ Rich text + scan upload
- **Deployment risk**: ❌ No Docker volume for private-uploads
- **Tests**: ❌

### 18. Homework (`/homework`)
- **Backend**: 🔶 No feedback/grading endpoint
- **Frontend**: 🔶 No submission list for teachers, no feedback
- **Tests**: ❌

### 19. Examinations & Results (`/examinations`)
- **Backend**: 🔶 No exam schedule, no grade calculation
- **Frontend**: 🔶 visibleExams() is a method not a signal
- **Tests**: ❌

### 20. Fee Management (`/fees`)
- **Backend**: 🔶 No fee structure management, no outstanding balance
- **Frontend**: 🔶 No outstanding balance, no receipt PDF
- **Tests**: ❌

### 21. Payroll (`/payroll`)
- **Backend**: 🔶 Hardcoded statutory rates, no salary input
- **Frontend**: 🔶 No month selector, no payslip PDF
- **Critical**: All payslips show wrong amounts (BasicSalary=0 fallback)
- **Tests**: ❌

### 22. Leave Management (`/leave`)
- **Backend**: ✅ Full workflow + substitution trigger
- **Frontend**: 🔶 Sends Guid.Empty for non-admin, calls ngOnInit() in callback
- **Gaps**: No leave balance tracking
- **Tests**: ❌

### 23. Transport (`/transport`)
- **Backend**: 🔶 Routes + active trips only. No vehicle/driver/student management
- **Frontend**: ❌ Read-only, no management UI
- **Tests**: ❌

### 24. Announcements (`/announcements`)
- **Backend**: ✅ Audience-filtered GET + POST
- **Frontend**: 🔶 No pagination, no mark-as-read
- **Tests**: ❌

### 25. Messages & Communications (`/communications`)
- **Backend**: ✅ Outbox + announcement composer
- **Frontend**: ✅ Works
- **Gaps**: No direct messaging
- **Tests**: ❌

### 26. Analytics & Reports (`/analytics`)
- **Backend**: ❌ No dedicated analytics endpoints
- **Frontend**: ❌ Reuses dashboard data, decorative report cards
- **Tests**: ❌

### 27. Audit Logs (`/audit`)
- **Backend**: ✅ Full filters + pagination
- **Frontend**: ❌ No filter controls rendered
- **Tests**: ❌

### 28. School Settings (`/settings`)
- **Backend**: ❌ No PUT endpoint
- **Frontend**: ❌ Read-only display
- **Tests**: ❌

### 29. Integrations (`/integrations`)
- **Backend**: ✅ GET + PUT + POST test
- **Frontend**: ✅ Works. Raw JSON textarea is unfriendly
- **Tests**: ❌

---

## IMPLEMENTATION ORDER (approved items only)

### Batch 1 — Critical fixes (no approval needed, bugs)
- [ ] S1: Fix student dashboard hoisting bug
- [ ] S2: Add Docker volume for private-uploads
- [ ] S7: Add salary field to staff creation

### Batch 2 — Security (awaiting approval)
- [ ] S3/S4/S5/S6: Remove committed secrets from git history
- [ ] S8: Add refresh token
- [ ] S9: Fix leave ngOnInit anti-pattern
- [ ] S10: Add regression tests

### Batch 3 — Core missing functionality (awaiting approval)
- [ ] PUT /employees/{id} + edit form
- [ ] PUT /students/{id} + edit form
- [ ] Fee structure management
- [ ] Outstanding balance calculation
- [ ] PUT /schools/{id} + settings edit
- [ ] Payroll month selector + payslip PDF
- [ ] Transport vehicle/driver/student management
- [ ] Leave balance tracking

### Batch 4 — New modules (awaiting approval)
- [ ] Calendar events
- [ ] Analytics dashboards
- [ ] Attendance correction workflow
- [ ] Homework feedback
- [ ] Exam schedule + report card

### Batch 5 — UI/UX polish (after functionality complete)
- [ ] Global toast service
- [ ] Loading skeletons
- [ ] Audit filter controls
- [ ] Announcements pagination + mark-as-read
- [ ] Receipt PDF
