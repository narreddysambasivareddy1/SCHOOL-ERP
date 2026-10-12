#Requires -RunAsAdministrator

Write-Host "=== Starting Complete Cleanup Process ===" -ForegroundColor Cyan

# 1. Clear System Temporary Files
Write-Host "`n[1/4] Clearing System Temporary Files..." -ForegroundColor Yellow
@($env:TEMP, "C:\Windows\Temp").ForEach({
    if (Test-Path $_) {
        Write-Host "Cleaning: $_"
        $currentPath = $_$files = Get-ChildItem -Path $currentPath -Recurse -Force -ErrorAction SilentlyContinue$files.ForEach({
            try {
                Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop
            } catch {
                # Skip locked files
            }
        })
    }
})

# 2. Clear VS Code Logs and Caches (Preserving Extensions)
Write-Host "`n[2/4] Cleaning VS Code Caches and Logs (Keeping Extensions)..." -ForegroundColor Yellow
@(
    "$env:APPDATA\Code\logs",
    "$env:APPDATA\Code\Cache",
    "$env:APPDATA\Code\CachedData"
).ForEach({
    if (Test-Path $_) {
        Write-Host "Removing: $_"
        Remove-Item -Path "$_\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
})

# 3. Clear GitHub Desktop and CLI Logs
Write-Host "`n[3/4] Clearing GitHub Logs..." -ForegroundColor Yellow
@(
    "$env:APPDATA\GitHub Desktop\Logs",
    "$env:USERPROFILE\.config\gh\logs"
).ForEach({
    if (Test-Path $_) {
        Write-Host "Removing: $_"
        Remove-Item -Path "$_\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
})

# 4. Clear AWS, Amazon Q, & Kiro AI Data and Extensions
Write-Host "`n[4/4] Clearing AWS, Amazon Q, and Kiro AI Data..." -ForegroundColor Yellow

# Remove matching VS Code extensions
$extDir = "$env:USERPROFILE\.vscode\extensions"
if (Test-Path $extDir) {
    (Get-ChildItem -Path $extDir).ForEach({
        if ($_.Name -like "*amazonwebservices*" -or $_.Name -like "*aws*" -or $_.Name -like "*kiro*") {
            Write-Host "Removing extension: $($_.Name)"
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    })
}

# Remove Kiro and AWS configuration/cache paths
@(
    "$env:USERPROFILE\.kiro",
    "$env:LOCALAPPDATA\kiro-cli",
    "$env:APPDATA\Kiro",
    "$env:USERPROFILE\.aws\amazonq",
    "$env:APPDATA\Code\User\globalStorage\amazonwebservices.amazon-q-vscode",
    "$env:APPDATA\Code\User\globalStorage\amazonwebservices.aws-toolkit-vscode",
    "$env:APPDATA\Code\User\globalStorage\kiro*"
).ForEach({
    if (Test-Path $_) {
        Write-Host "Removing data: $_"
        Remove-Item -Path $_ -Recurse -Force -ErrorAction SilentlyContinue
    }
})

Write-Host "`n=== All Cleanups Completed Successfully! ===" -ForegroundColor Green
