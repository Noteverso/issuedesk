// GitHub API constants
export const GITHUB_API_BASE_URL = 'https://api.github.com';
export const GITHUB_API_VERSION = '2022-11-28';

// Default labels for blog posts
export const DEFAULT_BLOG_LABELS = [
  { name: 'blog', color: '0366d6', description: 'Blog post' },
  { name: 'draft', color: 'f9ca24', description: 'Draft post' },
  { name: 'published', color: '28a745', description: 'Published post' },
  { name: 'featured', color: 'e83e8c', description: 'Featured post' },
];

// Common blog post labels
export const BLOG_LABELS = [
  'blog',
  'draft',
  'published',
  'featured',
  'tutorial',
  'guide',
  'news',
  'update',
  'announcement',
  'review',
  'opinion',
  'technical',
  'personal',
];

// File extensions for different content types
export const CONTENT_EXTENSIONS = {
  markdown: ['.md', '.markdown'],
  text: ['.txt'],
  html: ['.html', '.htm'],
} as const;

// Editor themes
export const EDITOR_THEMES = [
  'light',
  'dark',
  'auto',
] as const;

// Supported languages for syntax highlighting
export const SUPPORTED_LANGUAGES = [
  'markdown',
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'csharp',
  'php',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'xml',
  'sql',
  'bash',
  'powershell',
] as const;

// App configuration defaults
export const DEFAULT_CONFIG = {
  github: {
    token: '',
    username: '',
    defaultRepository: '',
  },
  editor: {
    theme: 'light' as const,
    fontSize: 14,
    autoSave: true,
    autoSaveInterval: 5000,
  },
  ui: {
    sidebarWidth: 300,
    showLineNumbers: true,
    wordWrap: true,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接错误，请检查网络连接',
  AUTH_ERROR: '认证失败，请检查 GitHub Token',
  PERMISSION_ERROR: '权限不足，请检查仓库权限',
  NOT_FOUND: '资源未找到',
  VALIDATION_ERROR: '输入数据格式错误',
  UNKNOWN_ERROR: '未知错误',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ISSUE_CREATED: 'Issue 创建成功',
  ISSUE_UPDATED: 'Issue 更新成功',
  ISSUE_DELETED: 'Issue 删除成功',
  LABEL_CREATED: 'Label 创建成功',
  LABEL_UPDATED: 'Label 更新成功',
  LABEL_DELETED: 'Label 删除成功',
  CONFIG_SAVED: '配置保存成功',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  USER: '/user',
  REPOS: '/user/repos',
  REPO: (owner: string, repo: string) => `/repos/${owner}/${repo}`,
  ISSUES: (owner: string, repo: string) => `/repos/${owner}/${repo}/issues`,
  ISSUE: (owner: string, repo: string, number: number) => `/repos/${owner}/${repo}/issues/${number}`,
  COMMENTS: (owner: string, repo: string, issueNumber: number) => `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
  COMMENT: (owner: string, repo: string, commentId: number) => `/repos/${owner}/${repo}/issues/comments/${commentId}`,
  LABELS: (owner: string, repo: string) => `/repos/${owner}/${repo}/labels`,
  LABEL: (owner: string, repo: string, name: string) => `/repos/${owner}/${repo}/labels/${name}`,
} as const;
