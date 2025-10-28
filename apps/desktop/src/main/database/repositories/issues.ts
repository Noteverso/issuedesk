import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Issue, CreateIssueInput, UpdateIssueInput, IssueFilter, IssueListResult } from '@issuedesk/shared';

export class IssuesRepository {
  constructor(private db: Database.Database) {}

  /**
   * List issues with optional filtering and pagination
   */
  list(filter: IssueFilter = {}, page = 1, perPage = 50): IssueListResult {
    let query = 'SELECT * FROM issues WHERE 1=1';
    const params: any[] = [];

    // Apply filters
    if (filter.state && filter.state !== 'all') {
      query += ' AND state = ?';
      params.push(filter.state);
    }

    if (filter.search) {
      query += ' AND title LIKE ?';
      params.push(`%${filter.search}%`);
    }

    if (filter.labels && filter.labels.length > 0) {
      query += ` AND id IN (
        SELECT DISTINCT issue_id FROM issue_labels il
        JOIN labels l ON il.label_id = l.id
        WHERE l.name IN (${filter.labels.map(() => '?').join(',')})
      )`;
      params.push(...filter.labels);
    }

    // Get total count
    const countStmt = this.db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'));
    const { count } = countStmt.get(...params) as { count: number };

    // Apply pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(perPage, (page - 1) * perPage);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    // Convert snake_case to camelCase and fetch labels
    const issues: Issue[] = rows.map((row) => this.rowToIssue(row));

    return {
      issues,
      total: count,
      page,
      perPage,
      hasMore: page * perPage < count,
    };
  }

  /**
   * Get a single issue by ID
   */
  get(id: string): Issue | null {
    const stmt = this.db.prepare('SELECT * FROM issues WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToIssue(row as any) : null;
  }

  /**
   * Create a new issue
   */
  create(input: CreateIssueInput): Issue {
    const id = uuidv4();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO issues (
        id, number, title, body, state, created_at, updated_at,
        github_url, sync_status, local_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Get next issue number
    const maxNumber = this.db.prepare('SELECT MAX(number) as max FROM issues').get() as { max: number | null };
    const number = (maxNumber?.max || 0) + 1;

    stmt.run(
      id,
      number,
      input.title,
      input.body || null,
      'open',
      now,
      now,
      '', // Will be set after GitHub sync
      'pending_create',
      now
    );

    // Add labels
    if (input.labels) {
      this.setLabels(id, input.labels);
    }

    return this.get(id)!;
  }

  /**
   * Update an existing issue
   */
  update(id: string, input: UpdateIssueInput): Issue | null {
    const existing = this.get(id);
    if (!existing) return null;

    const now = Date.now();
    const updates: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }

    if (input.body !== undefined) {
      updates.push('body = ?');
      params.push(input.body);
    }

    if (input.state !== undefined) {
      updates.push('state = ?');
      params.push(input.state);
    }

    updates.push('sync_status = ?', 'local_updated_at = ?');
    params.push('pending_update', now, id);

    const stmt = this.db.prepare(`UPDATE issues SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    // Update labels if provided
    if (input.labels !== undefined) {
      this.setLabels(id, input.labels);
    }

    return this.get(id);
  }

  /**
   * Delete an issue
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM issues WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Set labels for an issue (replaces all existing labels)
   */
  private setLabels(issueId: string, labelIds: string[]): void {
    // Remove existing labels
    this.db.prepare('DELETE FROM issue_labels WHERE issue_id = ?').run(issueId);

    // Add new labels
    if (labelIds.length > 0) {
      const stmt = this.db.prepare('INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)');
      for (const labelId of labelIds) {
        stmt.run(issueId, labelId);
      }
    }
  }

  /**
   * Convert database row to Issue object
   */
  private rowToIssue(row: any): Issue {
    // Fetch labels for this issue
    const labelStmt = this.db.prepare(`
      SELECT l.id FROM labels l
      JOIN issue_labels il ON l.id = il.label_id
      WHERE il.issue_id = ?
    `);
    const labelRows = labelStmt.all(row.id) as { id: string }[];

    return {
      id: row.id,
      number: row.number,
      title: row.title,
      body: row.body,
      state: row.state,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      githubUrl: row.github_url,
      syncStatus: row.sync_status,
      localUpdatedAt: row.local_updated_at,
      remoteUpdatedAt: row.remote_updated_at,
      bodyChecksum: row.body_checksum,
      labels: labelRows.map((l) => l.id),
    };
  }
}
