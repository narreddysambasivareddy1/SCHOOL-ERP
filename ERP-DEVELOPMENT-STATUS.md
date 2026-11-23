# ERP Development Status

Last updated: 23 November 2026, after the six essential modules were implemented on `ui/premium-glassmorphism-v2`. Nothing in this pass was committed or pushed.

## Essential modules implemented

| Module | What now works | Still open |
|---|---|---|
| Students | Profile edit saves name, date of birth, status, class, section, roll number, and primary contact through `PUT /api/schools/{schoolId}/students/{id}`. Another tenant is not found. A class from another school is rejected. | Guardian relationship is stored as Guardian when a new contact is created |
| Staff | Profile edit saves name, email, phone, department, joining date, and basic salary. Salary must be greater than zero. HR and leadership only. A department from another school is rejected | Designation is not edited on the form |
| Fees | Accountant can add a category and save a class fee amount. The schedule response now returns scheduled total, successful payments, and outstanding as scheduled minus paid | Payments are not limited to the academic year. A student with payments from another year can reduce this year's outstanding |
| Attendance | A marked row can request a correction with a reason. The original code stays until a school admin or attendance officer approves. Rejection leaves the original row unchanged. Requests and decisions are audited | The correction queue is not filtered to the teacher's own sections |
| Classes | School admin can create an academic year, class, section, and subject. Existing teacher allocation is unchanged | The screen creates new rows. The PUT endpoints for editing an existing year, class, section, or subject are not wired to a picker |
| Payroll | The screen chooses year and month and creates a draft from saved salaries. Payslips are the stored rows. Print opens those amounts | Statutory percentages are still the existing calculator. They were not changed |

## Commands run for this implementation

| Command | Result |
|---|---|
| `dotnet test tests/SchoolERP.Tests.Unit/SchoolERP.Tests.Unit.csproj` | Passed 58, failed 0 |
| `dotnet test tests/SchoolERP.Tests.Integration/SchoolERP.Tests.Integration.csproj` | Passed 12, failed 0 |
| `dotnet build src/SchoolERP.API/SchoolERP.API.csproj -c Release` | Succeeded, 0 warnings, 0 errors |
| `npm run build` in `frontend` | Succeeded. Existing shell CSS budget warning remains: 17.50 kB against 16.00 kB |
| `npm test` | Not run. The frontend test target is Karma and there is no existing component test for these screens |

Migration `20261123020128_AddAttendanceCorrections` creates only `AttendanceCorrections`. It is applied when the API seeder runs. It was not applied to the running school database in this pass.

---

Last updated: 23 November 2026, after code changes on `ui/premium-glassmorphism-v2`. Nothing in this pass was committed or pushed.

This file records what was verified by running commands. It does not treat the product as deployment-ready.

## Commands actually run

| Command | Result |
|---|---|
| `dotnet test tests/SchoolERP.Tests.Unit/SchoolERP.Tests.Unit.csproj --nologo --verbosity minimal` | Passed: 52, Failed: 0 |
| `dotnet test tests/SchoolERP.Tests.Integration/SchoolERP.Tests.Integration.csproj --nologo --verbosity minimal` | First run after the Serilog change was still the old binary and failed 1 of 11 with `The logger is already frozen`. After `preserveStaticLogger: true`, a fresh run passed: 11, Failed: 0 |
| `dotnet build src/SchoolERP.API/SchoolERP.API.csproj -c Release` | Succeeded, 0 warnings, 0 errors |
| `npm run build` in `frontend` | Succeeded. Angular budget warning: `shell.component.ts` styles are 17.50 kB against a 16.00 kB budget. Exit code was 0 |
| `dotnet ef migrations add AddCalendarEvents` | Created `20261123013716_AddCalendarEvents`. The design-time host abort message is expected |
| `docker compose config --quiet` | Exit code 0 |
| `docker exec school-erp-api-1` upload count | `/app/private-uploads` is missing. `/app/uploads` exists and contains 0 files. `docker inspect` showed no mounts |
| `docker compose ps` | `school-erp-api-1`, `db`, `frontend`, `nginx`, and `school-website` were already up. The API image in that container dates from 19 November and does not include this working tree |
| `docker compose build api` | Exit code 0. Image `school-erp-api:latest` built |
| `docker compose up -d api` | Recreated `school-erp-api-1`, created volume `school-erp_uploads_data`, and mounted it at `/app/private-uploads` |
| `Invoke-WebRequest http://localhost:8301/health` | HTTP 200, `{"status":"Healthy","checks":[{"name":"postgres","status":"Healthy"}]}` |
| Calendar table | `CalendarEvents` is present in the `schoolerp` database after the new API started |
| Upload persistence | Wrote `persist-check.txt` into `/app/private-uploads`, ran `docker compose up -d --force-recreate api`, and read the same contents back. The marker file was then removed |

