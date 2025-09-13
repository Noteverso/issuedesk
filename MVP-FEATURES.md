# GitIssueBlog MVP 功能说明

## 已实现功能

### 1. 管理 Issues ✅
- **创建 Issue**: 支持创建新的 GitHub Issue，包含标题、内容、标签
- **编辑 Issue**: 可以编辑现有 Issue 的标题、内容和状态
- **查看 Issues**: 列表显示所有 Issues，支持搜索和状态筛选
- **状态管理**: 支持开放/关闭状态切换
- **纯文本编辑**: 使用简单的文本区域进行内容编辑

### 2. 管理 Labels ✅
- **创建标签**: 支持创建新标签，包含名称、描述、颜色
- **编辑标签**: 可以修改标签的名称、描述和颜色
- **删除标签**: 支持删除非默认标签
- **颜色管理**: 支持自定义颜色和随机颜色生成
- **标签显示**: 在 Issues 中显示关联的标签

### 3. 项目配置 ✅
- **GitHub Token 配置**: 支持配置 Personal Access Token
- **连接测试**: 可以测试 GitHub 连接状态
- **用户信息显示**: 显示当前 GitHub 用户信息
- **仓库选择**: 支持选择默认仓库
- **编辑器设置**: 主题、字体大小、自动保存等配置
- **界面设置**: 侧边栏宽度、行号显示、自动换行等配置

## 技术架构

### Mono Repo 结构
```
gitissueblog/
├── apps/
│   ├── desktop/          # Electron 桌面应用
│   └── mobile/           # React Native 移动应用 (保留)
├── packages/
│   ├── shared/           # 共享类型和工具
│   └── github-api/       # GitHub API 客户端
└── pnpm-workspace.yaml   # pnpm workspace 配置
```

### 技术栈
- **桌面应用**: Electron + React + TypeScript + Tailwind CSS
- **状态管理**: React Context API
- **API 客户端**: Axios + TypeScript
- **包管理**: pnpm workspace
- **构建工具**: Vite + TypeScript

### 核心组件
- **Layout**: 应用布局和导航
- **Dashboard**: 仪表板，显示统计信息
- **Issues**: Issues 管理页面
- **Labels**: 标签管理页面
- **Settings**: 设置页面

## 使用说明

### 1. 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 2. 安装和启动
```bash
# 安装依赖
pnpm install

# 构建共享包
pnpm build:shared
pnpm build:github-api

# 启动开发模式
pnpm dev:desktop

# 或者使用启动脚本
./start-dev.sh
```

### 3. 配置 GitHub
1. 在 GitHub 设置中创建 Personal Access Token
2. 需要的权限：`repo` 和 `user`
3. 在应用的设置页面配置 Token
4. 选择默认仓库

### 4. 创建博客内容
根据 [all-in-github](https://github.com/byodian/all-in-github) 项目规范：

#### 博客文章 (Blog)
- 创建 Issue 并添加 `blog` 标签
- 添加 `Publishing` 标签触发发布
- 发布后标签自动变为 `Published`

#### 笔记 (Note)
- 创建 Issue 并添加 `note` 标签
- 每个评论都是一篇独立的博客文章
- 使用 HTML 注释设置标题、标签、描述：
  ```html
  <!-- title: 文章标题 -->
  <!-- tags: tag1,tag2 -->
  <!-- description: 文章描述 -->
  ```

## 与 all-in-github 集成

### 标签规范
- `blog`: 博客文章
- `note`: 笔记
- `Publishing`: 待发布
- `Published`: 已发布
- `draft`: 草稿

### 工作流程
1. 在桌面应用中创建和管理 Issues
2. 添加适当的标签
3. GitHub Actions 自动检测标签变化
4. 生成静态博客内容
5. 部署到 GitHub Pages

## 开发计划

### 下一步功能
- [ ] 富文本编辑器集成 (Tiptap)
- [ ] 图片上传和管理
- [ ] 本地草稿保存
- [ ] 批量操作
- [ ] 快捷键支持
- [ ] 主题切换
- [ ] 多仓库支持

### 移动端应用
- [ ] React Native 应用开发
- [ ] 跨平台同步
- [ ] 离线支持

## 构建和分发

### 开发构建
```bash
pnpm build:desktop
```

### 生产构建
```bash
# 当前平台
pnpm dist:desktop

# 指定平台
pnpm dist:desktop:mac    # macOS
pnpm dist:desktop:win    # Windows
pnpm dist:desktop:linux  # Linux
```

## 许可证

MIT License
