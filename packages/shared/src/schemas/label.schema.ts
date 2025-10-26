import { z } from 'zod';

// Label validation schemas
export const LabelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/), // Hex color without #
  description: z.string().max(100).nullable(),
  issueCount: z.number().int().nonnegative(),
});

export const CreateLabelInputSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/),
  description: z.string().max(100).optional(),
});

export const UpdateLabelInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(100).optional(),
});
