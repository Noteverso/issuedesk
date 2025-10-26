import Database from 'better-sqlite3';
import { SyncQueue, SyncOperation, SyncEntityType } from '@issuedesk/shared';

export class SyncQueueRepository {
  constructor(private db: Database.Database) {}

  /**
   * Add an operation to the sync queue
   */
  enqueue(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
    payload?: any
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at, attempts)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    const result = stmt.run(
      entityType,
      entityId,
      operation,
      payload ? JSON.stringify(payload) : null,
      Date.now()
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get all pending operations (ready to sync)
   */
  getPending(): SyncQueue[] {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT * FROM sync_queue
      WHERE retry_after IS NULL OR retry_after <= ?
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(now) as any[];
    return rows.map((row) => this.rowToSyncQueue(row));
  }

  /**
   * Remove an operation from the queue
   */
  dequeue(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM sync_queue WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mark an operation for retry after rate limit
   */
  setRetryAfter(id: number, retryAfter: number, error?: string): void {
    const stmt = this.db.prepare(`
      UPDATE sync_queue
      SET retry_after = ?, error = ?, attempts = attempts + 1
      WHERE id = ?
    `);
    stmt.run(retryAfter, error || null, id);
  }

  /**
   * Update error for an operation
   */
  setError(id: number, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE sync_queue
      SET error = ?, attempts = attempts + 1
      WHERE id = ?
    `);
    stmt.run(error, id);
  }

  /**
   * Get queue count
   */
  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM sync_queue');
    const { count } = stmt.get() as { count: number };
    return count;
  }

  /**
   * Clear all queue entries
   */
  clear(): void {
    this.db.prepare('DELETE FROM sync_queue').run();
  }

  /**
   * Convert database row to SyncQueue object
   */
  private rowToSyncQueue(row: any): SyncQueue {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      payload: row.payload,
      createdAt: row.created_at,
      retryAfter: row.retry_after,
      error: row.error,
      attempts: row.attempts,
    };
  }
}
