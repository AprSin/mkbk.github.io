# 阿里云服务器部署脚本
# 服务器IP: 47.122.124.132

$serverIP = "47.122.124.132"
$username = "root"
$password = "201952019wC.,"

# 创建部署脚本内容
$deployScript = @'
#!/bin/bash
set -e

echo "===== 开始部署农产品交易平台 ====="
echo "时间: $(date)"

# 1. 系统更新
echo "[1/7] 正在更新系统..."
apt update && apt upgrade -y

# 2. 安装Node.js
echo "[2/7] 正在安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs npm
node -v
npm -v

# 3. 安装PM2
echo "[3/7] 正在安装PM2..."
npm install -g pm2
pm2 -v

# 4. 安装Nginx
echo "[4/7] 正在安装Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
nginx -v

# 5. 安装MySQL
echo "[5/7] 正在安装MySQL..."
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
mysql --version

# 6. 配置MySQL数据库
echo "[6/7] 正在配置MySQL数据库..."
mysql -e "CREATE DATABASE IF NOT EXISTS cloud_prosperity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'cloud_user'@'localhost' IDENTIFIED BY 'Cloud@2024!';"
mysql -e "GRANT ALL PRIVILEGES ON cloud_prosperity.* TO 'cloud_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "数据库配置完成"

# 7. 创建项目目录
echo "[7/7] 正在创建项目目录..."
mkdir -p /var/www/cloud-prosperity/server
mkdir -p /var/www/cloud-prosperity/frontend
echo "项目目录创建完成"

echo "===== 第一阶段完成 ====="
echo "所有基础软件已安装完成"
'@

# 保存部署脚本到服务器
Write-Host "[连接服务器] 正在连接 $serverIP ..."
$sshCmd = "echo '$password' | ssh -o StrictHostKeyChecking=no $username@$serverIP 'cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh'"

# 使用SSH远程执行命令
$session = New-PSSession -HostName $serverIP -UserName $username -Password $secPassword -ErrorAction SilentlyContinue

if ($session) {
    Write-Host "[成功] SSH连接建立"
    Enter-PSSession $session

    # 写入脚本
    Invoke-Command -Session $session -ScriptBlock {
        param($deployScript)
        $deployScript | Out-File -FilePath /tmp/deploy.sh -Encoding utf8
        chmod +x /tmp/deploy.sh
    } -ArgumentList $deployScript

    # 执行脚本
    Invoke-Command -Session $session -ScriptBlock {
        bash /tmp/deploy.sh
    }

    Exit-PSSession
    Remove-PSSession $session
} else {
    Write-Host "[信息] PSSession不可用，尝试其他方法..."
}
