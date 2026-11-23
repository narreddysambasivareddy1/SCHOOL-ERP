# School ERP final audit

Date: 23 November 2026. Branch: `ui/premium-glassmorphism-v2`. This audit covers the working tree after the changes in this session. Those changes are not committed.

The product is not production-ready. Tracked backups and development settings still contain credentials, several workflows stop at the API, and the portal container is still the previous frontend image.

## Test report

| Command | Working directory | Actual result |
|---|---|---|
| `dotnet test tests/SchoolERP.Tests.Unit/SchoolERP.Tests.Unit.csproj --nologo --verbosity minimal` | `backend` | Passed 52, failed 0, duration about 4 s |
| `dotnet test tests/SchoolERP.Tests.Integration/SchoolERP.Tests.Integration.csproj --nologo --verbosity minimal` | `backend` | Passed 11, failed 0, duration about 12 s, after the Serilog host fix |
| `dotnet build src/SchoolERP.API/SchoolERP.API.csproj -c Release --nologo --verbosity minimal` | `backend` | Build succeeded, 0 warnings, 0 errors |
| `npm run build` | `frontend` | Bundle written to `frontend/dist/school-erp`. Exit code 0. Warning: shell component CSS 17.50 kB exceeds the 16.00 kB budget |
| `dotnet ef migrations add AddCalendarEvents --project src/SchoolERP.Infrastructure/SchoolERP.Infrastructure.csproj --startup-project src/SchoolERP.API/SchoolERP.API.csproj --output-dir Migrations` | `backend` | Migration `20261123013716_AddCalendarEvents` created. Up creates only `CalendarEvents` |
| `docker compose config --quiet` | repository root | Exit code 0 |
| `docker compose ps` | repository root | Five services up. API container has no volume mounts |
| `docker exec school-erp-api-1 sh -c "find /app/uploads -type f \| wc -l"` | host | 0 |
| `docker compose build api` | repository root | Exit code 0. Image `school-erp-api:latest` built in about 34 s |
| `docker compose up -d api` | repository root | Recreated the API and created volume `school-erp_uploads_data` |
| `Invoke-WebRequest http://localhost:8301/health` | host | HTTP 200, status Healthy, postgres Healthy |
| `SELECT tablename FROM pg_tables ... calendar` | database `schoolerp` | `CalendarEvents` exists |
| Upload persistence | API container | Wrote `persist-check.txt`, recreated the API, read `persist-test` back from the volume, then deleted the marker |
| Browser role walkthroughs | — | Not run |
| `docker compose build` for the frontend image | — | Not run. The portal container is still the previous image |

Integration tests use database `schoolerp_security_tests` on the host Postgres port. They do not migrate the school database used by the running stack.

## Build section

`docker compose build api` finished with exit code 0 and tagged `school-erp-api:latest`. `docker compose up -d api` recreated `school-erp-api-1` against the existing Postgres volume. Startup logged a non-fatal missing `libgssapi_krb5.so.2` message, a data-protection key warning, and a missing `wwwroot` warning. `/health` then returned HTTP 200.

## Completed in this working tree

- Student dashboard dates use the local calendar day.
- Zero and negative basic salary are rejected by the employee service and by the existing staff form. Payroll calculation and finalization already refuse a non-positive salary or gross.
- Failed logins for the same tenant and email are rejected after 8 attempts in a 15-minute window, in process memory.
- Two WebApplicationFactory hosts can start in one test process because Serilog keeps the static logger.
- Student and employee update endpoints, school profile update, fee-structure list/save, vehicle list/create, and calendar list/create are implemented against the database.
- Settings can save the school profile. Transport can list and add vehicles. Calendar can list and publish events. Audit can filter by entity type and actor.
- `scripts/Migrate-PrivateUploads.ps1` copies a source folder into volume `school-erp_uploads_data`, checks that the source count did not change, and does not delete the source.
- `docker-compose.yml` mounts `uploads_data` at `/app/private-uploads`. The recreated API has that mount, and a marker file survived a second recreate.

## Module status

