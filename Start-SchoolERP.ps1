$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

Write-Host 'Starting School ERP stack...' -ForegroundColor Cyan

docker compose up -d --build

Write-Host ''
Write-Host 'School ERP is running.' -ForegroundColor Green
Write-Host 'ERP portal: http://localhost:8380'
Write-Host 'API health: http://localhost:8301/health'
Write-Host 'Public website: http://localhost:8181'
Write-Host 'Database: localhost:8432'
