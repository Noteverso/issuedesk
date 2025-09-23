#!/bin/bash

# IssueDesk 开发启动脚本

echo "🚀 启动 IssueDesk 开发环境..."

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 Node.js (已包含 npm)"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建共享包
echo "🔨 构建共享包..."
npm run build:shared
npm run build:github-api

# 启动桌面应用开发模式
echo "🖥️  启动桌面应用..."
npm run dev:desktop
