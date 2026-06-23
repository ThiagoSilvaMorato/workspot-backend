import type { FastifyInstance } from 'fastify';
import { makeReviewsRepository } from '../repository/reviews.repository.js';
import { makeWorkSpotsRepository } from '../../workspots/repository/workspots.repository.js';
import { makeReviewsService } from '../service/reviews.service.js';
import { makeReviewsController } from '../controller/reviews.controller.js';
import {
  createReviewBodySchema,
  listReviewsQuerySchema,
  listReviewsResponseSchema,
  reviewIdParamsSchema,
  reviewResponseWrapperSchema,
  updateReviewBodySchema,
  workspotIdParamsSchema,
} from '../schemas/reviews.schemas.js';

export async function reviewsRoutes(app: FastifyInstance) {
  const repository = makeReviewsRepository(app.prisma);
  const workSpotsRepository = makeWorkSpotsRepository(app.prisma);
  const service = makeReviewsService(repository, workSpotsRepository);
  const controller = makeReviewsController(service);

  app.get(
    '/',
    {
      schema: {
        tags: ['Reviews'],
        summary: 'Listar reviews do espaço de trabalho',
        params: workspotIdParamsSchema,
        querystring: listReviewsQuerySchema,
        response: { 200: listReviewsResponseSchema },
      },
    },
    controller.listReviews,
  );

  app.post(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Reviews'],
        summary: 'Criar review',
        security: [{ bearerAuth: [] }],
        params: workspotIdParamsSchema,
        body: createReviewBodySchema,
        response: { 201: reviewResponseWrapperSchema },
      },
    },
    controller.createReview,
  );

  app.put(
    '/:reviewId',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Reviews'],
        summary: 'Atualizar review',
        security: [{ bearerAuth: [] }],
        params: reviewIdParamsSchema,
        body: updateReviewBodySchema,
        response: { 200: reviewResponseWrapperSchema },
      },
    },
    controller.updateReview,
  );

  app.delete(
    '/:reviewId',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Reviews'],
        summary: 'Remover review',
        security: [{ bearerAuth: [] }],
        params: reviewIdParamsSchema,
      },
    },
    controller.deleteReview,
  );
}
