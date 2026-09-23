# PowerShell Backup Script for Planka PostgreSQL database
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..")
$backupDir = Join-Path $rootDir "kanban_backup"

# Ensure backup directory exists
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Created backup directory: $backupDir"
}

# Generate filename with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $backupDir "backup_$timestamp.sql"

Write-Host "Starting Kanban Database Backup to $backupFile..."

# Execute pg_dump inside docker container
$envFile = Join-Path $rootDir ".env"
try {
    docker compose --env-file "$envFile" exec -T postgres pg_dump -U postgres planka | Out-File -FilePath $backupFile -Encoding utf8
    $fileSize = (Get-Item $backupFile).Length / 1KB
    Write-Host ("Backup completed successfully: {0} ({1:N2} KB)" -f $backupFile, $fileSize)
} catch {
    Write-Error "Backup failed: $_"
    exit 1
}

# Retention policy: Remove backups older than 30 days
$cutoffDate = (Get-Date).AddDays(-30)
$oldFiles = Get-ChildItem -Path $backupDir -Filter "backup_*.sql" | Where-Object { $_.LastWriteTime -lt $cutoffDate }

if ($oldFiles) {
    foreach ($file in $oldFiles) {
        Remove-Item -Path $file.FullName -Force
        Write-Host "Deleted old backup (>30 days): $($file.Name)"
    }
} else {
    Write-Host "No outdated backups found to delete (>30 days)."
}
