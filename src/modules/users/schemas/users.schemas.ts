import { z } from 'zod';

const userPublicResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  createdAt: z.string(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateUserBodySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const paginatedMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const listUsersResponseSchema = z.object({
  data: z.array(userPublicResponseSchema),
  meta: paginatedMetaSchema,
});

export const getUserResponseSchema = z.object({
  data: userPublicResponseSchema,
});

export const updateUserResponseSchema = z.object({
  data: userPublicResponseSchema,
});
