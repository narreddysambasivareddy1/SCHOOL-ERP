$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

Write-Host 'Stopping School ERP stack...' -ForegroundColor Cyan

docker compose down

Write-Host 'School ERP stack stopped.' -ForegroundColor Green
