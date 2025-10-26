import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * DatabaseManager handles multi-repository SQLite database connections
 * One database file per repository for complete isolation
 */
export class DatabaseManager {
  private connections: Map<string, Database.Database> = new Map();
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'repositories');
    // Ensure directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Get or create a database connection for a repository
   */
  getDatabase(repoId: string): Database.Database {
    if (!this.connections.has(repoId)) {
      const dbPath = path.join(this.baseDir, `${repoId}.db`);
      const db = new Database(dbPath);
      
      // Configure database
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      
      // Run migrations
      this.runMigrations(db);
      
      this.connections.set(repoId, db);
    }
    
    return this.connections.get(repoId)!;
  }

  /**
   * Close a database connection
   */
  closeDatabase(repoId: string): void {
    const db = this.connections.get(repoId);
    if (db) {
      db.close();
      this.connections.delete(repoId);
    }
  }

  /**
   * Close all database connections
   */
  closeAll(): void {
    for (const [repoId, db] of this.connections) {
      db.close();
    }
    this.connections.clear();
  }

  /**
   * Run database migrations
   */
  private runMigrations(db: Database.Database): void {
    // Get current version
    const versionRow = db.prepare("SELECT value FROM _meta WHERE key = 'database_version'").get() as { value: string } | undefined;
    const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

    // Run migration for version 1 (initial schema)
    if (currentVersion < 1) {
      const schemaPath = path.join(__dirname, 'schemas', 'initial.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schema);
    }

    // Future migrations would go here
    // if (currentVersion < 2) { ... }
  }

  /**
   * Get the file path for a repository's database
   */
  getDatabasePath(repoId: string): string {
    return path.join(this.baseDir, `${repoId}.db`);
  }

  /**
   * Check if a repository database exists
   */
  databaseExists(repoId: string): boolean {
    return fs.existsSync(this.getDatabasePath(repoId));
  }
}

// Singleton instance
let instance: DatabaseManager | null = null;

export function getDatabaseManager(): DatabaseManager {
  if (!instance) {
    instance = new DatabaseManager();
  }
  return instance;
}
