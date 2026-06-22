import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeWorkSpotsService } from '../service/workspots.service.js';
import type { CreateWorkSpotInput, UpdateWorkSpotInput } from '../types/workspots.types.js';

type WorkSpotsService = ReturnType<typeof makeWorkSpotsService>;

export function makeWorkSpotsController(service: WorkSpotsService) {
  async function listWorkSpots(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { city?: string; page: number; limit: number };
    const result = await service.listWorkSpots({
      city: query.city,
      page: query.page,
      limit: query.limit,
    });
    return reply.status(200).send(result);
  }

  async function getWorkSpotById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const workspot = await service.getWorkSpotById(id);
    return reply.status(200).send({ data: workspot });
  }

  async function createWorkSpot(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateWorkSpotInput;
    const workspot = await service.createWorkSpot(request.user, body);
    return reply.status(201).send({ data: workspot });
  }

  async function updateWorkSpot(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateWorkSpotInput;
    const workspot = await service.updateWorkSpot(id, request.user, body);
    return reply.status(200).send({ data: workspot });
  }

  async function deleteWorkSpot(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await service.deleteWorkSpot(id, request.user);
    return reply.status(204).send();
  }

  return { listWorkSpots, getWorkSpotById, createWorkSpot, updateWorkSpot, deleteWorkSpot };
}
