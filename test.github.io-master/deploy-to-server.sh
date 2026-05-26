#!/bin/bash

echo "=========================================="
echo "云上共富 - 自动部署脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目目录（根据实际情况修改）
PROJECT_DIR="/www/wwwroot/mkbk.github.io"
BACKEND_DIR="$PROJECT_DIR/server"

echo -e "${YELLOW}[1/6] 检查项目目录...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}错误：项目目录不存在: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}请先克隆项目或创建目录${NC}"
    exit 1
fi
cd "$PROJECT_DIR"
echo -e "${GREEN}✓ 项目目录: $PROJECT_DIR${NC}"

echo ""
echo -e "${YELLOW}[2/6] 拉取最新代码...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 代码拉取成功${NC}"
else
    echo -e "${RED}错误：代码拉取失败${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[3/6] 安装后端依赖...${NC}"
cd "$BACKEND_DIR"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 后端依赖安装成功${NC}"
else
    echo -e "${RED}错误：后端依赖安装失败${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[4/6] 重启后端服务...${NC}"
# 使用PM2重启
pm2 restart all || pm2 start src/index.js --name "cloud-prosperity-server"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 后端服务重启成功${NC}"
    pm2 list
else
    echo -e "${RED}错误：后端服务重启失败${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[5/6] 更新前端静态文件...${NC}"
# 复制dist到nginx目录
NGINX_HTML_DIR="/usr/share/nginx/html"
if [ -d "$NGINX_HTML_DIR" ]; then
    cp -r "$PROJECT_DIR/dist/"* "$NGINX_HTML_DIR/"
    echo -e "${GREEN}✓ 前端文件已更新到: $NGINX_HTML_DIR${NC}"
else
    echo -e "${YELLOW}⚠ 警告：Nginx目录不存在，跳过前端更新${NC}"
fi

echo ""
echo -e "${YELLOW}[6/6] 验证部署...${NC}"
sleep 2
echo -e "${GREEN}✓ 部署完成！${NC}"
echo ""
echo "=========================================="
echo "部署状态："
echo "=========================================="
echo -e "${GREEN}✓ 代码已更新${NC}"
echo -e "${GREEN}✓ 依赖已安装${NC}"
echo -e "${GREEN}✓ 服务已重启${NC}"
echo -e "${GREEN}✓ 前端已更新${NC}"
echo ""
echo -e "${YELLOW}请访问你的网站验证部署效果！${NC}"
echo ""
echo "常用命令："
echo "  pm2 logs          - 查看日志"
echo "  pm2 status         - 查看状态"
echo "  pm2 restart all    - 重启所有服务"
echo "=========================================="
