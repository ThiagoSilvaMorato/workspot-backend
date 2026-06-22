import { z } from 'zod';

const ratingValue = z.number().int().min(1).max(5);

const ratingResponseSchema = z.object({
  id: z.string(),
  workspotId: z.string(),
  userId: z.string(),
  overall: z.number(),
  wifi: z.number().nullable(),
  noise: z.number().nullable(),
  powerOutlets: z.number().nullable(),
  comfort: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const workspotIdParamsSchema = z.object({
  workspotId: z.string().uuid(),
});

export const createRatingBodySchema = z.object({
  overall: ratingValue,
  wifi: ratingValue.optional(),
  noise: ratingValue.optional(),
  powerOutlets: ratingValue.optional(),
  comfort: ratingValue.optional(),
});

export const updateRatingBodySchema = z.object({
  overall: ratingValue.optional(),
  wifi: ratingValue.optional(),
  noise: ratingValue.optional(),
  powerOutlets: ratingValue.optional(),
  comfort: ratingValue.optional(),
});

export const ratingResponseWrapperSchema = z.object({
  data: ratingResponseSchema,
});
