import { z } from 'zod';

const tagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const createTagBodySchema = z.object({
  name: z.string().min(2).max(50),
});

export const listTagsResponseSchema = z.object({
  data: z.array(tagResponseSchema),
});

export const createTagResponseSchema = z.object({
  data: tagResponseSchema,
});
