import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Label, CreateLabelInput, UpdateLabelInput } from '@issuedesk/shared';

export class LabelsRepository {
  constructor(private db: Database.Database) {}

  /**
   * List all labels
   */
  list(): Label[] {
    const stmt = this.db.prepare('SELECT * FROM labels ORDER BY name ASC');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.rowToLabel(row));
  }

  /**
   * Get a single label by ID
   */
  get(id: string): Label | null {
    const stmt = this.db.prepare('SELECT * FROM labels WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToLabel(row as any) : null;
  }

  /**
   * Create a new label
   */
  create(input: CreateLabelInput): Label {
    const id = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO labels (id, name, color, description, issue_count)
      VALUES (?, ?, ?, ?, 0)
    `);

    stmt.run(id, input.name, input.color, input.description || null);

    return this.get(id)!;
  }

  /**
   * Update an existing label
   */
  update(id: string, input: UpdateLabelInput): Label | null {
    const existing = this.get(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }

    if (input.color !== undefined) {
      updates.push('color = ?');
      params.push(input.color);
    }

    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }

    if (updates.length > 0) {
      params.push(id);
      const stmt = this.db.prepare(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...params);
    }

    return this.get(id);
  }

  /**
   * Delete a label
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM labels WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update issue count for a label
   */
  updateIssueCount(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE labels SET issue_count = (
        SELECT COUNT(*) FROM issue_labels WHERE label_id = ?
      ) WHERE id = ?
    `);
    stmt.run(id, id);
  }

  /**
   * Update issue counts for all labels
   */
  updateAllIssueCounts(): void {
    const stmt = this.db.prepare(`
      UPDATE labels SET issue_count = (
        SELECT COUNT(*) FROM issue_labels WHERE label_id = labels.id
      )
    `);
    stmt.run();
  }

  /**
   * Convert database row to Label object
   */
  private rowToLabel(row: any): Label {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description,
      issueCount: row.issue_count,
    };
  }
}
