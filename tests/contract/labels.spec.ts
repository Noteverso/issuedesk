import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LabelSchema, CreateLabelInputSchema } from '@issuedesk/shared';
import { z } from 'zod';

/**
 * IPC Contract Tests for Labels API
 * 
 * These tests validate the labels IPC API contract:
 * - Request/response schemas match specifications
 * - Data validation works correctly
 * - Error handling follows expected patterns
 */

describe('Labels IPC Contract', () => {
  describe('labels.list', () => {
    it('should return array of labels matching Label schema', () => {
      const mockResponse = {
        labels: [
          {
            id: 'bug',
            name: 'bug',
            color: 'd73a4a',
            description: 'Something is broken',
            issueCount: 5,
          },
          {
            id: 'enhancement',
            name: 'enhancement',
            color: 'a2eeef',
            description: null,
            issueCount: 3,
          },
        ],
      };

      // Validate response structure
      const LabelsListResponseSchema = z.object({
        labels: z.array(LabelSchema),
      });

      expect(() => LabelsListResponseSchema.parse(mockResponse)).not.toThrow();
      expect(mockResponse.labels).toHaveLength(2);
      expect(mockResponse.labels[0].name).toBe('bug');
    });

    it('should handle empty label list', () => {
      const mockResponse = {
        labels: [],
      };

      const LabelsListResponseSchema = z.object({
        labels: z.array(LabelSchema),
      });

      expect(() => LabelsListResponseSchema.parse(mockResponse)).not.toThrow();
      expect(mockResponse.labels).toHaveLength(0);
    });
  });

  describe('labels.create', () => {
    it('should validate required fields (name, color)', () => {
      const validInput = {
        name: 'bug',
        color: 'd73a4a',
        description: 'Something is broken',
      };

      expect(() => CreateLabelInputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid color format', () => {
      const invalidInput = {
        name: 'bug',
        color: '#d73a4a', // Should not have # prefix
      };

      expect(() => CreateLabelInputSchema.parse(invalidInput)).toThrow();
    });

    it('should reject color that is not 6 characters', () => {
      const invalidInput = {
        name: 'bug',
        color: 'fff', // Should be 6 characters
      };

      expect(() => CreateLabelInputSchema.parse(invalidInput)).toThrow();
    });

    it('should accept valid hex color without #', () => {
      const validInput = {
        name: 'bug',
        color: 'd73a4a',
      };

      expect(() => CreateLabelInputSchema.parse(validInput)).not.toThrow();
    });

    it('should allow optional description', () => {
      const inputWithoutDescription = {
        name: 'bug',
        color: 'd73a4a',
      };

      expect(() => CreateLabelInputSchema.parse(inputWithoutDescription)).not.toThrow();
    });

    it('should enforce name length limits (max 50)', () => {
      const invalidInput = {
        name: 'a'.repeat(51),
        color: 'd73a4a',
      };

      expect(() => CreateLabelInputSchema.parse(invalidInput)).toThrow();
    });

    it('should enforce description length limits (max 100)', () => {
      const invalidInput = {
        name: 'bug',
        color: 'd73a4a',
        description: 'a'.repeat(101),
      };

      expect(() => CreateLabelInputSchema.parse(invalidInput)).toThrow();
    });

    it('should return created label matching Label schema', () => {
      const mockResponse = {
        label: {
          id: 'bug',
          name: 'bug',
          color: 'd73a4a',
          description: 'Something is broken',
          issueCount: 0,
        },
      };

      const LabelCreateResponseSchema = z.object({
        label: LabelSchema,
      });

      expect(() => LabelCreateResponseSchema.parse(mockResponse)).not.toThrow();
      expect(mockResponse.label.name).toBe('bug');
      expect(mockResponse.label.color).toBe('d73a4a');
    });
  });

  describe('labels.update', () => {
    it('should validate update request with id and data', () => {
      const UpdateLabelRequestSchema = z.object({
        id: z.string().min(1),
        data: z.object({
          name: z.string().min(1).max(50).optional(),
          color: z.string().regex(/^[0-9a-fA-F]{6}$/).optional(),
          description: z.string().max(100).optional(),
        }),
      });

      const validRequest = {
        id: 'bug',
        data: {
          color: 'ff0000',
        },
      };

      expect(() => UpdateLabelRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should allow partial updates', () => {
      const UpdateLabelRequestSchema = z.object({
        id: z.string().min(1),
        data: z.object({
          name: z.string().min(1).max(50).optional(),
          color: z.string().regex(/^[0-9a-fA-F]{6}$/).optional(),
          description: z.string().max(100).optional(),
        }),
      });

      const partialUpdate = {
        id: 'bug',
        data: {
          description: 'Updated description',
        },
      };

      expect(() => UpdateLabelRequestSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should return updated label matching Label schema', () => {
      const mockResponse = {
        label: {
          id: 'bug',
          name: 'bug',
          color: 'ff0000',
          description: 'Updated description',
          issueCount: 5,
        },
      };

      const LabelUpdateResponseSchema = z.object({
        label: LabelSchema,
      });

      expect(() => LabelUpdateResponseSchema.parse(mockResponse)).not.toThrow();
    });
  });

  describe('labels.delete', () => {
    it('should validate delete request with id', () => {
      const LabelDeleteRequestSchema = z.object({
        id: z.string().min(1),
      });

      const validRequest = {
        id: 'bug',
      };

      expect(() => LabelDeleteRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should return success response', () => {
      const mockResponse = {
        success: true,
      };

      const LabelDeleteResponseSchema = z.object({
        success: z.boolean(),
      });

      expect(() => LabelDeleteResponseSchema.parse(mockResponse)).not.toThrow();
      expect(mockResponse.success).toBe(true);
    });

    it('should reject empty id', () => {
      const LabelDeleteRequestSchema = z.object({
        id: z.string().min(1),
      });

      const invalidRequest = {
        id: '',
      };

      expect(() => LabelDeleteRequestSchema.parse(invalidRequest)).toThrow();
    });
  });
});
