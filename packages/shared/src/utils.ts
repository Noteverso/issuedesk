import { Issue, BlogPost, BlogPostDraft } from './types';

/**
 * Extract excerpt from markdown content
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
  if (!content) return '';
  
  // Remove markdown syntax
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 0;
  
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract tags from issue labels
 */
export function extractTagsFromLabels(labels: Array<{ name: string }>): string[] {
  return labels
    .filter(label => !label.name.startsWith('blog-') && !label.name.startsWith('status-'))
    .map(label => label.name);
}

/**
 * Check if issue is a blog post
 */
export function isBlogPost(issue: Issue): boolean {
  return issue.labels.some(label => 
    label.name === 'blog' || 
    label.name.startsWith('blog-') ||
    label.name === 'post'
  );
}

/**
 * Convert Issue to BlogPost
 */
export function issueToBlogPost(issue: Issue): BlogPost {
  const content = issue.body || '';
  
  return {
    ...issue,
    excerpt: extractExcerpt(content),
    readingTime: calculateReadingTime(content),
    tags: extractTagsFromLabels(issue.labels),
    published: issue.state === 'open' && isBlogPost(issue),
  };
}

/**
 * Create a blog post draft
 */
export function createBlogPostDraft(
  title: string = '',
  content: string = '',
  labels: string[] = ['blog', 'draft']
): BlogPostDraft {
  return {
    title,
    content,
    labels,
    isDraft: true,
    lastModified: new Date(),
  };
}

/**
 * Validate GitHub repository name format
 */
export function isValidRepositoryName(name: string): boolean {
  const regex = /^[a-zA-Z0-9._-]+$/;
  return regex.test(name) && name.length > 0 && name.length <= 100;
}

/**
 * Validate GitHub username format
 */
export function isValidUsername(username: string): boolean {
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/;
  return regex.test(username);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} 分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} 小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} 天前`;
  } else {
    return formatDate(d);
  }
}

/**
 * Generate a random color for labels
 */
export function generateRandomColor(): string {
  const colors = [
    'FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7',
    'DDA0DD', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9',
    'F8C471', '82E0AA', 'F1948A', '85C1E9', 'D7BDE2'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
