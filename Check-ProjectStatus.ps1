$ErrorActionPreference = 'Continue'

$targets = @(
    @{ Name = 'ERP Portal'; Url = 'http://localhost:8380' },
    @{ Name = 'API'; Url = 'http://localhost:8301/health' },
    @{ Name = 'Public Website'; Url = 'http://localhost:8181' }
)

Write-Host 'Project status check' -ForegroundColor Cyan
Write-Host ''

foreach ($target in $targets) {
    try {
        $response = Invoke-WebRequest -Uri $target.Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Host ("[OK] {0}: HTTP {1}" -f $target.Name, $response.StatusCode) -ForegroundColor Green
        }
        else {
            Write-Host ("[WARN] {0}: HTTP {1}" -f $target.Name, $response.StatusCode) -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host ("[FAIL] {0}: {1}" -f $target.Name, $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ''
Write-Host 'Docker containers:' -ForegroundColor Cyan

docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
