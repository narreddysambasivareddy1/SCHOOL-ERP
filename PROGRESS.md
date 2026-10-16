# School ERP — Project Progress & Roadmap

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19 + PrimeNG |
| Backend | .NET 10 ASP.NET Core |
| ORM | EF Core 10 |
| Database | PostgreSQL |
| Reverse Proxy | nginx |
| Containerization | Docker + Docker Compose |

---

## Running URLs

| Service | URL |
|---------|-----|
| ERP Portal | http://localhost:8380 |
| Admin Login | http://localhost:8380/admin/login |
| Teacher Login | http://localhost:8380/teacher/login |
| Student Login | http://localhost:8380/student/login |
| School Website | http://localhost:8181 |
| API (direct) | http://localhost:8301 |
| Swagger | http://localhost:8301/api/swagger |
| Database | localhost:8432 |

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.edu | Admin@1234 |
| Teacher | teacher@school.edu | Admin@1234 |
| Student | student@school.edu | Admin@1234 |

### Seeded IDs
- **Tenant ID**: `e6ccef8b-1d05-485d-89de-0c61792eb71c`
- **School ID**: `87e1bf55-4b87-41d5-bf52-f3f462f88b20`
- **Academic Year ID**: `f277962c-327e-47e2-b622-a49bbe4b85a9` (2026-27)

---

## What We Built — Completed

### Phase 0 — Infrastructure
- [x] Docker Compose with `api`, `db`, `frontend`, `nginx`, `school-website` services
- [x] All ports moved to `8xxx` range to avoid conflicts
- [x] nginx reverse proxy — routes `/api/*` → backend, `/` → frontend
- [x] Angular build budgets raised (`1MB` initial, `16kB` component styles)
- [x] `.env` file with all configurable ports and secrets

### Phase 1 — Auth & Shell
- [x] JWT authentication with `X-Tenant-Id` header
- [x] RBAC — 12 roles seeded (SchoolAdmin, Teacher, Student, Parent, etc.)
- [x] Angular shell with role-based sidebar navigation
- [x] Role badge in shell header (Admin / Teacher / Student)
- [x] Public home page (`/`) with portal cards
- [x] Separate login portals — `/admin/login`, `/teacher/login`, `/student/login`
- [x] `PortalLoginComponent` — branded per role, redirects to role dashboard
- [x] Logout redirects to `/admin/login`

### Phase 2 — Core Modules (Live Data)
- [x] **Dashboard** — live stats (student count, staff count, attendance %, fee collection)
- [x] **Students** — CRUD with pagination and search
- [x] **Employees** — CRUD with pagination and search
- [x] **Attendance** — class/section/date selector, mark Present/Absent/Late/Excused, bulk mark
- [x] **Academics** — live teacher assignments from API
- [x] **Analytics** — live KPI strip + report cards from dashboard stats API
- [x] **Fees** — record payments, view student payment history
- [x] **Transport** — routes and active trips
- [x] **Homework** — list and create homework assignments

### Phase 3 — Role Dashboards
- [x] **Teacher Dashboard** — assigned classes, attendance stats, quick actions
- [x] **Student Dashboard** — attendance %, fee payments, homework

### Phase 4 — School Public Website
- [x] Standalone `school-website/index.html` (52KB) — full public website
- [x] Sections: Hero, Stats, About, Academics (6 programs), Admissions, Facilities, News, Portals CTA, Contact, Footer
- [x] School: Bright Future International School, Hyderabad
- [x] Served via separate nginx Docker service on port `8181`

### Bug Fixes Applied
- [x] nginx `proxy_pass` was stripping `/api` prefix — fixed to `proxy_pass http://api/api/`
- [x] `switchMap` returning `[null]` (plain array) instead of `of(null)` in login flow
- [x] Teacher/Student BCrypt hash was PHP `$2y$` format — replaced with BCrypt.Net compatible hash
- [x] Logout was redirecting to `/login` (404) — fixed to `/admin/login`

---

## Seeded Master Data

| Entity | Records |
|--------|---------|
| Classes | Grade 5, 6, 7, 8, 9 |
| Sections | A, B per class (10 total) |
| Subjects | Mathematics, Science, English, Telugu, Hindi, Social Studies |
| Departments | Teaching, Administration, Transport, Finance |
| Designations | Teacher, Senior Teacher, Driver, Office Manager, Accountant |
| Fee Categories | Tuition Fee, Transport Fee, Examination Fee, Activity Fee |

---

## What's Next — Pending

### Immediate (Demo Ready)
- [ ] Add sample students and employees via seeder or admin UI
- [ ] Add teacher assignments (link teacher employee to class/subject)
- [ ] Add sample attendance records for dashboard stats to show real numbers
- [ ] Add sample fee records so student dashboard shows payment history

### Phase 5 — Integrations (Requires External Accounts)
- [ ] SMS/Email/WhatsApp notifications (requires provider account + approved sender ID)
- [ ] GPS tracking for transport (requires Google Maps API key)
- [ ] Biometric device integration (requires hardware vendor SDK)
- [ ] Payment gateway (Razorpay or similar — requires merchant account)

### Phase 6 — HRMS & Payroll
- [ ] Leave request workflow (apply → approve → reject)
- [ ] Payroll runs with statutory deductions (PF, ESI, TDS)
- [ ] Payslip generation and download

### Phase 7 — Analytics & Performance
- [ ] Advanced analytics dashboards with charts (attendance trends, fee collection graphs)
- [ ] Exam results and grade reports
- [ ] Performance hardening — caching, pagination optimization
- [ ] UAT with real school data

### Production Checklist
- [ ] PostgreSQL credentials in `.env` (not defaults)
- [ ] JWT secret minimum 32 characters
- [ ] TLS certificate for production domain
- [ ] Backup storage target and tested restore procedure
- [ ] Restrict Swagger to development only (already configured)
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production` in Docker

---

## Key Architecture Notes

- **Multi-tenant** — every entity has `TenantId`. Auth requires `X-Tenant-Id` header.
- **StudentEnrollment has no SchoolId** — must join through `Students` table to filter by school.
- **Payment.PaidAt is `DateTime?`** (nullable) — requires `.HasValue` in LINQ queries.
- **DB volume persists** — seeder skips if `Tenants` table already has rows. To reseed, drop the volume: `docker compose down -v`.
- **Angular proxy** — dev server (`npm start`) proxies `/api` → `http://localhost:8100`. In Docker, nginx handles routing.

---

## Project Structure

```
SCHOOL-ERP/
├── backend/
│   ├── src/
│   │   ├── SchoolERP.API           # Controllers, middleware, launch settings
│   │   ├── SchoolERP.Application   # DTOs, service interfaces, validators
│   │   ├── SchoolERP.Domain        # Entities, enums
│   │   └── SchoolERP.Infrastructure # EF Core DbContext, service implementations, seeder
│   └── tests/
│       ├── SchoolERP.Tests.Unit
│       └── SchoolERP.Tests.Integration
├── frontend/
│   └── src/app/
│       ├── core/           # AuthService, guards, interceptors, SchoolContextService
│       ├── features/       # Dashboard, Students, Staff, Attendance, Fees, Transport,
│       │                   # Homework, Analytics, Teacher Dashboard, Student Dashboard,
│       │                   # Home, Auth portals
│       ├── layout/         # Shell with role-based sidebar
│       └── shared/         # Reusable components
├── nginx/                  # Reverse proxy config
├── school-website/         # Standalone public school website
│   ├── index.html
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env
└── PROGRESS.md             # This file
```