| Area | State |
|---|---|
| Login and JWT role claim | Working for the roles covered by the 11 integration tests. No refresh token. Lockout is per process |
| Office, teacher, student, and parent dashboards | Existing screens remain. Student date formatting was fixed in code and in the production bundle only |
| Enquiries and OTP | Public HTTP response does not include the code. Notification storage can still hold it |
| Registrations and private documents | Authorized download remains. New files go under `private-uploads`. The live container has no such directory and no volume |
| Students and staff | Create works. Update APIs exist. The screens still have no edit form |
| Academics, attendance, timetable, substitutions, lesson plans, diary | Existing behaviour kept. Attendance still returns a conflict when a mark already exists. No correction approval was added |
| Homework and examinations | Existing publish and mark flows kept. No new grading, attachment, schedule, or report-card workflow |
| Fees | Payment recording remains. Structure rows can be saved by fees staff. Outstanding balance and receipt PDF are not implemented |
| Payroll | Uses the saved basic salary and blocks an invalid run or finalization. Rates are still the built-in illustrative India-style formula, not school-configurable statutory settings. No payslip PDF |
| Leave | Existing apply and approval flow kept. No balance ledger |
| Transport | Routes, trips, and map remain. Vehicles can be saved. No driver record and no student seat allocation |
| Calendar | New table, API, and screen. `CalendarEvents` is now in the running `schoolerp` database. The portal container has not been rebuilt, so the new calendar form is not in the image that nginx is serving |
| Announcements and communications | Existing audience rules kept |
| Analytics | Still a view over dashboard data, not a separate reporting API |
| Audit | API filters were already present. The page now sends entity type and actor |
| Settings | Leadership can update name, colour, time zone, language, locale, and currency |
| Integrations | Existing settings screen kept. Live SMS, payment, and map providers still need real credentials |

## Security findings

1. Critical, still open: `backups/schoolerp-2026-11-19.sql` and `schoolerp-backup.dump` are tracked. They are database copies. Do not delete the working copies. Removing them from Git, and from history, requires an approved commit and a history rewrite.
2. Critical, still open: `backend/src/SchoolERP.API/appsettings.Development.json` and `backend/.publish-test/appsettings.Development.json` are tracked and contain the development JWT secret and database password. `.env` itself is gitignored and has no commit history.
3. High, reduced on this machine: the API container now uses `school-erp_uploads_data`. Files written only inside the container, outside that mount, are still lost on recreate. Data-protection keys are still stored under `/app/.aspnet` and are not on a volume.
4. Medium: login lockout is memory-only. OTP notification bodies can still contain a code. The OTP limiter trusts `X-Forwarded-For`.
5. Medium: employee and student updates are scoped by school id. School ids are unique. A second check against the caller tenant was not added inside the older service methods.
6. Stage 1 controls that remain: JWT `role` claim, office dashboard and communications role limits, fee reads limited to fees staff and the family, homework limited to the assigned teacher, payslips checked against school and tenant, registration files served only through the authorized endpoint.

No secret value is written in this audit.

## Unresolved product gaps

- Student and staff edit screens.
- Fee outstanding balance and receipts.
- Payroll month selection, payslip document, and configurable statutory rates.
- Transport drivers and student allocation.
- Attendance correction with approval.
- Homework attachments and grading.
- Exam schedule and report cards.
- Academic class, section, and subject maintenance.
- Analytics and report exports.
- Consistent premium layout pass across every page. Existing pages were not restyled in this pass, so working screens were not put through a visual rewrite.
- Role-by-role browser verification.

## Manual actions that need you

1. Approve a commit that stops tracking the backup SQL, the dump, and `backend/.publish-test/`, without deleting those files from disk. A history rewrite and force push are separate and were not done.
2. Rotate the database password and JWT secret that appear in the tracked development settings and in the database backups. Update the untracked `.env` and the development settings after rotation. Restart the database and API with the new values.
3. Rebuild and recreate the frontend image before expecting the new calendar, settings, audit, and vehicle screens in the portal. The API container is already on this working tree.
4. The calendar migration is already applied on the running `schoolerp` database. A clean machine still applies it through `DbSeeder.SeedAsync`.
5. Confirm the illustrative payroll percentages with a statutory adviser before using payslips as legal documents.
6. Provide live integration credentials if SMS, payments, or maps should leave sandbox mode.
