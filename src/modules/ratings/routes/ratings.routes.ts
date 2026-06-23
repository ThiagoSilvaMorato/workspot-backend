import type { FastifyInstance } from 'fastify';
import { makeRatingsRepository } from '../repository/ratings.repository.js';
import { makeWorkSpotsRepository } from '../../workspots/repository/workspots.repository.js';
import { makeRatingsService } from '../service/ratings.service.js';
import { makeRatingsController } from '../controller/ratings.controller.js';
import {
  createRatingBodySchema,
  ratingResponseWrapperSchema,
  updateRatingBodySchema,
  workspotIdParamsSchema,
} from '../schemas/ratings.schemas.js';

export async function ratingsRoutes(app: FastifyInstance) {
  const repository = makeRatingsRepository(app.prisma);
  const workSpotsRepository = makeWorkSpotsRepository(app.prisma);
  const service = makeRatingsService(repository, workSpotsRepository);
  const controller = makeRatingsController(service);

  // All rating routes require authentication
  app.addHook('onRequest', app.authenticate);

  app.post(
    '/',
    {
      schema: {
        tags: ['Ratings'],
        summary: 'Criar avaliação',
        security: [{ bearerAuth: [] }],
        params: workspotIdParamsSchema,
        body: createRatingBodySchema,
        response: { 201: ratingResponseWrapperSchema },
      },
    },
    controller.createRating,
  );

  app.put(
    '/',
    {
      schema: {
        tags: ['Ratings'],
        summary: 'Atualizar avaliação',
        security: [{ bearerAuth: [] }],
        params: workspotIdParamsSchema,
        body: updateRatingBodySchema,
        response: { 200: ratingResponseWrapperSchema },
      },
    },
    controller.updateRating,
  );

  app.delete(
    '/',
    {
      schema: {
        tags: ['Ratings'],
        summary: 'Remover avaliação',
        security: [{ bearerAuth: [] }],
        params: workspotIdParamsSchema,
      },
    },
    controller.deleteRating,
  );
}
