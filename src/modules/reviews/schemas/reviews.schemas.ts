import { z } from 'zod';

const authorSchema = z.object({ id: z.string(), name: z.string() });

const reviewResponseSchema = z.object({
  id: z.string(),
  workspotId: z.string(),
  content: z.string(),
  author: authorSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const workspotIdParamsSchema = z.object({
  workspotId: z.string().uuid(),
});

export const reviewIdParamsSchema = z.object({
  workspotId: z.string().uuid(),
  reviewId: z.string().uuid(),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createReviewBodySchema = z.object({
  content: z.string().min(10).max(2000),
});

export const updateReviewBodySchema = z.object({
  content: z.string().min(10).max(2000),
});

export const listReviewsResponseSchema = z.object({
  data: z.array(reviewResponseSchema),
  meta: paginatedMetaSchema,
});

export const reviewResponseWrapperSchema = z.object({
  data: reviewResponseSchema,
});
