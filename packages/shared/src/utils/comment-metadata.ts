/**
 * HTML metadata parser for comment metadata
 * Metadata is stored as HTML comments in markdown body:
 * <!-- title: Comment Title -->
 * <!-- description: Comment description -->
 * <!-- tags: tag1, tag2, tag3 -->
 * 
 * Rules:
 * - Title: max 100 chars
 * - Description: max 200 chars
 * - Tags: max 20 tags, each max 30 chars
 * - First occurrence wins for duplicates
 * - Malformed metadata: graceful fallback to empty defaults
 */

import { CommentMetadata } from '../types/comment';

const METADATA_PATTERNS = {
  title: /<!--\s*title:\s*([^>]*?)\s*-->/i,
  description: /<!--\s*description:\s*([^>]*?)\s*-->/i,
  tags: /<!--\s*tags:\s*([^>]*?)\s*-->/i,
} as const;

const MAX_LENGTHS = {
  title: 100,
  description: 200,
  tagCount: 20,
  tagLength: 30,
} as const;

/**
 * Parse comment metadata from HTML comments in markdown body
 * First occurrence wins for duplicate metadata fields
 * Malformed metadata is handled gracefully with empty defaults
 */
export function parseCommentMetadata(body: string): CommentMetadata {
  const metadata: CommentMetadata = {
    tags: [],
  };

  // Extract title (first occurrence only)
  const titleMatch = body.match(METADATA_PATTERNS.title);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim();
    if (title.length > 0) {
      metadata.title = title.substring(0, MAX_LENGTHS.title);
    }
  }

  // Extract description (first occurrence only)
  const descriptionMatch = body.match(METADATA_PATTERNS.description);
  if (descriptionMatch && descriptionMatch[1]) {
    const description = descriptionMatch[1].trim();
    if (description.length > 0) {
      metadata.description = description.substring(0, MAX_LENGTHS.description);
    }
  }

  // Extract tags (first occurrence only)
  const tagsMatch = body.match(METADATA_PATTERNS.tags);
  if (tagsMatch && tagsMatch[1]) {
    const tagsString = tagsMatch[1].trim();
    if (tagsString.length > 0) {
      // Split by comma, trim, filter empty, truncate to max length, limit count
      const tags = tagsString
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => tag.substring(0, MAX_LENGTHS.tagLength))
        .slice(0, MAX_LENGTHS.tagCount);
      
      metadata.tags = tags;
    }
  }

  return metadata;
}

/**
 * Embed comment metadata as HTML comments at the start of markdown body
 * Enforces 20-tag limit with silent truncation
 * Removes any existing metadata HTML comments before embedding new ones
 */
export function embedCommentMetadata(
  body: string,
  metadata: CommentMetadata
): string {
  // Remove any existing metadata HTML comments
  let cleanedBody = body
    .replace(METADATA_PATTERNS.title, '')
    .replace(METADATA_PATTERNS.description, '')
    .replace(METADATA_PATTERNS.tags, '')
    .trim();

  // Build metadata HTML comments
  const metadataComments: string[] = [];

  if (metadata.title) {
    const truncatedTitle = metadata.title.substring(0, MAX_LENGTHS.title);
    metadataComments.push(`<!-- title: ${truncatedTitle} -->`);
  }

  if (metadata.description) {
    const truncatedDescription = metadata.description.substring(0, MAX_LENGTHS.description);
    metadataComments.push(`<!-- description: ${truncatedDescription} -->`);
  }

  if (metadata.tags && metadata.tags.length > 0) {
    // Enforce tag limit and max length per tag
    const truncatedTags = metadata.tags
      .slice(0, MAX_LENGTHS.tagCount)
      .map((tag) => tag.substring(0, MAX_LENGTHS.tagLength));
    metadataComments.push(`<!-- tags: ${truncatedTags.join(', ')} -->`);
  }

  // Embed metadata at the start of body
  if (metadataComments.length === 0) {
    return cleanedBody;
  }

  return `${metadataComments.join('\n')}\n\n${cleanedBody}`;
}

/**
 * Strip all metadata HTML comments from body, returning clean markdown
 */
export function stripCommentMetadata(body: string): string {
  return body
    .replace(METADATA_PATTERNS.title, '')
    .replace(METADATA_PATTERNS.description, '')
    .replace(METADATA_PATTERNS.tags, '')
    .trim();
}

/**
 * Check if a comment body contains any metadata HTML comments
 */
export function hasCommentMetadata(body: string): boolean {
  return (
    METADATA_PATTERNS.title.test(body) ||
    METADATA_PATTERNS.description.test(body) ||
    METADATA_PATTERNS.tags.test(body)
  );
}
