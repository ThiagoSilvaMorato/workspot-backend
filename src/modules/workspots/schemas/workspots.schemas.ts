import { z } from 'zod';

const tagSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

const addressSchema = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().nullable(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
});

const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const averageRatingsSchema = z.object({
  overall: z.number().nullable(),
  wifi: z.number().nullable(),
  noise: z.number().nullable(),
  powerOutlets: z.number().nullable(),
  comfort: z.number().nullable(),
  count: z.number(),
});

export const listWorkSpotsQuerySchema = z.object({
  city: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const workSpotIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createWorkSpotBodySchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{8}$/, 'CEP must contain 8 digits'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateWorkSpotBodySchema = z.object({
  name: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  street: z.string().min(1).max(200).optional(),
  number: z.string().min(1).max(20).optional(),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().regex(/^\d{8}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

const workSpotSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  city: z.string(),
  state: z.string(),
  tags: z.array(tagSummarySchema),
  averageOverall: z.number().nullable(),
  reviewCount: z.number(),
  createdAt: z.string(),
});

const workSpotDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  address: addressSchema,
  coordinates: coordinatesSchema,
  tags: z.array(tagSummarySchema),
  averageRatings: averageRatingsSchema,
  reviewCount: z.number(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const listWorkSpotsResponseSchema = z.object({
  data: z.array(workSpotSummarySchema),
  meta: paginatedMetaSchema,
});

export const getWorkSpotResponseSchema = z.object({
  data: workSpotDetailSchema,
});

export const createWorkSpotResponseSchema = z.object({
  data: workSpotDetailSchema,
});

export const updateWorkSpotResponseSchema = z.object({
  data: workSpotDetailSchema,
});
