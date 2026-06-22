import type { FastifyInstance } from 'fastify';
import { makeWorkSpotsRepository } from '../repository/workspots.repository.js';
import { makeTagsRepository } from '../../tags/repository/tags.repository.js';
import { makeWorkSpotsService } from '../service/workspots.service.js';
import { makeWorkSpotsController } from '../controller/workspots.controller.js';
import {
  createWorkSpotBodySchema,
  createWorkSpotResponseSchema,
  getWorkSpotResponseSchema,
  listWorkSpotsQuerySchema,
  listWorkSpotsResponseSchema,
  updateWorkSpotBodySchema,
  updateWorkSpotResponseSchema,
  workSpotIdParamsSchema,
} from '../schemas/workspots.schemas.js';

export async function workSpotsRoutes(app: FastifyInstance) {
  const repository = makeWorkSpotsRepository(app.prisma);
  const tagsRepository = makeTagsRepository(app.prisma);
  const service = makeWorkSpotsService(repository, tagsRepository);
  const controller = makeWorkSpotsController(service);

  app.get(
    '/',
    {
      schema: {
        querystring: listWorkSpotsQuerySchema,
        response: { 200: listWorkSpotsResponseSchema },
      },
    },
    controller.listWorkSpots,
  );

  app.get(
    '/:id',
    {
      schema: {
        params: workSpotIdParamsSchema,
        response: { 200: getWorkSpotResponseSchema },
      },
    },
    controller.getWorkSpotById,
  );

  app.post(
    '/',
    {
      onRequest: [app.authenticate],
      schema: {
        body: createWorkSpotBodySchema,
        response: { 201: createWorkSpotResponseSchema },
      },
    },
    controller.createWorkSpot,
  );

  app.put(
    '/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        params: workSpotIdParamsSchema,
        body: updateWorkSpotBodySchema,
        response: { 200: updateWorkSpotResponseSchema },
      },
    },
    controller.updateWorkSpot,
  );

  app.delete(
    '/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        params: workSpotIdParamsSchema,
      },
    },
    controller.deleteWorkSpot,
  );
}
