# 云上共富 - MySQL数据库备份脚本 (PowerShell版)
# 使用方法: .\backup.ps1

# 配置参数
$DB_HOST = "localhost"
$DB_PORT = "3306"
$DB_NAME = "cloud_prosperity"
$DB_USER = "cloud_app"
$DB_PASSWORD = "CloudApp@2024"

# 备份存储目录
$BACKUP_DIR = "D:\mysql_backups\cloud_prosperity"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "${BACKUP_DIR}\backup_${TIMESTAMP}.sql"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "云上共富数据库备份" -ForegroundColor Cyan
Write-Host "时间: $(Get-Date)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 创建备份目录（如果不存在）
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "创建备份目录: $BACKUP_DIR" -ForegroundColor Green
}

# 执行备份
mysqldump.exe -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "备份成功！" -ForegroundColor Green
    Write-Host "备份文件: $BACKUP_FILE" -ForegroundColor Green
    $fileSize = (Get-Item $BACKUP_FILE).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    Write-Host "文件大小: ${fileSizeMB} MB" -ForegroundColor Green
} else {
    Write-Host "备份失败！" -ForegroundColor Red
    exit 1
}

# 清理超过30天的备份
Write-Host ""
Write-Host "清理超过30天的旧备份..." -ForegroundColor Yellow
$cutoffDate = (Get-Date).AddDays(-30)
Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.sql" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force
Write-Host "清理完成" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "备份任务完成" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan