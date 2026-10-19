# Clean-AI-Dev-Login.ps1
# Windows PowerShell 5.1+; run as the signed-in Windows user.
# This script backs up selected settings, then removes local VS Code/Amazon Q/Kiro
# authentication/cache state. It does NOT delete project/repository folders.
# Review the paths and read prompts before confirming.

$ErrorActionPreference = "Continue"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $env:USERPROFILE "Desktop\AI-Dev-Cleanup-Backup-$stamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

Write-Host "`n=== AI coding tools cleanup ===" -ForegroundColor Cyan
Write-Host "Backup folder: $backupRoot"
Write-Host "Close VS Code, VS Code Insiders, Kiro, and related terminals before proceeding." -ForegroundColor Yellow
$go = Read-Host "Have you closed these applications? Type YES to continue"
if ($go -cne "YES") { Write-Host "Cancelled."; exit }

# Stop only common editor processes; does not terminate terminals generally.
Get-Process Code, Kiro -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Backup user settings and extension lists where available.
$backupCandidates = @(
    (Join-Path $env:APPDATA "Code\User"),
    (Join-Path $env:APPDATA "Code - Insiders\User"),
    (Join-Path $env:USERPROFILE ".gitconfig"),
    (Join-Path $env:USERPROFILE ".aws\config"),
    (Join-Path $env:USERPROFILE ".aws\credentials")
)
foreach ($src in $backupCandidates) {
    if (Test-Path -LiteralPath $src) {
        $destName = ($src -replace '[:\\ ]','_').Trim('_')
        try {
            Copy-Item -LiteralPath $src -Destination (Join-Path $backupRoot $destName) -Recurse -Force -ErrorAction Stop
            Write-Host "Backed up: $src"
        } catch { Write-Warning "Could not back up $src : $_" }
    }
}

# Remove selected VS Code user data and extension state.
# This is a reset: settings, profiles, extensions, workspace state, and cached logins may be lost.
$targets = @(
    (Join-Path $env:APPDATA "Code"),
    (Join-Path $env:APPDATA "Code - Insiders"),
    (Join-Path $env:USERPROFILE ".vscode\extensions"),
    (Join-Path $env:USERPROFILE ".aws\sso\cache"),
    (Join-Path $env:USERPROFILE ".aws\cli\cache"),
    (Join-Path $env:USERPROFILE ".aws\amazonq"),
    (Join-Path $env:USERPROFILE ".kiro"),
    (Join-Path $env:APPDATA "Kiro"),
    (Join-Path $env:LOCALAPPDATA "Kiro"),
    (Join-Path $env:APPDATA "Amazon"),
    (Join-Path $env:LOCALAPPDATA "Amazon")
)

Write-Host "`nThe following existing folders may be deleted:" -ForegroundColor Yellow
$targets | Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object { Write-Host "  $_" }
Write-Host "`nNOTE: deleting the whole VS Code data folder removes settings and profiles." -ForegroundColor Yellow
$confirm = Read-Host "Type RESET to delete the listed folders and reset VS Code/Amazon Q/Kiro local state"
if ($confirm -cne "RESET") {
    Write-Host "Folder deletion cancelled. Backups remain at $backupRoot"
    exit
}

foreach ($target in $targets) {
    if (Test-Path -LiteralPath $target) {
        try {
            Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
            Write-Host "Removed: $target" -ForegroundColor Green
        } catch { Write-Warning "Could not fully remove $target : $_" }
    }
}

# Clean only common temporary files owned by the current Windows user.
$tempRoots = @($env:TEMP, (Join-Path $env:LOCALAPPDATA "Temp"))
foreach ($root in ($tempRoots | Select-Object -Unique)) {
    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -Force -ErrorAction SilentlyContinue | ForEach-Object {
            try { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop }
            catch { } # In-use files are expected to remain.
        }
        Write-Host "Attempted temp cleanup: $root"
    }
}

# Optional Windows Credential Manager cleanup. List matching targets first.
Write-Host "`nWindows Credential Manager entries matching GitHub/AWS/Amazon Q/Kiro:" -ForegroundColor Cyan
$credLines = @()
if (Get-Command cmdkey.exe -ErrorAction SilentlyContinue) {
    $credLines = cmdkey.exe /list 2>$null
    $matchingCredLines = $credLines | Where-Object { $_ -match '(?i)github|amazon|aws|kiro|visualstudio|vscode' }
    if ($matchingCredLines) { $matchingCredLines | ForEach-Object { Write-Host $_ } }
    else { Write-Host "No obvious matching entries found." }
    $credConfirm = Read-Host "Delete matching Credential Manager entries? Type DELETE-CREDENTIALS to proceed (optional)"
    if ($credConfirm -ceq "DELETE-CREDENTIALS") {
        $targetsFound = @()
        foreach ($line in $credLines) {
            if ($line -match '^\s*Target:\s*(.+?)\s*$') {
                $targetName = $Matches[1]
                if ($targetName -match '(?i)github|amazon|aws|kiro|visualstudio|vscode') {
                    $targetsFound += $targetName
                }
            }
        }
        foreach ($targetName in ($targetsFound | Select-Object -Unique)) {
            # cmdkey requires /delete:<target>
            & cmdkey.exe "/delete:$targetName" | Out-Null
            Write-Host "Requested deletion of credential target: $targetName"
        }
    } else {
        Write-Host "Credential Manager entries left unchanged."
    }
}

Write-Host "`nCleanup finished. Backup (where available): $backupRoot" -ForegroundColor Green
Write-Host "Restart Windows before reinstalling/signing in."
Write-Host "This does not reset any server-side subscription or usage quota."
