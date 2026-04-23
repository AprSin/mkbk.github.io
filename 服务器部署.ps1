$serverIP = "47.122.124.132"
$username = "root"
$password = "201952019wC."

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   阿里云服务器部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[步骤1] 测试SSH连接..." -ForegroundColor Yellow
$test = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $username@$serverIP "echo 连接成功; whoami; uname -a"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[成功] SSH连接正常" -ForegroundColor Green
} else {
    Write-Host "[失败] SSH连接失败" -ForegroundColor Red
    Write-Host "请手动测试: ssh root@$serverIP" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "[步骤2] 执行部署命令..." -ForegroundColor Yellow
Write-Host "这可能需要10-15分钟，请耐心等待..." -ForegroundColor Cyan
Write-Host ""

$deployOutput = ssh -o StrictHostKeyChecking=no $username@$serverIP @"
#!/bin/bash
set -e

echo '[1/7] 更新系统软件包...'
apt update && apt upgrade -y

echo '[2/7] 安装Node.js 18.x...'
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs npm
node -v
npm -v

echo '[3/7] 安装PM2进程管理器...'
npm install -g pm2
pm2 -v

echo '[4/7] 安装Nginx Web服务器...'
apt install -y nginx
systemctl start nginx
systemctl enable nginx
nginx -v

echo '[5/7] 安装MySQL数据库...'
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
mysql --version

echo '[6/7] 配置MySQL数据库...'
mysql -e "CREATE DATABASE IF NOT EXISTS cloud_prosperity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'cloud_user'@'localhost' IDENTIFIED BY 'Cloud@2024!';"
mysql -e "GRANT ALL PRIVILEGES ON cloud_prosperity.* TO 'cloud_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo '数据库配置完成'

echo '[7/7] 创建项目目录...'
mkdir -p /var/www/cloud-prosperity/server
mkdir -p /var/www/cloud-prosperity/frontend
chmod -R 755 /var/www/cloud-prosperity
echo '项目目录创建完成'

echo ''
echo '============================================'
echo '   第一阶段部署完成!'
echo '============================================'
echo ''
echo '已安装: Node.js, PM2, Nginx, MySQL'
echo '数据库: cloud_prosperity (cloud_user / Cloud@2024!)'
echo '目录: /var/www/cloud-prosperity/'
"@

Write-Host $deployOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   第一阶段部署成功!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步请告诉我继续部署后端和前端" -ForegroundColor Yellow
} else {
    Write-Host "[错误] 部署过程出现问题" -ForegroundColor Red
}

pause
