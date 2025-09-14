#!/bin/bash

# IssueDesk 开发启动脚本

echo "🚀 启动 IssueDesk 开发环境..."

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    echo "npm install -g pnpm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建共享包
echo "🔨 构建共享包..."
pnpm build:shared
pnpm build:github-api

# 启动桌面应用开发模式
echo "🖥️  启动桌面应用..."
pnpm dev:desktop
