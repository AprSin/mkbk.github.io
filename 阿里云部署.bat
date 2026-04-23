@echo off
chcp 65001 >nul
echo ========================================
echo    农产品交易平台 - 阿里云部署脚本
echo ========================================
echo.

set SERVER_IP=47.122.124.132
set SERVER_USER=root
set SERVER_PASS=201952019wC.,

echo [步骤1] 检查连接...
echo 正在连接到 %SERVER_IP% ...

# 使用Windows的ssh检查连接
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "echo 连接成功" < NUL
if errorlevel 1 (
    echo [错误] 无法连接到服务器
    echo 请检查:
    echo   1. 服务器是否已开机
    echo   2. 网络是否正常
    echo   3. 防火墙是否开放22端口
    pause
    exit /b 1
)

echo [成功] 连接正常
echo.

echo [步骤2] 创建部署脚本...
echo 正在服务器上创建部署脚本...

# 创建远程命令脚本
ssh %SERVER_USER%@%SERVER_IP% "cat > /tmp/deploy.sh" << 'ENDSCRIPT'
#!/bin/bash
set -e

echo "[1/7] 更新系统软件包..."
apt update && apt upgrade -y

echo "[2/7] 安装Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs npm
node -v

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
ENDSCRIPT

if errorlevel 1 (
    echo [错误] 创建脚本失败
    pause
    exit /b 1
)

echo.
echo [步骤3] 执行部署脚本...
echo 这可能需要10-15分钟，请耐心等待...
echo.

ssh %SERVER_USER%@%SERVER_IP% "bash /tmp/deploy.sh"

if errorlevel 1 (
    echo [错误] 部署过程出现问题
    pause
    exit /b 1
)

echo.
echo ========================================
echo    第一阶段部署成功!
echo ========================================
echo.
echo 已安装的软件:
echo   - Node.js 18.x
echo   - PM2 进程管理器
echo   - Nginx Web服务器
echo   - MySQL 数据库
echo.
echo 数据库信息:
echo   - 数据库名: cloud_prosperity
echo   - 用户名: cloud_user
echo   - 密码: Cloud@2024!
echo.
echo 请告诉我继续部署后端和前端代码
echo.
pause