`dotnet test backend/SchoolERP.sln` is not a valid suite run. The solution has no build entries, so it restores nothing and runs no tests.

## Phase 1

| Item | Verified state |
|---|---|
| Student dashboard date | The old “used before declaration” bug is not present. `iso` now uses the local calendar date (`getFullYear` / `getMonth` / `getDate`) instead of `toISOString()`, which was the previous UTC day in IST. The production bundle compiled. The screen was not clicked in a browser |
| Basic salary | Create and update reject `BasicSalary <= 0` in `EmployeeAuditService`. The staff form already blocks a non-positive salary. Unit tests `CreateEmployee_RejectsZeroSalary` and `CreateEmployee_RejectsNegativeSalary` passed |
| Payroll | `PayrollCalculator.Compute` throws when basic is not positive. Creating a run refuses an active employee without a positive salary. Finalizing refuses a payslip whose gross is not positive. There is no silent salary default in the calculator. Statutory percentages are still fixed illustrative values |
| Uploads | The API container now mounts `school-erp_uploads_data` at `/app/private-uploads`. A marker file survived `docker compose up -d --force-recreate api` and was then removed. `scripts/Migrate-PrivateUploads.ps1` was not needed: the previous container's `/app/uploads` held 0 files. The script still copies with `cp -an` and does not delete the source |

## Security that is still open

- `backups/schoolerp-2026-11-19.sql`, `schoolerp-backup.dump`, `backend/.publish-test/`, and `backend/src/SchoolERP.API/appsettings.Development.json` are tracked. `.env` is not in the index and has no commits in history (`git rev-list --all -- .env` was empty).
- Those tracked files contain database and JWT material. They were not deleted and were not removed from Git. History rewrite and credential rotation need approval. Secret values are not copied into this document.
- Login now counts failures in memory and stops accepting that tenant/email after 8 failures inside 15 minutes. The counter is lost on restart and is not shared across API instances. There is still no refresh token.
- OTP codes are no longer returned on the public HTTP response. A sandbox notification can still contain the code. `X-Forwarded-For` is still trusted for the OTP rate limit.

## Modules touched in this pass

- `PUT /api/schools/{schoolId}/students/{id}` and `PUT /api/schools/{schoolId}/employees/{id}` call the existing update services. The student and staff screens do not yet have edit forms, so those workflows are not complete in the UI.
- Fee structure list and save: `GET/POST /api/schools/{schoolId}/fees/structures`. The fees page still does not calculate an outstanding balance or render a structure editor.
- Vehicle list and create: `GET/POST /api/schools/{schoolId}/transport/vehicles`, with a form on the transport page for SchoolAdmin, PlatformSuperAdmin, and TransportManager. Drivers, route editing, and student allocation are still absent.
- School profile save: `PUT /api/schools/{schoolId}` and a form on Settings.
- Calendar: `CalendarEvents` table migration, `GET/POST /api/schools/{schoolId}/calendar`, and a list plus publish form. The migration runs when the API seeder starts. It has not been applied to the database behind the currently running container.
- Audit page sends entity type and actor to the existing audit API.

## Not done

Attendance correction, homework grading and attachments, payslip PDF, statutory settings that a school can change, leave balances, student transport allocation, analytics beyond the office dashboard, academic structure create/update, and a full UI pass for spacing and typography. Browser end-to-end checks for each role were not run. The API image was rebuilt and recreated. The frontend container was not rebuilt, so the portal image does not yet contain the calendar, settings, audit, or vehicle screen changes.
