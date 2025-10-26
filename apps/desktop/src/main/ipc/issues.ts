import { ipcMain } from 'electron';
import {
  IssueListRequestSchema,
  IssueGetRequestSchema,
  IssueCreateRequestSchema,
  IssueUpdateRequestSchema,
  IssueDeleteRequestSchema,
} from '@issuedesk/shared';
import { getDatabaseManager } from '../database/manager';
import { IssuesRepository } from '../database/repositories/issues';
import { getSettingsManager } from '../settings/manager';

/**
 * IPC handlers for issues operations
 * All handlers validate input with Zod schemas
 */

export function registerIssuesHandlers() {
  // Helper to get active repository database
  const getActiveDb = () => {
    const settings = getSettingsManager();
    const repoId = settings.getActiveRepositoryId();
    if (!repoId) {
      throw new Error('No active repository');
    }
    return getDatabaseManager().getDatabase(repoId);
  };

  // issues:list
  ipcMain.handle('issues:list', async (event, req) => {
    try {
      const validated = IssueListRequestSchema.parse(req);
      const db = getActiveDb();
      const repo = new IssuesRepository(db);

      return repo.list(
        validated.filter || {},
        validated.page || 1,
        validated.perPage || 50
      );
    } catch (error: any) {
      console.error('issues:list error:', error);
      throw {
        code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
        details: error.errors || undefined,
      };
    }
  });

  // issues:get
  ipcMain.handle('issues:get', async (event, req) => {
    try {
      const validated = IssueGetRequestSchema.parse(req);
      const db = getActiveDb();
      const repo = new IssuesRepository(db);

      const issue = repo.get(validated.id);
      return { issue };
    } catch (error: any) {
      console.error('issues:get error:', error);
      throw {
        code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
      };
    }
  });

  // issues:create
  ipcMain.handle('issues:create', async (event, req) => {
    try {
      const validated = IssueCreateRequestSchema.parse(req);
      const db = getActiveDb();
      const repo = new IssuesRepository(db);

      const issue = repo.create(validated);
      return { issue };
    } catch (error: any) {
      console.error('issues:create error:', error);
      throw {
        code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
      };
    }
  });

  // issues:update
  ipcMain.handle('issues:update', async (event, req) => {
    try {
      const validated = IssueUpdateRequestSchema.parse(req);
      const db = getActiveDb();
      const repo = new IssuesRepository(db);

      const issue = repo.update(validated.id, validated.data);
      if (!issue) {
        throw { code: 'NOT_FOUND', message: 'Issue not found' };
      }
      return { issue };
    } catch (error: any) {
      console.error('issues:update error:', error);
      throw {
        code: error.code || (error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
        message: error.message,
      };
    }
  });

  // issues:delete
  ipcMain.handle('issues:delete', async (event, req) => {
    try {
      const validated = IssueDeleteRequestSchema.parse(req);
      const db = getActiveDb();
      const repo = new IssuesRepository(db);

      const success = repo.delete(validated.id);
      return { success };
    } catch (error: any) {
      console.error('issues:delete error:', error);
      throw {
        code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
      };
    }
  });
}
