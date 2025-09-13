# GitIssueBlog

一个基于 GitHub Issues 的博客内容管理系统，包含桌面客户端和移动端应用。

## 项目结构

这是一个使用 pnpm workspace 管理的 mono repo，包含以下包：

```
gitissueblog/
├── apps/
│   ├── desktop/          # Electron 桌面应用
│   └── mobile/           # React Native 移动应用
├── packages/
│   ├── shared/           # 共享类型和工具
│   └── github-api/       # GitHub API 客户端
├── pnpm-workspace.yaml   # pnpm workspace 配置
└── package.json          # 根包配置
```

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 安装依赖

```bash
# 安装所有包的依赖
pnpm install
```

## 开发

### 桌面应用 (Electron)

```bash
# 开发模式
pnpm dev:desktop

# 构建
pnpm build:desktop

# 打包分发
pnpm dist:desktop        # 当前平台
pnpm dist:desktop:mac    # macOS
pnpm dist:desktop:win    # Windows
pnpm dist:desktop:linux  # Linux
```

### 移动应用 (React Native)

```bash
# 开发模式
pnpm dev:mobile

# 构建
pnpm build:mobile
```

### 共享包

```bash
# 构建共享包
pnpm build:shared

# 构建 GitHub API 包
pnpm build:github-api

# 构建所有包
pnpm build:all
```

## 功能特性

### 桌面应用 MVP 功能

1. **管理 Issues**
   - 创建、编辑、删除 Issues
   - 支持纯文本编辑
   - 状态管理（开放/关闭）

2. **管理 Labels**
   - 创建、编辑、删除标签
   - 颜色管理
   - 标签分类

3. **项目配置**
   - GitHub Token 配置
   - 默认仓库设置
   - 用户信息管理

## 配置说明

### GitHub Token 配置

1. 在 GitHub 设置中创建 Personal Access Token
2. 需要的权限：
   - `repo` (完整仓库访问)
   - `user` (用户信息读取)
3. 在桌面应用的设置页面配置 Token

### 仓库配置

参考 [all-in-github](https://github.com/byodian/all-in-github) 项目：

1. Fork all-in-github 项目
2. 启用 Issues 和 Workflows
3. 配置 GitHub Actions
4. 创建必要的标签：`Note`、`Blog`、`Publishing`
5. 设置 GitHub Pages

## 开发指南

### 添加新功能

1. 在 `packages/shared` 中定义类型和工具
2. 在 `packages/github-api` 中实现 API 调用
3. 在 `apps/desktop` 中实现 UI 界面

### 代码规范

```bash
# 运行 lint
pnpm lint

# 类型检查
pnpm type-check
```

### 清理

```bash
# 清理所有 node_modules
pnpm clean
```

## 技术栈

- **桌面应用**: Electron + React + TypeScript + Tailwind CSS
- **移动应用**: React Native + Expo + TypeScript
- **共享包**: TypeScript + Zod
- **API 客户端**: Axios + TypeScript
- **包管理**: pnpm workspace

## 许可证

MIT License
