# Schedule weekly Kanban database backup at 15:00 (Bangkok time) on Windows Task Scheduler
param(
    [string]$DayOfWeek = "Sunday",
    [string]$Time = "15:00"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $scriptDir "backup.ps1"
$taskName = "Kanban_DB_Weekly_Backup"

Write-Host "Configuring Windows Task Scheduler for Kanban DB Backup..."
Write-Host "Task Name: $taskName"
Write-Host "Schedule: Every $DayOfWeek at $Time"
Write-Host "Script: $backupScript"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $DayOfWeek -At $Time
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Weekly backup of Planka Kanban PostgreSQL database with 30-day retention" -Force | Out-Null

Write-Host "Successfully registered scheduled task: $taskName"
Write-Host "You can verify in Task Scheduler or run: Get-ScheduledTask -TaskName '$taskName'"
