# IssueDesk

一个基于 GitHub Issues 的博客内容管理系统，包含桌面客户端和移动端应用。

## 项目结构

这是一个使用 pnpm workspaces 管理的 mono repo，包含以下包：

```
issuedesk/
├── apps/
│   ├── desktop/          # Electron 桌面应用
│   └── mobile/           # React Native 移动应用  
├── packages/
│   ├── shared/           # 共享类型和工具
│   └── github-api/       # GitHub API 客户端
├── workers/
│   └── auth/             # Cloudflare Worker 认证后端
└── package.json          # 根包配置（含 workspaces）
```

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 安装依赖

```bash
# 安装 pnpm (如果还未安装)
npm install -g pnpm

# 安装所有包的依赖
pnpm install
```

## 开发

### 认证后端 (Cloudflare Worker)

```bash
# 开发模式（本地）
pnpm dev:auth

# 部署到 Cloudflare
pnpm deploy:auth
```

**首次设置**: 参见 [workers/auth/ENV_SETUP.md](workers/auth/ENV_SETUP.md)

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

1. **GitHub App 认证**
   - 安全的 GitHub App 设备流认证
   - 自动token刷新（无需重新登录）
   - 多组织/账户支持
   - 会话持久化（30天滑动窗口）

2. **管理 Issues**
   - 创建、编辑、删除 Issues
   - 支持纯文本编辑
   - 状态管理（开放/关闭）
   - 评论管理

3. **管理 Labels**
   - 创建、编辑、删除标签
   - 颜色管理
   - 标签分类

4. **项目配置**
   - 仓库选择
   - 主题设置（亮色/暗色）
   - 编辑器首选项

## 配置说明

### GitHub App 认证设置

IssueDesk 使用 GitHub App 进行安全认证。无需个人访问令牌（PAT）！

**首次使用**:
1. 启动桌面应用
2. 点击"Login with GitHub"
3. 在浏览器中授权应用
4. 系统会自动选择第一个可用的安装

**安装 GitHub App** (如果尚未安装):
1. 访问 GitHub App 安装页面
2. 选择要授予访问权限的仓库
3. 点击"Install"
4. 返回应用点击"Check Again"刷新安装列表

**详细设置指南**: 参见 [specs/002-github-app-auth/quickstart.md](specs/002-github-app-auth/quickstart.md)

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
- **认证后端**: Cloudflare Workers + TypeScript
- **存储**: Cloudflare KV (会话), Electron safeStorage (tokens)
- **移动应用**: React Native + Expo + TypeScript  
- **共享包**: TypeScript + Zod
- **API 客户端**: Axios + TypeScript
- **包管理**: pnpm workspaces

## 架构

### 认证流程

1. **设备流认证**: GitHub App 设备流（无需 OAuth回调）
2. **后端安全**: 所有敏感凭据（私钥、密钥）仅存储在 Cloudflare Worker
3. **Token管理**: 1小时access tokens，30天会话持久化
4. **自动刷新**: Token在过期前5分钟自动刷新
5. **离线支持**: 后端不可达时使用缓存token的只读模式

详见 [specs/002-github-app-auth/](specs/002-github-app-auth/) 了解完整的设计和实现细节。

## 许可证

MIT License
