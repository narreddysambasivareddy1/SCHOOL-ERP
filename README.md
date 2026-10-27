# School ERP & Digital Campus Platform

Full-stack School ERP built with **Angular 19 + PrimeNG**, **.NET 10 ASP.NET Core**, **EF Core 10**, **PostgreSQL** and **Docker**.

---

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and JWT_SECRET

# One-click startup on Windows
powershell -ExecutionPolicy Bypass -File .\Start-SchoolERP.ps1
```

Or manually:

```bash
docker compose up --build
```

- Frontend: http://localhost:8380
- API: http://localhost:8380/api
- Swagger: http://localhost:8380/api/swagger (development only)
- Health: http://localhost:8301/health

Utility scripts:
- `Start-SchoolERP.ps1` to build and start the stack
- `Stop-SchoolERP.ps1` to stop the stack
- `Check-ProjectStatus.ps1` to verify the app health

---

## Local development

### Backend

Requirements: .NET 10 SDK, PostgreSQL running locally.

```bash
cd backend
dotnet restore
# Set connection string in src/SchoolERP.API/appsettings.Development.json
dotnet run --project src/SchoolERP.API
# API runs on http://localhost:8100
```

Run migrations:
```bash
cd backend
dotnet ef migrations add InitialCreate --project src/SchoolERP.Infrastructure --startup-project src/SchoolERP.API
dotnet ef database update --project src/SchoolERP.Infrastructure --startup-project src/SchoolERP.API
```

Run tests:
```bash
dotnet test
```

### Frontend

Requirements: Node 22+

```bash
cd frontend
npm install
npm start
# Angular dev server on http://localhost:8200
# Proxies /api → http://localhost:8100
```

Run tests:
```bash
npm test
```

---

## Project structure

```
SCHOOL-ERP/
├── backend/
│   ├── src/
│   │   ├── SchoolERP.API          # ASP.NET Core Web API, controllers, middleware
│   │   ├── SchoolERP.Application  # DTOs, service interfaces, validators
│   │   ├── SchoolERP.Domain       # Entities, enums (no framework dependencies)
│   │   └── SchoolERP.Infrastructure # EF Core DbContext, service implementations
│   └── tests/
│       ├── SchoolERP.Tests.Unit
│       └── SchoolERP.Tests.Integration
├── frontend/
│   └── src/app/
│       ├── core/          # Auth service, guards, interceptors, school context
│       ├── features/      # Dashboard, Students, Staff, Academics, Attendance, Fees, Transport, Payroll, Communications, Analytics
│       ├── layout/        # Shell with sidebar navigation
│       └── shared/        # Reusable components
├── nginx/                 # Reverse proxy config
├── docker-compose.yml
└── .env.example
```

---

## API endpoints (Phase 1)

| Method | Path | Role |
|--------|------|------|
| POST | /api/auth/login | Public |
| GET | /api/schools/{id}/students | Authenticated |
| POST | /api/schools/{id}/students | SchoolAdmin, AdmissionOfficer |
| GET | /api/schools/{id}/employees | Authenticated |
| POST | /api/schools/{id}/employees | SchoolAdmin, HRManager |
| POST | /api/schools/{id}/attendance | SchoolAdmin, Teacher, AttendanceOfficer |
| GET | /api/schools/{id}/attendance | Authenticated |
| GET | /api/schools/{id}/fees/student/{sid} | Authenticated |
| POST | /api/schools/{id}/fees/record | SchoolAdmin, Accountant |
| GET | /api/schools/{id}/transport/routes | Authenticated |
| POST | /api/schools/{id}/transport/routes | SchoolAdmin, TransportManager |
| GET | /api/schools/{id}/transport/trips/active | Authenticated |
| GET | /api/schools/{id}/homework | Authenticated |
| POST | /api/schools/{id}/homework | SchoolAdmin, Teacher |
| GET | /api/audit | SchoolAdmin, PlatformSuperAdmin |
| GET | /health | Public |

---

## Phase completion status

- [x] Phase 0 — Project structure, Docker, CI config
- [x] Phase 1 — Domain entities, EF Core DbContext, JWT auth, RBAC, Angular shell + login
- [x] Phase 2 — Student/Employee CRUD, lifecycle entities, teacher assignments
- [x] Phase 3 — Attendance, Homework, Examinations entities + controllers
- [x] Phase 4 — Fees/Payments entities + controller
- [x] Phase 5 — Transport routes/trips entities + controller
- [ ] Phase 5 — GPS/biometric device adapters (requires hardware confirmation)
- [ ] Phase 5 — SMS/Email/WhatsApp provider adapters (requires provider accounts)
- [ ] Phase 6 — HRMS leave workflows, Payroll runs (requires statutory validation)
- [ ] Phase 7 — Analytics dashboards, performance hardening, UAT

## External prerequisites before production

- PostgreSQL credentials (set in .env)
- JWT secret (min 32 chars, set in .env)
- Payment gateway merchant account (Razorpay or selected provider)
- Google Maps Platform API key (restricted by application)
- SMS/Email/WhatsApp provider accounts and approved sender IDs
- Biometric device make/model and vendor SDK/API
- TLS certificate for production domain
- Backup storage target and tested restore procedure
