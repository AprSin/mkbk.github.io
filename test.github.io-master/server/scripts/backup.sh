#!/bin/bash

# 云上共富 - MySQL数据库备份脚本
# 使用方法: ./backup.sh 或双击执行

# 配置参数
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="cloud_prosperity"
DB_USER="cloud_app"
DB_PASSWORD="CloudApp@2024"

# 备份存储目录
BACKUP_DIR="D:/mysql_backups/cloud_prosperity"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# 创建备份目录（如果不存在）
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "创建备份目录: $BACKUP_DIR"
fi

# 执行备份
echo "=========================================="
echo "云上共富数据库备份"
echo "时间: $(date)"
echo "=========================================="

mysqldump -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "备份成功！"
    echo "备份文件: ${BACKUP_FILE}"
    echo "文件大小: $(ls -lh ${BACKUP_FILE} | awk '{print $5}')"
else
    echo "备份失败！"
    exit 1
fi

# 清理超过30天的备份
echo ""
echo "清理超过30天的旧备份..."
find ${BACKUP_DIR} -name "backup_*.sql" -mtime +30 -delete
echo "清理完成"

echo ""
echo "=========================================="
echo "备份任务完成"
echo "=========================================="