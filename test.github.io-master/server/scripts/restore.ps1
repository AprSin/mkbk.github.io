# 云上共富 - MySQL数据库恢复脚本 (PowerShell版)
# 使用方法: .\restore.ps1 -BackupFile "D:\mysql_backups\cloud_prosperity\backup_20240101_120000.sql"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# 配置参数
$DB_HOST = "localhost"
$DB_PORT = "3306"
$DB_NAME = "cloud_prosperity"
$DB_USER = "cloud_app"
$DB_PASSWORD = "CloudApp@2024"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "云上共富数据库恢复" -ForegroundColor Cyan
Write-Host "时间: $(Get-Date)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 检查备份文件是否存在
if (-not (Test-Path $BackupFile)) {
    Write-Host "错误: 备份文件不存在: $BackupFile" -ForegroundColor Red
    exit 1
}

# 确认操作
Write-Host ""
Write-Host "警告: 此操作将覆盖现有数据库的所有数据！" -ForegroundColor Yellow
$confirm = Read-Host "是否继续? (y/n)"
if ($confirm -ne "y") {
    Write-Host "操作已取消" -ForegroundColor Red
    exit 0
}

# 执行恢复
Write-Host ""
Write-Host "正在恢复数据库..." -ForegroundColor Yellow

mysql.exe -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "恢复成功！" -ForegroundColor Green
} else {
    Write-Host "恢复失败！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "数据库恢复完成" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan