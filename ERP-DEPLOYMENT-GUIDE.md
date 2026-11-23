# School ERP deployment guide

This guide is for a clean machine. It does not rotate credentials by itself. Do that after reading the manual actions in `ERP-FINAL-AUDIT.md`.

On this workstation the API image was rebuilt and recreated on 23 November 2026. `CalendarEvents` is in the existing `schoolerp` database, and `school-erp_uploads_data` is mounted. The frontend image was not rebuilt. Do not point a new deployment at that database until you have a backup you have tested restoring.

## What you need

- Docker with Compose v2
- Nothing else for the container path. The host build path also needs the .NET 10 SDK and Node.js 20 or newer

## Environment

Create `.env` in the repository root. It is gitignored. Set at least:

- `POSTGRES_PASSWORD` — required by Compose. Use a new password, not a value copied from a tracked settings file or from a database dump
- `JWT_SECRET` — required by Compose. Use a new random value of at least 32 characters
- `POSTGRES_DB` — defaults to `schoolerp` if omitted
- `POSTGRES_USER` — defaults to `schoolerp` if omitted
- `JWT_ISSUER` — defaults to `schoolerp`
- `JWT_AUDIENCE` — defaults to `schoolerp-clients`
- `JWT_EXPIRY_MINUTES` — defaults to 60
- `INTEGRATIONS_MODE` — defaults to `Sandbox`. Use a live mode only after real provider credentials exist
- `ASPNETCORE_ENVIRONMENT` — defaults to `Production`

Do not commit `.env`. Do not reuse the password or JWT secret that are stored in `appsettings.Development.json`, `backend/.publish-test`, `backups/schoolerp-2026-11-19.sql`, or `schoolerp-backup.dump`.

Published ports, if you leave the defaults, are API `8301`, portal `8380`, website `8181`, frontend container `8300`, and Postgres `8432`.

## Database

Compose creates the Postgres volume `school-erp_pgdata` and starts Postgres 16. On API startup, `DbSeeder.SeedAsync` runs `Database.MigrateAsync` and then the demo seed. That creates the schema, including `CalendarEvents` from migration `20261123013716_AddCalendarEvents`, when the API image contains that migration.

To apply migrations from the host instead:

```powershell
dotnet ef database update --project backend/src/SchoolERP.Infrastructure/SchoolERP.Infrastructure.csproj --startup-project backend/src/SchoolERP.API/SchoolERP.API.csproj
```

Set `ConnectionStrings__Default` to the target database before running that command.

Take a logical backup before the first start against an existing database:

```powershell
docker exec school-erp-db-1 pg_dump -U schoolerp -d schoolerp -F c -f /tmp/schoolerp.dump
docker cp school-erp-db-1:/tmp/schoolerp.dump .\schoolerp-backup-new.dump
```

Store that file outside Git. The copies already in the repository must stay on disk until you have a newer backup, and they must be removed from Git history only after you approve that rewrite.

## Start and stop

From the repository root:

```powershell
docker compose build
docker compose up -d
docker compose ps
```

The API depends on a healthy database. Health for the API is the health-check endpoint configured in `Program.cs`. Logs:

```powershell
docker compose logs api --tail 100
```

Stop without deleting data:

```powershell
docker compose stop
```

`docker compose down -v` deletes `pgdata` and `uploads_data`. Do not use it on a school that has data.

## Persistent uploads

New diary scans and registration files are written under `/app/private-uploads` inside the API container. Compose mounts the named volume `uploads_data` there. On this machine that volume is `school-erp_uploads_data`. A marker file written there was still present after `docker compose up -d --force-recreate api`, and the marker was then removed. The previous container's `/app/uploads` directory contained 0 files, so nothing had to be copied.

Before recreating an API container that might hold files:

1. Copy the directory out and count the files. Example: `docker cp school-erp-api-1:/app/private-uploads C:\Users\kmanasa\school-erp-upload-backup`.
2. Recreate the API so the volume exists: `docker compose up -d api`.
3. Copy into the volume with `scripts/Migrate-PrivateUploads.ps1`, or `docker cp` into `/app/private-uploads`.
4. Count the files in the volume. Only after the counts match should anyone delete a spare copy. The script never deletes the source.

The repository folder `backend/src/SchoolERP.API/uploads` is a legacy fallback used by the authorized download endpoint. Do not delete it as part of the volume migration.

## Credential rotation

1. Choose a new Postgres password and a new JWT secret.
2. Put them only in the untracked `.env`.
3. Change the database role password to match.
4. Replace the development settings used by local runs with the new values. Do not paste the old or new values into a commit, a log, or this guide.
5. Restart Postgres and the API. Existing JWTs become invalid.
6. After a reviewed commit removes the tracked backup and publish files from the branch, rewrite history only if you explicitly want the old blobs gone from GitHub. That requires a force push and was not performed.

## What was not verified on this machine

- A full `docker compose build` of the frontend, website, and nginx images. Only `docker compose build api` was run, and it exited 0.
- Clicking each role through the portal in a browser. The portal container does not yet contain the screen changes from this working tree.
