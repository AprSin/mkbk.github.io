@echo off
chcp 65001 >nul
echo ========================================
echo    农产品交易平台 - 阿里云自动部署
echo ========================================
echo.

set SERVER_IP=47.122.124.132
set SERVER_USER=root
set SERVER_PASS=201952019wC.,

echo [准备] 检查SSH密钥...
if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo 生成SSH密钥...
    ssh-keygen -t rsa -b 2048 -f "%USERPROFILE%\.ssh\id_rsa" -N "" -q
)

echo [步骤1] 复制SSH公钥到服务器...
echo 此步骤需要输入一次密码...

# 使用ssh-copy-id方式复制公钥
type "%USERPROFILE%\.ssh\id_rsa.pub" | ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

if errorlevel 1 (
    echo [警告] SSH密钥设置失败，尝试密码登录...
    set USE_KEY=0
) else (
    echo [成功] SSH密钥已配置
    set USE_KEY=1
)

echo.
echo [步骤2] 测试SSH连接（无密码）...
ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "echo SSH无密码连接成功"
if errorlevel 1 (
    echo [错误] SSH连接失败
    pause
    exit /b 1
)

echo.
echo [步骤3] 创建并执行部署脚本...
echo 这可能需要10-15分钟，请耐心等待...
echo.

ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% << 'ENDSSH'
#!/bin/bash
set -e

echo "[1/7] 更新系统软件包..."
apt update && apt upgrade -y
echo "[完成]"

echo "[2/7] 安装Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs npm
node -v
echo "[完成]"

echo "[3/7] 安装PM2进程管理器..."
npm install -g pm2
pm2 -v
echo "[完成]"

echo "[4/7] 安装Nginx Web服务器..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
nginx -v
echo "[完成]"

echo "[5/7] 安装MySQL数据库..."
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
mysql --version
echo "[完成]"

echo "[6/7] 配置MySQL数据库..."
mysql -e "CREATE DATABASE IF NOT EXISTS cloud_prosperity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'cloud_user'@'localhost' IDENTIFIED BY 'Cloud@2024!';"
mysql -e "GRANT ALL PRIVILEGES ON cloud_prosperity.* TO 'cloud_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "数据库配置完成 [完成]"

echo "[7/7] 创建项目目录..."
mkdir -p /var/www/cloud-prosperity/server
mkdir -p /var/www/cloud-prosperity/frontend
chmod -R 755 /var/www/cloud-prosperity
echo "[完成]"

echo ""
echo "============================================"
echo "   第一阶段部署完成!"
echo "============================================"
echo ""
echo "已安装:"
echo "  ✓ Node.js"
echo "  ✓ PM2"
echo "  ✓ Nginx"
echo "  ✓ MySQL"
echo ""
echo "数据库:"
echo "  名称: cloud_prosperity"
echo "  用户: cloud_user"
echo "  密码: Cloud@2024!"
echo ""
echo "项目目录:"
echo "  /var/www/cloud-prosperity/server"
echo "  /var/www/cloud-prosperity/frontend"
ENDSSH

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
echo 请将后端和前端代码上传到:
echo   /var/www/cloud-prosperity/server
echo   /var/www/cloud-prosperity/frontend
echo.
echo 然后告诉我继续配置后端和Nginx
echo.
pause
