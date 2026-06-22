import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeRatingsService } from '../service/ratings.service.js';
import type { CreateRatingInput, UpdateRatingInput } from '../types/ratings.types.js';

type RatingsService = ReturnType<typeof makeRatingsService>;

export function makeRatingsController(service: RatingsService) {
  async function createRating(request: FastifyRequest, reply: FastifyReply) {
    const { workspotId } = request.params as { workspotId: string };
    const body = request.body as CreateRatingInput;
    const rating = await service.createRating(workspotId, request.user, body);
    return reply.status(201).send({ data: rating });
  }

  async function updateRating(request: FastifyRequest, reply: FastifyReply) {
    const { workspotId } = request.params as { workspotId: string };
    const body = request.body as UpdateRatingInput;
    const rating = await service.updateRating(workspotId, request.user, body);
    return reply.status(200).send({ data: rating });
  }

  async function deleteRating(request: FastifyRequest, reply: FastifyReply) {
    const { workspotId } = request.params as { workspotId: string };
    await service.deleteRating(workspotId, request.user);
    return reply.status(204).send();
  }

  return { createRating, updateRating, deleteRating };
}
