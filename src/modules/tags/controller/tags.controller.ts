import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeTagsService } from '../service/tags.service.js';
import type { CreateTagInput } from '../types/tags.types.js';

type TagsService = ReturnType<typeof makeTagsService>;

export function makeTagsController(service: TagsService) {
  async function listTags(_request: FastifyRequest, reply: FastifyReply) {
    const tags = await service.listTags();
    return reply.status(200).send({ data: tags });
  }

  async function createTag(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateTagInput;
    const tag = await service.createTag(body);
    return reply.status(201).send({ data: tag });
  }

  return { listTags, createTag };
}
