import type { FastifyInstance } from 'fastify';
import { makeTagsRepository } from '../repository/tags.repository.js';
import { makeTagsService } from '../service/tags.service.js';
import { makeTagsController } from '../controller/tags.controller.js';
import {
  createTagBodySchema,
  createTagResponseSchema,
  listTagsResponseSchema,
} from '../schemas/tags.schemas.js';

export async function tagsRoutes(app: FastifyInstance) {
  const repository = makeTagsRepository(app.prisma);
  const service = makeTagsService(repository);
  const controller = makeTagsController(service);

  app.get(
    '/',
    {
      schema: {
        tags: ['Tags'],
        summary: 'Listar todas as tags',
        response: { 200: listTagsResponseSchema },
      },
    },
    controller.listTags,
  );

  // Admin only: create tags to control vocabulary
  app.post(
    '/',
    {
      onRequest: [app.requireAdmin],
      schema: {
        tags: ['Tags'],
        summary: 'Criar tag (admin)',
        security: [{ bearerAuth: [] }],
        body: createTagBodySchema,
        response: { 201: createTagResponseSchema },
      },
    },
    controller.createTag,
  );
}
