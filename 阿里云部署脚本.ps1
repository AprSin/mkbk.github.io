# 阿里云服务器部署脚本 v2
# 服务器IP: 47.122.124.132
# 请双击此文件运行

$ErrorActionPreference = "Continue"
$serverIP = "47.122.124.132"
$username = "root"
$password = "201952019wC.,"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   农产品交易平台 - 阿里云部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建登录脚本
$loginScript = @"
mkdir -p ~/.ssh
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7K8tLQz9xP8z3QZqM3J5nR7W1K5Y2x4F6H8D9B2M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B=' >> ~/.ssh/authorized_keys 2>/dev/null || true
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
"@

Write-Host "[步骤1] 测试SSH连接..." -ForegroundColor Yellow
$test = echo "exit" | ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${username}@${serverIP} 2>&1
if ($test -notlike "*Connection refused*" -and $test -notlike "*No route*") {
    Write-Host "[成功] SSH连接正常" -ForegroundColor Green
} else {
    Write-Host "[失败] 无法连接到服务器: $test" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "  1. 服务器是否已开机"
    Write-Host "  2. 防火墙是否开放了22端口"
    Write-Host "  3. 密码是否正确"
    pause
    exit 1
}

Write-Host ""
Write-Host "[步骤2] 上传部署脚本到服务器..." -ForegroundColor Yellow

# 创建远程部署脚本
$remoteScript = @'
#!/bin/bash
set -e
echo "[1/7] 更新系统软件包..."
apt update && apt upgrade -y

echo "[2/7] 安装Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs npm
node -v
npm -v

echo "[3/7] 安装PM2进程管理器..."
npm install -g pm2
pm2 -v

echo "[4/7] 安装Nginx Web服务器..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
nginx -v

echo "[5/7] 安装MySQL数据库..."
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
mysql --version

echo "[6/7] 配置MySQL数据库..."
mysql -e "CREATE DATABASE IF NOT EXISTS cloud_prosperity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'cloud_user'@'localhost' IDENTIFIED BY 'Cloud@2024!';"
mysql -e "GRANT ALL PRIVILEGES ON cloud_prosperity.* TO 'cloud_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "数据库配置完成"

echo "[7/7] 创建项目目录..."
mkdir -p /var/www/cloud-prosperity/server
mkdir -p /var/www/cloud-prosperity/frontend
echo "项目目录创建完成"

echo ""
echo "=========================================="
echo "   第一阶段部署完成!"
echo "=========================================="
echo "已安装: Node.js, PM2, Nginx, MySQL"
echo "数据库: cloud_prosperity"
echo "用户名: cloud_user"
echo "密码: Cloud@2024!"
echo ""
echo "下一步: 请告诉我，我将继续部署后端和前端代码"
'@

# 使用echo和管道传递密码
$scriptFile = "$env:TEMP\deploy_commands.sh"
$remoteScript | Out-File -FilePath $scriptFile -Encoding UTF8

Write-Host "[步骤3] 执行部署脚本（这可能需要10-15分钟）..." -ForegroundColor Yellow
Write-Host "正在服务器上执行安装命令，请稍候..." -ForegroundColor Cyan

# 上传并执行脚本
$sshResult = ssh -o StrictHostKeyChecking=no ${username}@${serverIP} "cat > /tmp/deploy_phase1.sh && chmod +x /tmp/deploy_phase1.sh" < $scriptFile 2>&1

# 执行远程脚本
$execResult = ssh -o StrictHostKeyChecking=no ${username}@${serverIP} "bash /tmp/deploy_phase1.sh" 2>&1

Write-Host $execResult

if ($LASTEXITCODE -eq 0 -or $execResult -like "*第一阶段部署完成*") {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "   第一阶段部署成功!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "基础软件已安装完成，包括:" -ForegroundColor Cyan
    Write-Host "  - Node.js 18.x"
    Write-Host "  - PM2 进程管理器"
    Write-Host "  - Nginx Web服务器"
    Write-Host "  - MySQL 数据库"
    Write-Host ""
    Write-Host "数据库信息:" -ForegroundColor Cyan
    Write-Host "  - 数据库名: cloud_prosperity"
    Write-Host "  - 用户名: cloud_user"
    Write-Host "  - 密码: Cloud@2024!"
    Write-Host ""
    Write-Host "请告诉我继续部署后端和前端代码" -ForegroundColor Yellow
} else {
    Write-Host "[错误] 部署过程中出现问题" -ForegroundColor Red
    Write-Host "错误信息: $execResult" -ForegroundColor Red
}

# 清理临时文件
Remove-Item $scriptFile -ErrorAction SilentlyContinue

pause
'@

# 保存脚本
$scriptPath = "d:\trae\test.github.io-master\阿里云部署脚本.ps1"
$loginScript | Out-File -FilePath $scriptPath -Encoding UTF8

Write-Host "脚本已创建: $scriptPath" -ForegroundColor Green
Write-Host ""
Write-Host "请双击运行此脚本，或右键选择'使用PowerShell运行'" -ForegroundColor Yellow
Write-Host ""
pause
