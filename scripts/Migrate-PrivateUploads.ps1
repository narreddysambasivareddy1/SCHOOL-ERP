# Copies admission and diary files into the Docker uploads volume.
# The source directory is only read. Nothing in the source is deleted.
param(
    [string]$Source = "backend/src/SchoolERP.API/uploads",
    [string]$Volume = "school-erp_uploads_data"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = Join-Path $root $Source
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source folder was not found: $sourcePath"
}

$sourceCount = (Get-ChildItem $sourcePath -Recurse -File).Count
Write-Host "Source files: $sourceCount"

docker volume inspect $Volume | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "Docker volume $Volume was not found. Start the stack before migrating." }

docker run --rm `
    -v "${Volume}:/dest" `
    -v "${sourcePath}:/src:ro" `
    alpine:3.20 sh -c "cp -an /src/. /dest/ && find /dest -type f | wc -l"

if ($LASTEXITCODE -ne 0) { Write-Error "Copy into the volume failed. Source files were not deleted." }

$remaining = (Get-ChildItem $sourcePath -Recurse -File).Count
if ($remaining -ne $sourceCount) {
    Write-Error "Source file count changed during the copy. Investigate before deleting anything."
}

Write-Host "Copy finished. Source still has $remaining file(s). Verify a download in the app before removing any local copy."
